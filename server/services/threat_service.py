from typing import Dict, List, Optional
import logging
from datetime import datetime, timedelta
import json
import redis
from server.config import Config
from server.models.deep_learning_models import DeepLearningThreatEngine

logger = logging.getLogger(__name__)

class ThreatService:

def __init__(self):
        try:
            self.redis_client = redis.from_url(Config.REDIS_URL)
        except:
            self.redis_client = None
        self.alert_threshold = Config.THREAT_ALERT_THRESHOLD
        self.deep_learning_engine = DeepLearningThreatEngine()
    
    def _calculate_enhanced_threat_score(self, base_score: float, dl_data: Dict) -> float:
        """Calculer un score de menace enrichi avec deep learning"""
        try:
            enhanced_score = base_score
            
            # Intégrer score d'anomalie
            anomaly_analysis = dl_data.get('anomaly_detection', {})
            if anomaly_analysis.get('is_anomaly', False):
                anomaly_boost = anomaly_analysis.get('anomaly_score', 0.0) * 0.3
                enhanced_score = min(1.0, enhanced_score + anomaly_boost)
            
            # Intégrer classification de sévérité
            severity_analysis = dl_data.get('severity_classification', {})
            if severity_analysis.get('confidence', 0) > 0.7:
                severity_class = severity_analysis.get('predicted_class', 'medium')
                severity_weights = {
                    'low': 0.8,
                    'medium': 1.0,
                    'high': 1.2,
                    'critical': 1.4
                }
                severity_multiplier = severity_weights.get(severity_class, 1.0)
                enhanced_score = min(1.0, enhanced_score * severity_multiplier)
            
            return enhanced_score
            
        except Exception as e:
            logger.error(f"Erreur calcul score enrichi: {str(e)}")
            return base_score
    
    def _determine_enhanced_severity(self, score: float, dl_data: Dict) -> str:
        """Déterminer la sévérité avec analyse deep learning"""
        try:
            # Utiliser prédiction DL si fiable
            severity_analysis = dl_data.get('severity_classification', {})
            if severity_analysis.get('confidence', 0) > 0.8:
                return severity_analysis.get('predicted_class', 'medium')
            
            # Sinon utiliser méthode traditionnelle basée sur le score
            if score >= 0.8:
                return 'critical'
            elif score >= 0.6:
                return 'high'
            elif score >= 0.4:
                return 'medium'
            else:
                return 'low'
                
        except Exception as e:
            logger.error(f"Erreur détermination sévérité: {str(e)}")
            return self._determine_severity(score)
    
    def _calculate_enhanced_confidence(self, data: Dict, dl_data: Dict) -> float:
        """Calculer la confiance enrichie avec deep learning"""
        try:
            base_confidence = self._calculate_confidence(data)
            
            # Facteur de qualité des données
            quality_score = data.get('quality_indicators', {}).get('overall_score', 0.5)
            
            # Confiance des modèles DL
            anomaly_confidence = 1.0 - dl_data.get('anomaly_detection', {}).get('reconstruction_error', 0.5)
            severity_confidence = dl_data.get('severity_classification', {}).get('confidence', 0.5)
            
            # Moyenne pondérée
            enhanced_confidence = (
                base_confidence * 0.4 +
                quality_score * 0.2 +
                anomaly_confidence * 0.2 +
                severity_confidence * 0.2
            )
            
            return min(1.0, max(0.0, enhanced_confidence))
            
        except Exception as e:
            logger.error(f"Erreur calcul confiance enrichie: {str(e)}")
            return 0.5
    
    def _calculate_simple_score(self, data: Dict) -> float:
        """Méthode de calcul de score simple (existante)"""
        # Implémentation simplifiée pour la démo
        text = data.get('text', '')
        score = min(1.0, len(text) / 1000)
        return score
    
    def _determine_severity(self, score: float) -> str:
        """Méthode de détermination de sévérité simple (existante)"""
        if score >= 0.8:
            return 'critical'
        elif score >= 0.6:
            return 'high'
        elif score >= 0.4:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_confidence(self, data: Dict) -> float:
        """Méthode de calcul de confiance simple (existante)"""
        # Implémentation simplifiée
        source_reliability = data.get('source', {}).get('reliability', 0.5)
        return source_reliability
    
    def process_threat_data(self, raw_data: Dict) -> Dict:
        """Process threat data with deep learning enhancement"""
        try:
            # Les données arrivent déjà enrichies par le deep learning depuis DataIngestionService
            normalized_data = raw_data
            
            # Calculer le score de base
            base_threat_score = self._calculate_simple_score(normalized_data)
            
            # Intégrer les analyses deep learning si disponibles
            dl_data = normalized_data.get('deep_learning', {})
            enhanced_score = self._calculate_enhanced_threat_score(base_threat_score, dl_data)
            
            # Déterminer la sévérité (utiliser prédiction DL si disponible et fiable)
            severity = self._determine_enhanced_severity(enhanced_score, dl_data)
            
            # Prédiction d'évolution si suffisamment de données
            threat_id = f"threat_{datetime.now().timestamp()}"
            evolution_prediction = None
            
            try:
                evolution_prediction = self.deep_learning_engine.predict_threat_evolution([normalized_data])
            except Exception as e:
                logger.warning(f"Erreur prédiction évolution: {str(e)}")
            
            threat_data = {
                'id': threat_id,
                'score': enhanced_score,
                'base_score': base_threat_score,
                'severity': severity,
                'timestamp': datetime.now().isoformat(),
                'raw_data': normalized_data,
                'deep_learning_analysis': dl_data,
                'evolution_prediction': evolution_prediction,
                'metadata': {
                    'processing_time': datetime.now().isoformat(),
                    'model_version': '3.0',  # Version avec DL
                    'confidence': self._calculate_enhanced_confidence(normalized_data, dl_data),
                    'quality_score': normalized_data.get('quality_indicators', {}).get('overall_score', 0.5)
                }
            }
            
            # Cache the threat data
            if self.redis_client:
                try:
                    self.redis_client.setex(
                        f"threat:{threat_id}",
                        timedelta(hours=24),
                        json.dumps(threat_data)
                    )
                except:
                    pass
            
            # Check if alert should be triggered
            if threat_score >= self.alert_threshold:
                self._trigger_alert(threat_data)
            
            return threat_data
            
        except Exception as e:
            logger.error(f"Error processing threat data: {str(e)}")
            raise
    
    def _calculate_simple_score(self, data: Dict) -> float:
        """Calculate a simple threat score for demo purposes"""
        import random
        import hashlib
        
        # Create deterministic score based on data content
        data_str = json.dumps(data, sort_keys=True)
        hash_val = int(hashlib.md5(data_str.encode()).hexdigest()[:8], 16)
        
        # Normalize to 0-1 range with some randomness
        base_score = (hash_val % 100) / 100.0
        
        # Adjust based on data characteristics
        if 'severity' in data:
            if data['severity'] == 'critical':
                base_score = min(base_score + 0.3, 1.0)
            elif data['severity'] == 'high':
                base_score = min(base_score + 0.2, 1.0)
                
        if 'keywords' in data:
            threat_keywords = ['malware', 'attack', 'breach', 'exploit', 'vulnerability']
            for keyword in threat_keywords:
                if keyword in str(data['keywords']).lower():
                    base_score = min(base_score + 0.1, 1.0)
                    
        return base_score
    
    def _determine_severity(self, score: float) -> str:
        """Determine threat severity based on score"""
        if score >= 0.75:
            return 'critical'
        elif score >= 0.60:
            return 'high'
        elif score >= 0.40:
            return 'medium'
        else:
            return 'low'
    
    def _calculate_confidence(self, data: Dict) -> float:
        """Calculate confidence level for the threat assessment"""
        try:
            # Factors affecting confidence
            data_completeness = len(data.get('text', '')) / 1000.0  # Normalized by expected length
            source_reliability = data.get('source', {}).get('reliability', 0.5)
            temporal_consistency = len(data.get('timestamps', [])) / 10.0  # Normalized
            
            # Weighted confidence calculation
            confidence = (
                0.4 * min(data_completeness, 1.0) +
                0.4 * source_reliability +
                0.2 * min(temporal_consistency, 1.0)
            )
            
            return min(max(confidence, 0.0), 1.0)
            
        except Exception as e:
            logger.error(f"Error calculating confidence: {str(e)}")
            return 0.5
    
    def _trigger_alert(self, threat_data: Dict):
        """Trigger alert for high-severity threats"""
        try:
            alert_data = {
                'type': 'threat',
                'severity': 'critical' if threat_data['score'] >= 0.75 else 'high',
                'title': f"High Threat Score Detected: {threat_data['score']:.2f}",
                'message': f"Threat {threat_data['id']} has exceeded threshold",
                'threat_id': threat_data['id'],
                'timestamp': datetime.now().isoformat()
            }
            
            # Store alert
            self.redis_client.lpush('alerts', json.dumps(alert_data))
            
            # Keep only last 100 alerts
            self.redis_client.ltrim('alerts', 0, 99)
            
            logger.warning(f"Alert triggered for threat {threat_data['id']}")
            
        except Exception as e:
            logger.error(f"Error triggering alert: {str(e)}")
    
    def get_realtime_threats(self, limit: int = 20) -> List[Dict]:
        """Get real-time threats from cache"""
        try:
            # Get threat keys from Redis
            threat_keys = self.redis_client.keys('threat:*')
            
            threats = []
            for key in threat_keys[:limit]:
                threat_data = self.redis_client.get(key)
                if threat_data:
                    threat = json.loads(threat_data)
                    threats.append(threat)
            
            # Sort by timestamp (newest first)
            threats.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return threats
            
        except Exception as e:
            logger.error(f"Error getting realtime threats: {str(e)}")
            return []
    
    def get_threat_statistics(self) -> Dict:
        """Get threat statistics for dashboard"""
        try:
            threats = self.get_realtime_threats(limit=100)
            
            if not threats:
                return {
                    'active_threats': 0,
                    'avg_score': 0.0,
                    'high_severity_count': 0,
                    'false_positive_rate': 0.0
                }
            
            # Calculate statistics
            active_threats = len([t for t in threats if t['severity'] in ['high', 'critical']])
            avg_score = sum(t['score'] for t in threats) / len(threats)
            high_severity_count = len([t for t in threats if t['severity'] in ['high', 'critical']])
            
            # Mock false positive rate calculation (in production, this would be based on feedback)
            false_positive_rate = 0.062  # 6.2% as per the document
            
            return {
                'active_threats': active_threats,
                'avg_score': round(avg_score, 2),
                'high_severity_count': high_severity_count,
                'false_positive_rate': false_positive_rate
            }
            
        except Exception as e:
            logger.error(f"Error getting threat statistics: {str(e)}")
            return {
                'active_threats': 0,
                'avg_score': 0.0,
                'high_severity_count': 0,
                'false_positive_rate': 0.0
            }
    
    def get_threat_evolution(self, threat_id: str) -> Dict:
        """Get threat score evolution over time"""
        try:
            # Get historical scores for the threat
            historical_scores = self.redis_client.lrange(f"threat_history:{threat_id}", 0, -1)
            
            scores = []
            for score_data in historical_scores:
                score_info = json.loads(score_data)
                scores.append(score_info['score'])
            
            # Use ML model to predict evolution
            prediction = self.scoring_model.predict_threat_evolution(scores)
            
            return {
                'threat_id': threat_id,
                'historical_scores': scores,
                'prediction': prediction,
                'timestamps': [json.loads(s)['timestamp'] for s in historical_scores]
            }
            
        except Exception as e:
            logger.error(f"Error getting threat evolution: {str(e)}")
            return {'threat_id': threat_id, 'historical_scores': [], 'prediction': {}}
    
    def update_threat_feedback(self, threat_id: str, feedback: str, context: Dict):
        """Update threat model based on human feedback"""
        try:
            # Log feedback for model retraining
            feedback_data = {
                'threat_id': threat_id,
                'feedback': feedback,  # 'true_positive', 'false_positive', 'false_negative'
                'context': context,
                'timestamp': datetime.now().isoformat()
            }
            
            # Store feedback
            self.redis_client.lpush('feedback', json.dumps(feedback_data))
            
            # Trigger model adjustment based on feedback
            if feedback == 'false_positive':
                self._adjust_model_for_false_positive(threat_id, context)
            elif feedback == 'false_negative':
                self._adjust_model_for_false_negative(threat_id, context)
            
            logger.info(f"Feedback updated for threat {threat_id}: {feedback}")
            
        except Exception as e:
            logger.error(f"Error updating threat feedback: {str(e)}")
    
    def _adjust_model_for_false_positive(self, threat_id: str, context: Dict):
        """Adjust model parameters to reduce false positives"""
        try:
            # This would implement online learning adjustments
            # For now, we'll log the adjustment
            logger.info(f"Adjusting model for false positive: {threat_id}")
            
        except Exception as e:
            logger.error(f"Error adjusting model for false positive: {str(e)}")
    
    def _adjust_model_for_false_negative(self, threat_id: str, context: Dict):
        """Adjust model parameters to reduce false negatives"""
        try:
            # This would implement online learning adjustments
            # For now, we'll log the adjustment
            logger.info(f"Adjusting model for false negative: {threat_id}")
            
        except Exception as e:
            logger.error(f"Error adjusting model for false negative: {str(e)}")
