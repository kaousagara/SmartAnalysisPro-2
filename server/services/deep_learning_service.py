import numpy as np
from typing import Dict, List, Optional, Tuple
import logging
import os
import json
from datetime import datetime
from config import Config
from database import Database

# Try to import PyTorch, fall back to simulation mode if not available
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from models.deep_learning_models import DeepLearningThreatEngine
    PYTORCH_AVAILABLE = True
except ImportError:
    PYTORCH_AVAILABLE = False

logger = logging.getLogger(__name__)

class DeepLearningService:
    """Service principal pour l'intégration des modèles deep learning"""
    
    def __init__(self):
        self.db = Database()
        self.model_path = Config.ML_MODEL_PATH
        self.is_training = False
        self.simulation_mode = not PYTORCH_AVAILABLE
        
        if PYTORCH_AVAILABLE:
            self.engine = DeepLearningThreatEngine()
        else:
            self.engine = None
            logger.warning("PyTorch not available, running in simulation mode")
        
    def initialize_models(self):
        """Initialiser et charger les modèles deep learning"""
        try:
            # Créer le dossier de modèles s'il n'existe pas
            os.makedirs(self.model_path, exist_ok=True)
            
            if self.simulation_mode:
                logger.info("Mode simulation activé - pas d'entraînement requis")
                return True
            
            # Vérifier si les modèles existent, sinon les entraîner
            if not self._models_exist():
                logger.info("Aucun modèle pré-entraîné trouvé. Entraînement initial...")
                self._train_initial_models()
            
            logger.info("Modèles deep learning initialisés avec succès")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de l'initialisation des modèles: {str(e)}")
            return False
    
    def _models_exist(self) -> bool:
        """Vérifier si les modèles pré-entraînés existent"""
        if self.simulation_mode:
            return True  # En mode simulation, on considère que les modèles existent
            
        model_files = [
            f"{self.model_path}/threat_lstm.pth",
            f"{self.model_path}/threat_autoencoder.pth",
            f"{self.model_path}/attention_classifier.pth"
        ]
        
        return all(os.path.exists(f) for f in model_files)
    
    def _train_initial_models(self):
        """Entraîner les modèles initiaux avec des données simulées"""
        logger.info("Génération de données d'entraînement initiales...")
        
        # Générer des données d'entraînement simulées
        train_data = self._generate_training_data()
        
        # Entraîner le modèle LSTM
        self._train_lstm_model(train_data['lstm'])
        
        # Entraîner l'autoencoder
        self._train_autoencoder(train_data['autoencoder'])
        
        # Entraîner le classifieur attention
        self._train_attention_classifier(train_data['attention'])
        
        # Sauvegarder les modèles
        self.engine.save_models()
        
        logger.info("Entraînement initial terminé")
    
    def _generate_training_data(self) -> Dict:
        """Générer des données d'entraînement simulées"""
        np.random.seed(42)
        
        # Données pour LSTM (séquences temporelles)
        lstm_data = []
        for _ in range(1000):
            sequence_length = np.random.randint(5, 20)
            sequence = []
            for _ in range(sequence_length):
                features = np.random.normal(0.5, 0.2, 10)
                features = np.clip(features, 0, 1)
                sequence.append(features.tolist())
            
            # Target basé sur la tendance
            target = np.mean([s[0] for s in sequence[-3:]])
            lstm_data.append({
                'sequence': sequence,
                'target': target
            })
        
        # Données pour autoencoder (détection d'anomalies)
        autoencoder_data = []
        for _ in range(1000):
            # Données normales
            normal_features = np.random.normal(0.5, 0.1, 50)
            normal_features = np.clip(normal_features, 0, 1)
            autoencoder_data.append({
                'features': normal_features.tolist(),
                'is_anomaly': False
            })
            
            # Quelques anomalies
            if np.random.random() < 0.1:
                anomaly_features = np.random.normal(0.8, 0.3, 50)
                anomaly_features = np.clip(anomaly_features, 0, 1)
                autoencoder_data.append({
                    'features': anomaly_features.tolist(),
                    'is_anomaly': True
                })
        
        # Données pour classifieur attention
        attention_data = []
        classes = ['low', 'medium', 'high', 'critical']
        for _ in range(1000):
            # Simuler des embeddings BERT
            doc_count = np.random.randint(1, 5)
            embeddings = []
            for _ in range(doc_count):
                embedding = np.random.normal(0, 1, 768)
                embeddings.append(embedding.tolist())
            
            # Classe aléatoire
            class_label = np.random.choice(classes)
            attention_data.append({
                'embeddings': embeddings,
                'class': class_label
            })
        
        return {
            'lstm': lstm_data,
            'autoencoder': autoencoder_data,
            'attention': attention_data
        }
    
    def _train_lstm_model(self, train_data: List[Dict]):
        """Entraîner le modèle LSTM"""
        logger.info("Entraînement du modèle LSTM...")
        
        # Préparer les données
        X, y = [], []
        for item in train_data:
            X.append(item['sequence'])
            y.append(item['target'])
        
        # Padder les séquences
        max_len = max(len(seq) for seq in X)
        X_padded = []
        for seq in X:
            padded = seq + [[0] * 10] * (max_len - len(seq))
            X_padded.append(padded)
        
        X_tensor = torch.FloatTensor(X_padded)
        y_tensor = torch.FloatTensor(y).unsqueeze(1)
        
        # Entraînement
        model = self.engine.lstm_model
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)
        
        model.train()
        for epoch in range(50):
            optimizer.zero_grad()
            outputs = model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()
            
            if epoch % 10 == 0:
                logger.info(f"LSTM Epoch {epoch}, Loss: {loss.item():.4f}")
    
    def _train_autoencoder(self, train_data: List[Dict]):
        """Entraîner l'autoencoder"""
        logger.info("Entraînement de l'autoencoder...")
        
        # Préparer les données (seulement les normales pour l'autoencoder)
        X = []
        for item in train_data:
            if not item['is_anomaly']:
                X.append(item['features'])
        
        X_tensor = torch.FloatTensor(X)
        
        # Entraînement
        model = self.engine.autoencoder
        criterion = nn.MSELoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)
        
        model.train()
        for epoch in range(50):
            optimizer.zero_grad()
            outputs = model(X_tensor)
            loss = criterion(outputs, X_tensor)
            loss.backward()
            optimizer.step()
            
            if epoch % 10 == 0:
                logger.info(f"Autoencoder Epoch {epoch}, Loss: {loss.item():.4f}")
    
    def _train_attention_classifier(self, train_data: List[Dict]):
        """Entraîner le classifieur attention"""
        logger.info("Entraînement du classifieur attention...")
        
        # Préparer les données
        X, y = [], []
        classes = ['low', 'medium', 'high', 'critical']
        
        for item in train_data:
            # Moyenner les embeddings des documents
            embeddings = np.array(item['embeddings'])
            if embeddings.shape[0] > 0:
                mean_embedding = np.mean(embeddings, axis=0)
                X.append(mean_embedding)
                y.append(classes.index(item['class']))
        
        X_tensor = torch.FloatTensor(X).unsqueeze(1)  # Add sequence dimension
        y_tensor = torch.LongTensor(y)
        
        # Entraînement
        model = self.engine.attention_classifier
        criterion = nn.CrossEntropyLoss()
        optimizer = optim.Adam(model.parameters(), lr=0.001)
        
        model.train()
        for epoch in range(50):
            optimizer.zero_grad()
            outputs = model(X_tensor)
            loss = criterion(outputs, y_tensor)
            loss.backward()
            optimizer.step()
            
            if epoch % 10 == 0:
                logger.info(f"Attention Classifier Epoch {epoch}, Loss: {loss.item():.4f}")
    
    def predict_threat_evolution(self, threat_id: str) -> Dict:
        """Prédire l'évolution d'une menace avec deep learning"""
        try:
            # Récupérer l'historique de la menace
            history = self._get_threat_history(threat_id)
            
            if not history:
                return {
                    'error': 'Historique insuffisant',
                    'threat_id': threat_id
                }
            
            if self.simulation_mode:
                # Mode simulation sans PyTorch
                result = self._simulate_lstm_prediction(history)
            else:
                # Utiliser le modèle LSTM pour la prédiction
                result = self.engine.predict_threat_evolution(history)
                
            result['threat_id'] = threat_id
            result['timestamp'] = datetime.now().isoformat()
            result['model_type'] = 'lstm'
            result['simulation_mode'] = self.simulation_mode
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur prédiction évolution: {str(e)}")
            return {
                'error': str(e),
                'threat_id': threat_id
            }
    
    def detect_threat_anomalies(self, threat_data: Dict) -> Dict:
        """Détecter des anomalies dans une menace"""
        try:
            if self.simulation_mode:
                result = self._simulate_anomaly_detection(threat_data)
            else:
                result = self.engine.detect_anomalies(threat_data)
                
            result['threat_id'] = threat_data.get('id', 'unknown')
            result['timestamp'] = datetime.now().isoformat()
            result['model_type'] = 'autoencoder'
            result['simulation_mode'] = self.simulation_mode
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur détection anomalies: {str(e)}")
            return {
                'error': str(e),
                'is_anomaly': False
            }
    
    def classify_threat_severity(self, threat_documents: List[str]) -> Dict:
        """Classifier la sévérité d'une menace avec attention"""
        try:
            if not threat_documents:
                return {
                    'error': 'Aucun document fourni',
                    'predicted_class': 'medium'
                }
            
            if self.simulation_mode:
                result = self._simulate_severity_classification(threat_documents)
            else:
                result = self.engine.classify_with_attention(threat_documents)
                
            result['timestamp'] = datetime.now().isoformat()
            result['model_type'] = 'attention'
            result['document_count'] = len(threat_documents)
            result['simulation_mode'] = self.simulation_mode
            
            return result
            
        except Exception as e:
            logger.error(f"Erreur classification sévérité: {str(e)}")
            return {
                'error': str(e),
                'predicted_class': 'medium'
            }
    
    def _get_threat_history(self, threat_id: str) -> List[Dict]:
        """Récupérer l'historique d'une menace"""
        try:
            # Simuler l'historique pour le moment
            # En production, récupérer depuis la base de données
            history = []
            base_score = np.random.random()
            
            for i in range(10):
                score = base_score + np.random.normal(0, 0.1)
                score = np.clip(score, 0, 1)
                
                history.append({
                    'score': float(score),
                    'confidence': float(np.random.uniform(0.6, 0.9)),
                    'source_credibility': float(np.random.uniform(0.5, 0.8)),
                    'temporal_coherence': float(np.random.uniform(0.4, 0.9)),
                    'network_density': float(np.random.uniform(0.3, 0.7)),
                    'entity_count': int(np.random.randint(1, 20)),
                    'keyword_density': float(np.random.uniform(0.2, 0.8)),
                    'sentiment_score': float(np.random.uniform(-0.5, 0.5)),
                    'urgency_level': float(np.random.uniform(0.3, 0.9)),
                    'geographic_risk': float(np.random.uniform(0.2, 0.8)),
                    'timestamp': datetime.now().isoformat()
                })
            
            return history
            
        except Exception as e:
            logger.error(f"Erreur récupération historique: {str(e)}")
            return []
    
    def get_model_statistics(self) -> Dict:
        """Obtenir les statistiques des modèles"""
        try:
            stats = {
                'models_loaded': self._models_exist(),
                'device': 'cpu' if self.simulation_mode else str(self.engine.device),
                'model_path': self.model_path,
                'is_training': self.is_training,
                'simulation_mode': self.simulation_mode,
                'pytorch_available': PYTORCH_AVAILABLE,
                'last_update': datetime.now().isoformat()
            }
            
            # Statistiques des modèles
            if self.simulation_mode:
                stats['lstm_parameters'] = 42576  # Simulation
                stats['autoencoder_parameters'] = 8652  # Simulation
                stats['attention_parameters'] = 1248768  # Simulation
            elif self._models_exist():
                stats['lstm_parameters'] = sum(p.numel() for p in self.engine.lstm_model.parameters())
                stats['autoencoder_parameters'] = sum(p.numel() for p in self.engine.autoencoder.parameters())
                stats['attention_parameters'] = sum(p.numel() for p in self.engine.attention_classifier.parameters())
            
            return stats
            
        except Exception as e:
            logger.error(f"Erreur statistiques modèles: {str(e)}")
            return {'error': str(e)}
    
    def retrain_models(self, threat_data: List[Dict]) -> Dict:
        """Réentraîner les modèles avec de nouvelles données"""
        try:
            if self.is_training:
                return {'error': 'Entraînement déjà en cours'}
            
            self.is_training = True
            logger.info("Début du réentraînement des modèles...")
            
            # Convertir les données de menace en format d'entraînement
            training_data = self._convert_threat_data_for_training(threat_data)
            
            # Réentraîner chaque modèle
            if training_data['lstm']:
                self._train_lstm_model(training_data['lstm'])
            
            if training_data['autoencoder']:
                self._train_autoencoder(training_data['autoencoder'])
            
            if training_data['attention']:
                self._train_attention_classifier(training_data['attention'])
            
            # Sauvegarder les modèles mis à jour
            self.engine.save_models()
            
            self.is_training = False
            logger.info("Réentraînement terminé avec succès")
            
            return {
                'success': True,
                'message': 'Modèles réentraînés avec succès',
                'data_count': len(threat_data),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.is_training = False
            logger.error(f"Erreur réentraînement: {str(e)}")
            return {'error': str(e)}
    
    def _convert_threat_data_for_training(self, threat_data: List[Dict]) -> Dict:
        """Convertir les données de menace en format d'entraînement"""
        lstm_data = []
        autoencoder_data = []
        attention_data = []
        
        for threat in threat_data:
            # Données LSTM - utiliser l'historique si disponible
            if threat.get('history'):
                lstm_data.append({
                    'sequence': threat['history'],
                    'target': threat.get('score', 0.5)
                })
            
            # Données autoencoder - caractéristiques de la menace
            features = []
            features.append(threat.get('score', 0.5))
            features.append(threat.get('confidence', 0.5))
            features.append(len(threat.get('text', '')))
            features.append(threat.get('source_credibility', 0.5))
            
            # Remplir jusqu'à 50 caractéristiques
            while len(features) < 50:
                features.append(0.0)
            
            autoencoder_data.append({
                'features': features[:50],
                'is_anomaly': threat.get('is_anomaly', False)
            })
            
            # Données attention - documents de la menace
            if threat.get('documents'):
                attention_data.append({
                    'embeddings': [[0.0] * 768] * len(threat['documents']),  # Placeholder
                    'class': threat.get('severity', 'medium')
                })
        
        return {
            'lstm': lstm_data,
            'autoencoder': autoencoder_data,
            'attention': attention_data
        }
    
    def _simulate_lstm_prediction(self, history: List[Dict]) -> Dict:
        """Simulation de prédiction LSTM sans PyTorch"""
        # Calculer des métriques basées sur l'historique
        scores = [h.get('score', 0.5) for h in history]
        avg_score = np.mean(scores)
        trend = np.mean(np.diff(scores)) if len(scores) > 1 else 0
        
        # Prédire le prochain score avec une variabilité réaliste
        next_score = np.clip(avg_score + trend + np.random.normal(0, 0.1), 0, 1)
        
        # Calculer la confiance basée sur la stabilité
        confidence = max(0.1, 1.0 - np.std(scores))
        
        return {
            'next_score': float(next_score),
            'confidence': float(confidence),
            'trend_analysis': {
                'trend': 'increasing' if trend > 0 else 'decreasing',
                'acceleration': float(trend),
                'volatility': float(np.std(scores)),
                'momentum': float(trend)
            },
            'risk_factors': self._generate_risk_factors(avg_score, trend)
        }
    
    def _simulate_anomaly_detection(self, threat_data: Dict) -> Dict:
        """Simulation de détection d'anomalies sans PyTorch"""
        # Calculer un score d'anomalie basé sur les caractéristiques
        score = threat_data.get('score', 0.5)
        confidence = threat_data.get('confidence', 0.5)
        text_length = len(threat_data.get('text', ''))
        
        # Logique d'anomalie simple
        anomaly_score = 0.0
        if score > 0.8 or score < 0.2:
            anomaly_score += 0.3
        if confidence < 0.3:
            anomaly_score += 0.2
        if text_length > 1000 or text_length < 10:
            anomaly_score += 0.25
        
        # Ajouter du bruit réaliste
        anomaly_score += np.random.normal(0, 0.1)
        anomaly_score = np.clip(anomaly_score, 0, 1)
        
        is_anomaly = anomaly_score > 0.4
        
        return {
            'is_anomaly': bool(is_anomaly),
            'anomaly_score': float(anomaly_score),
            'reconstruction_error': float(anomaly_score * 0.1),
            'explanation': self._generate_anomaly_explanation(score, confidence, text_length)
        }
    
    def _simulate_severity_classification(self, documents: List[str]) -> Dict:
        """Simulation de classification de sévérité sans PyTorch"""
        # Analyser les documents pour déterminer la sévérité
        severity_keywords = {
            'critical': ['critique', 'urgent', 'immédiat', 'grave', 'alerte'],
            'high': ['élevé', 'important', 'sérieux', 'majeur'],
            'medium': ['moyen', 'modéré', 'standard'],
            'low': ['faible', 'mineur', 'léger']
        }
        
        scores = {'low': 0.25, 'medium': 0.35, 'high': 0.25, 'critical': 0.15}
        
        # Analyser les documents
        for doc in documents:
            doc_lower = doc.lower()
            for severity, keywords in severity_keywords.items():
                for keyword in keywords:
                    if keyword in doc_lower:
                        scores[severity] += 0.1
        
        # Normaliser les scores
        total = sum(scores.values())
        probabilities = {k: v/total for k, v in scores.items()}
        
        # Prédire la classe
        predicted_class = max(probabilities, key=probabilities.get)
        confidence = probabilities[predicted_class]
        
        return {
            'predicted_class': predicted_class,
            'probabilities': probabilities,
            'confidence': float(confidence),
            'attention_weights': [0.1, 0.3, 0.4, 0.2]  # Simulation
        }
    
    def _generate_risk_factors(self, avg_score: float, trend: float) -> List[str]:
        """Générer des facteurs de risque basés sur les métriques"""
        factors = []
        if avg_score > 0.8:
            factors.append("Score de menace critique")
        if trend > 0.1:
            factors.append("Tendance d'escalade rapide")
        if avg_score < 0.3:
            factors.append("Confiance faible dans l'évaluation")
        return factors
    
    def _generate_anomaly_explanation(self, score: float, confidence: float, text_length: int) -> str:
        """Générer une explication d'anomalie"""
        if score > 0.8:
            return "Score de menace inhabituel (très élevé)"
        elif score < 0.2:
            return "Score de menace inhabituel (très faible)"
        elif confidence < 0.3:
            return "Niveau de confiance anormalement bas"
        elif text_length > 1000:
            return "Longueur de texte atypique (trop long)"
        elif text_length < 10:
            return "Longueur de texte atypique (trop court)"
        else:
            return "Anomalie détectée dans les caractéristiques"

# Instance globale du service
deep_learning_service = DeepLearningService()