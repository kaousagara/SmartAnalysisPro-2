import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from transformers import pipeline
import pickle
import os
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, Dataset
from sklearn.model_selection import train_test_split
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import logging

logger = logging.getLogger(__name__)

class ThreatScoringModel:
    def __init__(self, model_path: str = None):
        self.model_path = model_path or './models'
        self.intention_classifier = None
        self.scaler = StandardScaler()
        self.rf_model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.bert_classifier = None
        self.initialize_models()
    
    def initialize_models(self):
        """Initialize ML models for threat scoring"""
        try:
            # Initialize BERT for intention classification
            self.bert_classifier = pipeline(
                "text-classification",
                model="bert-base-uncased",
                return_all_scores=True
            )
            
            # Load pre-trained models if they exist
            if os.path.exists(os.path.join(self.model_path, 'threat_model.pkl')):
                with open(os.path.join(self.model_path, 'threat_model.pkl'), 'rb') as f:
                    self.rf_model = pickle.load(f)
            
            if os.path.exists(os.path.join(self.model_path, 'scaler.pkl')):
                with open(os.path.join(self.model_path, 'scaler.pkl'), 'rb') as f:
                    self.scaler = pickle.load(f)
                    
            logger.info("Threat scoring models initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing models: {str(e)}")
            raise
    
    def calculate_intention_probability(self, text: str) -> float:
        """Calculate probability of malicious intention using BERT"""
        try:
            if not text:
                return 0.0
            
            # Use BERT to classify the text
            results = self.bert_classifier(text)
            
            # Extract probability for threat-related content
            # This is a simplified approach - in production, you'd fine-tune BERT
            # on domain-specific threat intelligence data
            threat_probability = 0.0
            
            for result in results:
                if isinstance(result, list):
                    for item in result:
                        if 'threat' in item.get('label', '').lower():
                            threat_probability = max(threat_probability, item['score'])
            
            # Fallback: use keyword-based scoring
            if threat_probability == 0.0:
                threat_keywords = [
                    'attack', 'threat', 'malicious', 'exploit', 'vulnerability',
                    'breach', 'compromise', 'infiltration', 'coordination'
                ]
                
                text_lower = text.lower()
                keyword_matches = sum(1 for keyword in threat_keywords if keyword in text_lower)
                threat_probability = min(keyword_matches / len(threat_keywords), 1.0)
            
            return threat_probability
            
        except Exception as e:
            logger.error(f"Error calculating intention probability: {str(e)}")
            return 0.0
    
    def calculate_source_credibility(self, source_data: Dict) -> float:
        """Calculate source credibility using Elo-like rating system"""
        try:
            base_credibility = source_data.get('base_credibility', 0.5)
            historical_accuracy = source_data.get('historical_accuracy', 0.5)
            verification_count = source_data.get('verification_count', 0)
            
            # Bayesian adjustment
            credibility = (base_credibility + historical_accuracy * verification_count) / (1 + verification_count)
            
            return min(max(credibility, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating source credibility: {str(e)}")
            return 0.5
    
    def calculate_temporal_coherence(self, threat_data: Dict) -> float:
        """Calculate temporal coherence using time-series analysis"""
        try:
            timestamps = threat_data.get('timestamps', [])
            
            if len(timestamps) < 2:
                return 0.5
            
            # Convert to datetime objects
            dt_timestamps = [datetime.fromisoformat(ts.replace('Z', '+00:00')) for ts in timestamps]
            
            # Calculate time intervals
            intervals = []
            for i in range(1, len(dt_timestamps)):
                interval = (dt_timestamps[i] - dt_timestamps[i-1]).total_seconds()
                intervals.append(interval)
            
            # Calculate coefficient of variation (lower = more coherent)
            if len(intervals) > 0:
                mean_interval = np.mean(intervals)
                std_interval = np.std(intervals)
                
                if mean_interval > 0:
                    cv = std_interval / mean_interval
                    # Convert to coherence score (0-1, higher = more coherent)
                    coherence = max(0, 1 - cv)
                    return min(coherence, 1.0)
            
            return 0.5
            
        except Exception as e:
            logger.error(f"Error calculating temporal coherence: {str(e)}")
            return 0.5
    
    def calculate_network_density(self, network_data: Dict) -> float:
        """Calculate network density using graph centrality measures"""
        try:
            entities = network_data.get('entities', [])
            connections = network_data.get('connections', [])
            
            if len(entities) < 2:
                return 0.0
            
            # Create adjacency matrix
            entity_to_idx = {entity: idx for idx, entity in enumerate(entities)}
            n_entities = len(entities)
            adj_matrix = np.zeros((n_entities, n_entities))
            
            for connection in connections:
                src, dst = connection.get('source'), connection.get('target')
                if src in entity_to_idx and dst in entity_to_idx:
                    src_idx, dst_idx = entity_to_idx[src], entity_to_idx[dst]
                    adj_matrix[src_idx][dst_idx] = 1
                    adj_matrix[dst_idx][src_idx] = 1
            
            # Calculate network density
            total_possible_edges = n_entities * (n_entities - 1) // 2
            actual_edges = np.sum(adj_matrix) // 2
            
            density = actual_edges / total_possible_edges if total_possible_edges > 0 else 0.0
            
            return min(density, 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating network density: {str(e)}")
            return 0.0
    
    def calculate_threat_score(self, threat_data: Dict) -> float:
        """Calculate composite threat score using weighted components"""
        try:
            # Extract components
            intention_prob = self.calculate_intention_probability(
                threat_data.get('text', '')
            )
            
            source_credibility = self.calculate_source_credibility(
                threat_data.get('source', {})
            )
            
            temporal_coherence = self.calculate_temporal_coherence(threat_data)
            
            network_density = self.calculate_network_density(
                threat_data.get('network', {})
            )
            
            # Apply weights from configuration
            weights = {
                'intention_probability': 0.35,
                'source_credibility': 0.25,
                'temporal_coherence': 0.20,
                'network_density': 0.20
            }
            
            # Calculate weighted score
            threat_score = (
                weights['intention_probability'] * intention_prob +
                weights['source_credibility'] * source_credibility +
                weights['temporal_coherence'] * temporal_coherence +
                weights['network_density'] * network_density
            )
            
            return min(max(threat_score, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating threat score: {str(e)}")
            return 0.0
    
    def predict_threat_evolution(self, historical_scores: List[float]) -> Dict:
        """Predict threat score evolution using time series analysis"""
        try:
            if len(historical_scores) < 3:
                return {'prediction': historical_scores[-1] if historical_scores else 0.0, 'confidence': 0.5}
            
            # Simple linear regression for trend prediction
            x = np.arange(len(historical_scores))
            y = np.array(historical_scores)
            
            # Calculate trend
            slope = np.polyfit(x, y, 1)[0]
            
            # Predict next value
            next_value = historical_scores[-1] + slope
            next_value = min(max(next_value, 0.0), 1.0)
            
            # Calculate confidence based on trend consistency
            confidence = 1.0 - np.std(historical_scores) / np.mean(historical_scores) if np.mean(historical_scores) > 0 else 0.5
            confidence = min(max(confidence, 0.0), 1.0)
            
            return {
                'prediction': next_value,
                'confidence': confidence,
                'trend': 'increasing' if slope > 0 else 'decreasing' if slope < 0 else 'stable'
            }
            
        except Exception as e:
            logger.error(f"Error predicting threat evolution: {str(e)}")
            return {'prediction': 0.0, 'confidence': 0.0, 'trend': 'unknown'}
    
    def save_model(self):
        """Save trained model to disk"""
        try:
            os.makedirs(self.model_path, exist_ok=True)
            
            with open(os.path.join(self.model_path, 'threat_model.pkl'), 'wb') as f:
                pickle.dump(self.rf_model, f)
            
            with open(os.path.join(self.model_path, 'scaler.pkl'), 'wb') as f:
                pickle.dump(self.scaler, f)
                
            logger.info("Model saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving model: {str(e)}")
            raise
