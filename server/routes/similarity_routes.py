
from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
from services.similarity_service import similarity_service
from services.threat_service import threat_service
import logging

logger = logging.getLogger(__name__)

similarity_blueprint = Blueprint('similarity', __name__)
similarity_api = Api(similarity_blueprint)

class SimilarityAnalysisResource(Resource):
    def post(self):
        """Analyser la similarité entre messages/menaces"""
        try:
            data = request.get_json()
            messages = data.get('messages', [])
            
            if not messages:
                return {'error': 'Liste de messages requise'}, 400
            
            # Analyser la similarité
            result = similarity_service.group_messages_by_similarity(messages)
            
            return {
                'status': 'success',
                'similarity_analysis': result,
                'timestamp': result.get('timestamp')
            }
            
        except Exception as e:
            logger.error(f"Erreur analyse similarité: {str(e)}")
            return {'error': str(e)}, 500

class ThreatClustersResource(Resource):
    def get(self):
        """Obtenir les clusters de menaces actuels"""
        try:
            # Récupérer les menaces récentes
            threats = threat_service.get_recent_threats(limit=50)
            
            if not threats:
                return {
                    'clusters': [],
                    'total_threats': 0,
                    'message': 'Aucune menace récente trouvée'
                }
            
            # Regrouper par similarité
            clustering_result = similarity_service.group_messages_by_similarity(threats)
            
            return {
                'status': 'success',
                'clustering_result': clustering_result,
                'total_threats': len(threats)
            }
            
        except Exception as e:
            logger.error(f"Erreur récupération clusters: {str(e)}")
            return {'error': str(e)}, 500

class SimilarityConfigResource(Resource):
    def get(self):
        """Obtenir la configuration de similarité"""
        return {
            'similarity_threshold': similarity_service.similarity_threshold,
            'time_window_hours': similarity_service.time_window_hours,
            'theme_weights': similarity_service.theme_weights
        }
    
    def put(self):
        """Mettre à jour la configuration de similarité"""
        try:
            data = request.get_json()
            
            if 'similarity_threshold' in data:
                threshold = float(data['similarity_threshold'])
                if 0 <= threshold <= 1:
                    similarity_service.similarity_threshold = threshold
                else:
                    return {'error': 'Seuil de similarité doit être entre 0 et 1'}, 400
            
            if 'time_window_hours' in data:
                hours = int(data['time_window_hours'])
                if hours > 0:
                    similarity_service.time_window_hours = hours
                else:
                    return {'error': 'Fenêtre temporelle doit être positive'}, 400
            
            if 'theme_weights' in data:
                weights = data['theme_weights']
                if isinstance(weights, dict):
                    similarity_service.theme_weights.update(weights)
            
            return {
                'status': 'success',
                'message': 'Configuration mise à jour',
                'new_config': {
                    'similarity_threshold': similarity_service.similarity_threshold,
                    'time_window_hours': similarity_service.time_window_hours,
                    'theme_weights': similarity_service.theme_weights
                }
            }
            
        except Exception as e:
            logger.error(f"Erreur mise à jour config: {str(e)}")
            return {'error': str(e)}, 500

# Enregistrer les ressources
similarity_api.add_resource(SimilarityAnalysisResource, '/analyze')
similarity_api.add_resource(ThreatClustersResource, '/clusters')
similarity_api.add_resource(SimilarityConfigResource, '/config')
