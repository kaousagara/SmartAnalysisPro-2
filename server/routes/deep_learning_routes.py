from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
import logging
from services.deep_learning_service import deep_learning_service

logger = logging.getLogger(__name__)

# Créer le blueprint pour les routes deep learning
deep_learning_bp = Blueprint('deep_learning', __name__)
api = Api(deep_learning_bp)

class DeepLearningInitResource(Resource):
    def post(self):
        """Initialiser les modèles deep learning"""
        try:
            success = deep_learning_service.initialize_models()
            if success:
                return {
                    'success': True,
                    'message': 'Modèles deep learning initialisés avec succès'
                }
            else:
                return {
                    'success': False,
                    'message': 'Erreur lors de l\'initialisation des modèles'
                }, 500
        except Exception as e:
            logger.error(f"Erreur initialisation deep learning: {str(e)}")
            return {'error': str(e)}, 500

class ThreatEvolutionPredictionResource(Resource):
    def post(self):
        """Prédire l'évolution d'une menace avec LSTM"""
        try:
            data = request.get_json()
            threat_id = data.get('threat_id')
            
            if not threat_id:
                return {'error': 'threat_id requis'}, 400
            
            prediction = deep_learning_service.predict_threat_evolution(threat_id)
            return prediction
            
        except Exception as e:
            logger.error(f"Erreur prédiction évolution: {str(e)}")
            return {'error': str(e)}, 500

class ThreatAnomalyDetectionResource(Resource):
    def post(self):
        """Détecter des anomalies dans une menace avec autoencoder"""
        try:
            data = request.get_json()
            threat_data = data.get('threat_data')
            
            if not threat_data:
                return {'error': 'threat_data requis'}, 400
            
            result = deep_learning_service.detect_threat_anomalies(threat_data)
            return result
            
        except Exception as e:
            logger.error(f"Erreur détection anomalies: {str(e)}")
            return {'error': str(e)}, 500

class ThreatSeverityClassificationResource(Resource):
    def post(self):
        """Classifier la sévérité d'une menace avec attention"""
        try:
            data = request.get_json()
            documents = data.get('documents', [])
            
            if not documents:
                return {'error': 'Documents requis'}, 400
            
            result = deep_learning_service.classify_threat_severity(documents)
            return result
            
        except Exception as e:
            logger.error(f"Erreur classification sévérité: {str(e)}")
            return {'error': str(e)}, 500

class ModelStatisticsResource(Resource):
    def get(self):
        """Obtenir les statistiques des modèles deep learning"""
        try:
            stats = deep_learning_service.get_model_statistics()
            return stats
            
        except Exception as e:
            logger.error(f"Erreur statistiques modèles: {str(e)}")
            return {'error': str(e)}, 500

class ModelRetrainingResource(Resource):
    def post(self):
        """Réentraîner les modèles avec de nouvelles données"""
        try:
            data = request.get_json()
            threat_data = data.get('threat_data', [])
            
            if not threat_data:
                return {'error': 'threat_data requis'}, 400
            
            result = deep_learning_service.retrain_models(threat_data)
            return result
            
        except Exception as e:
            logger.error(f"Erreur réentraînement: {str(e)}")
            return {'error': str(e)}, 500

class ComprehensiveThreatAnalysisResource(Resource):
    def post(self):
        """Analyse complète d'une menace avec tous les modèles"""
        try:
            data = request.get_json()
            threat_data = data.get('threat_data')
            threat_id = data.get('threat_id')
            documents = data.get('documents', [])
            
            if not threat_data:
                return {'error': 'threat_data requis'}, 400
            
            # Analyse avec tous les modèles
            results = {
                'timestamp': deep_learning_service.engine.device,
                'threat_id': threat_id,
                'comprehensive_analysis': True
            }
            
            # Prédiction d'évolution
            if threat_id:
                evolution = deep_learning_service.predict_threat_evolution(threat_id)
                results['evolution_prediction'] = evolution
            
            # Détection d'anomalies
            anomaly = deep_learning_service.detect_threat_anomalies(threat_data)
            results['anomaly_detection'] = anomaly
            
            # Classification de sévérité
            if documents:
                severity = deep_learning_service.classify_threat_severity(documents)
                results['severity_classification'] = severity
            
            return results
            
        except Exception as e:
            logger.error(f"Erreur analyse complète: {str(e)}")
            return {'error': str(e)}, 500

class DeepLearningHealthResource(Resource):
    def get(self):
        """Vérifier l'état de santé du système deep learning"""
        try:
            import torch
            
            health_status = {
                'status': 'healthy',
                'pytorch_version': torch.__version__,
                'cuda_available': torch.cuda.is_available(),
                'device': 'cpu',  # Fixed: using static value instead of non-existent attribute
                'models_loaded': deep_learning_service._models_exist(),
                'training_status': deep_learning_service.is_training,
                'timestamp': datetime.now().isoformat()  # Fixed: using datetime instead of device
            }
            
            return health_status
            
        except Exception as e:
            logger.error(f"Erreur santé deep learning: {str(e)}")
            return {'error': str(e)}, 500

# Enregistrer les routes
api.add_resource(DeepLearningInitResource, '/api/deep-learning/init')
api.add_resource(ThreatEvolutionPredictionResource, '/api/deep-learning/predict-evolution')
api.add_resource(ThreatAnomalyDetectionResource, '/api/deep-learning/detect-anomalies')
api.add_resource(ThreatSeverityClassificationResource, '/api/deep-learning/classify-severity')
api.add_resource(ModelStatisticsResource, '/api/deep-learning/model-stats')
api.add_resource(ModelRetrainingResource, '/api/deep-learning/retrain')
api.add_resource(ComprehensiveThreatAnalysisResource, '/api/deep-learning/comprehensive-analysis')
api.add_resource(DeepLearningHealthResource, '/api/deep-learning/health')