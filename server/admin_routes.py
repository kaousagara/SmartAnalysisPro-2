from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
import os
import json
from datetime import datetime
from services.llm_service import llm_service
from config import Config

# Configuration par défaut
DEFAULT_CONFIG = {
    'llm_provider': Config.LLM_PROVIDER,
    'llm_config': {
        'ollama': {
            'base_url': Config.OLLAMA_BASE_URL,
            'model': Config.OLLAMA_MODEL
        },
        'openai': {
            'api_key': Config.OPENAI_API_KEY,
            'model': Config.OPENAI_MODEL
        },
        'openrouter': {
            'api_key': Config.OPENROUTER_API_KEY,
            'model': Config.OPENROUTER_MODEL
        }
    },
    'system_config': {
        'threat_threshold': 0.7,
        'alert_enabled': True,
        'data_retention_days': 90,
        'max_concurrent_ingestion': 10,
        'response_timeout': 30,
        'false_positive_threshold': 0.08
    }
}

admin_bp = Blueprint('admin', __name__)
admin_api = Api(admin_bp)

class AdminConfigResource(Resource):
    def get(self):
        """Récupérer la configuration actuelle"""
        try:
            config_path = 'config/admin_config.json'
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
            else:
                config = DEFAULT_CONFIG
            
            return {'config': config}, 200
        except Exception as e:
            return {'error': str(e)}, 500

    def post(self):
        """Sauvegarder la configuration"""
        try:
            data = request.get_json()
            
            # Validation des données
            if not data:
                return {'error': 'Données manquantes'}, 400
            
            provider = data.get('llm_provider', 'ollama')
            config = data.get('llm_config', {})
            
            # Mettre à jour le service LLM
            if provider in ['ollama', 'openai', 'openrouter']:
                provider_config = config.get(provider, {})
                success = llm_service.set_provider(provider, provider_config)
                
                if not success:
                    return {'error': 'Fournisseur non supporté'}, 400
            
            # Sauvegarder la configuration
            save_config = {
                'llm_provider': provider,
                'llm_config': config,
                'system_config': data.get('system_config', {}),
                'last_updated': datetime.now().isoformat()
            }
            
            # Créer le dossier config s'il n'existe pas
            os.makedirs('config', exist_ok=True)
            
            # Sauvegarder la configuration
            config_path = 'config/admin_config.json'
            with open(config_path, 'w') as f:
                json.dump(save_config, f, indent=2)
            
            return {'message': 'Configuration sauvegardée avec succès'}, 200
            
        except Exception as e:
            return {'error': str(e)}, 500

class TestLLMResource(Resource):
    def post(self):
        """Tester la connexion LLM"""
        try:
            data = request.get_json()
            provider = data.get('provider', 'ollama')
            config = data.get('config', {})
            
            # Utiliser le nouveau service LLM unifié
            if provider in ['ollama', 'openai', 'openrouter']:
                # Configurer temporairement le provider pour le test
                provider_config = config.get(provider, {})
                llm_service.set_provider(provider, provider_config)
                
                # Tester la connexion
                result = llm_service.test_connection()
                
                if result['status'] == 'connected':
                    return {
                        'success': True,
                        'message': f'Connexion {provider} réussie',
                        'details': result
                    }, 200
                else:
                    return {
                        'success': False,
                        'error': result.get('error', 'Erreur de connexion'),
                        'details': result
                    }, 400
            else:
                return {'success': False, 'error': 'Fournisseur non supporté'}, 400
                
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500

class GetLLMConfigResource(Resource):
    def get(self):
        """Récupérer la configuration LLM actuelle"""
        try:
            return {
                'config': llm_service.get_current_config(),
                'providers': ['ollama', 'openai', 'openrouter']
            }, 200
        except Exception as e:
            return {'error': str(e)}, 500

class SystemStatusResource(Resource):
    def get(self):
        """Obtenir le statut du système"""
        try:
            # Informations système de base
            system_info = {
                'version': '2.0.0',
                'uptime': '5 heures',
                'memory_usage': '45%',
                'disk_usage': '32%',
                'active_connections': 12,
                'last_backup': '2024-01-15 08:30:00'
            }
            
            return {'system_info': system_info}, 200
            
        except Exception as e:
            return {'error': str(e)}, 500

# Enregistrer les routes
admin_api.add_resource(AdminConfigResource, '/config')
admin_api.add_resource(TestLLMResource, '/test-llm')
admin_api.add_resource(GetLLMConfigResource, '/llm-config')
admin_api.add_resource(SystemStatusResource, '/system-status')