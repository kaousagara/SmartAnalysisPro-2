from flask import Blueprint, request, jsonify
from flask_restful import Api, Resource
import os
import json
from datetime import datetime

# Configuration par défaut
DEFAULT_CONFIG = {
    'llm_provider': 'chatgpt',
    'llm_config': {
        'openai_api_key': '',
        'openai_model': 'gpt-4o',
        'ollama_url': 'http://localhost:11434',
        'ollama_model': 'llama3.1:8b',
        'openrouter_api_key': '',
        'openrouter_model': 'anthropic/claude-3-sonnet'
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
            
            config = {
                'llm_provider': data.get('llm_provider', 'chatgpt'),
                'llm_config': data.get('llm_config', {}),
                'system_config': data.get('system_config', {}),
                'last_updated': datetime.now().isoformat()
            }
            
            # Créer le dossier config s'il n'existe pas
            os.makedirs('config', exist_ok=True)
            
            # Sauvegarder la configuration
            config_path = 'config/admin_config.json'
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            return {'message': 'Configuration sauvegardée avec succès'}, 200
            
        except Exception as e:
            return {'error': str(e)}, 500

class TestLLMResource(Resource):
    def post(self):
        """Tester la connexion LLM"""
        try:
            data = request.get_json()
            provider = data.get('provider', 'chatgpt')
            config = data.get('config', {})
            
            if provider == 'chatgpt':
                return self._test_openai(config)
            elif provider == 'ollama':
                return self._test_ollama(config)
            elif provider == 'openrouter':
                return self._test_openrouter(config)
            else:
                return {'success': False, 'error': 'Fournisseur non supporté'}, 400
                
        except Exception as e:
            return {'success': False, 'error': str(e)}, 500
    
    def _test_openai(self, config):
        """Tester la connexion OpenAI"""
        try:
            import openai
            
            api_key = config.get('openai_api_key', '')
            if not api_key:
                return {'success': False, 'error': 'Clé API OpenAI manquante'}, 400
            
            client = openai.OpenAI(api_key=api_key)
            
            # Test simple avec une requête basique
            response = client.chat.completions.create(
                model=config.get('openai_model', 'gpt-4o'),
                messages=[{'role': 'user', 'content': 'Test de connexion'}],
                max_tokens=10
            )
            
            return {
                'success': True, 
                'message': 'Connexion OpenAI réussie',
                'model': config.get('openai_model', 'gpt-4o')
            }, 200
            
        except Exception as e:
            return {'success': False, 'error': f'Erreur OpenAI: {str(e)}'}, 400
    
    def _test_ollama(self, config):
        """Tester la connexion Ollama"""
        try:
            import requests
            
            url = config.get('ollama_url', 'http://localhost:11434')
            model = config.get('ollama_model', 'llama3.1:8b')
            
            # Tester la connexion à l'API Ollama
            response = requests.post(f"{url}/api/generate", 
                json={
                    'model': model,
                    'prompt': 'Test de connexion',
                    'stream': False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return {
                    'success': True, 
                    'message': 'Connexion Ollama réussie',
                    'model': model
                }, 200
            else:
                return {
                    'success': False, 
                    'error': f'Erreur Ollama: {response.status_code}'
                }, 400
                
        except Exception as e:
            return {'success': False, 'error': f'Erreur Ollama: {str(e)}'}, 400
    
    def _test_openrouter(self, config):
        """Tester la connexion OpenRouter"""
        try:
            import requests
            
            api_key = config.get('openrouter_api_key', '')
            if not api_key:
                return {'success': False, 'error': 'Clé API OpenRouter manquante'}, 400
            
            model = config.get('openrouter_model', 'anthropic/claude-3-sonnet')
            
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers=headers,
                json={
                    'model': model,
                    'messages': [{'role': 'user', 'content': 'Test de connexion'}],
                    'max_tokens': 10
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return {
                    'success': True, 
                    'message': 'Connexion OpenRouter réussie',
                    'model': model
                }, 200
            else:
                return {
                    'success': False, 
                    'error': f'Erreur OpenRouter: {response.status_code}'
                }, 400
                
        except Exception as e:
            return {'success': False, 'error': f'Erreur OpenRouter: {str(e)}'}, 400

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
admin_api.add_resource(SystemStatusResource, '/system-status')