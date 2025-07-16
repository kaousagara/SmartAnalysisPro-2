"""
Service LLM unifié supportant Ollama, OpenAI et OpenRouter
"""
import os
import logging
import requests
import json
from typing import Dict, List, Optional, Any
from datetime import datetime
from config import Config

logger = logging.getLogger(__name__)

class LLMService:
    """Service unifié pour gérer différents fournisseurs LLM"""
    
    def __init__(self):
        self.provider = Config.LLM_PROVIDER
        self.current_config = self._load_config()
        
    def _load_config(self) -> Dict[str, Any]:
        """Charger la configuration du fournisseur actuel"""
        if self.provider == 'ollama':
            return {
                'base_url': Config.OLLAMA_BASE_URL,
                'model': Config.OLLAMA_MODEL,
                'api_key': None
            }
        elif self.provider == 'openai':
            return {
                'base_url': 'https://api.openai.com/v1',
                'model': Config.OPENAI_MODEL,
                'api_key': Config.OPENAI_API_KEY
            }
        elif self.provider == 'openrouter':
            return {
                'base_url': 'https://openrouter.ai/api/v1',
                'model': Config.OPENROUTER_MODEL,
                'api_key': Config.OPENROUTER_API_KEY
            }
        else:
            raise ValueError(f"Fournisseur LLM non supporté: {self.provider}")
    
    def set_provider(self, provider: str, config: Dict[str, Any]) -> bool:
        """Changer de fournisseur LLM"""
        if provider not in ['ollama', 'openai', 'openrouter']:
            return False
            
        self.provider = provider
        
        # Mettre à jour la configuration
        if provider == 'ollama':
            os.environ['LLM_PROVIDER'] = 'ollama'
            os.environ['OLLAMA_BASE_URL'] = config.get('base_url', 'http://localhost:11434')
            os.environ['OLLAMA_MODEL'] = config.get('model', 'llama3')
        elif provider == 'openai':
            os.environ['LLM_PROVIDER'] = 'openai'
            os.environ['OPENAI_API_KEY'] = config.get('api_key', '')
            os.environ['OPENAI_MODEL'] = config.get('model', 'gpt-4')
        elif provider == 'openrouter':
            os.environ['LLM_PROVIDER'] = 'openrouter'
            os.environ['OPENROUTER_API_KEY'] = config.get('api_key', '')
            os.environ['OPENROUTER_MODEL'] = config.get('model', 'openai/gpt-4')
            
        self.current_config = self._load_config()
        return True
    
    def analyze_text(self, text: str, analysis_type: str = 'threat') -> Dict[str, Any]:
        """Analyser un texte avec le LLM"""
        try:
            if self.provider == 'ollama':
                return self._analyze_with_ollama(text, analysis_type)
            elif self.provider == 'openai':
                return self._analyze_with_openai(text, analysis_type)
            elif self.provider == 'openrouter':
                return self._analyze_with_openrouter(text, analysis_type)
        except Exception as e:
            logger.error(f"Erreur analyse LLM: {e}")
            return self._get_fallback_analysis(text, analysis_type)
    
    def _analyze_with_ollama(self, text: str, analysis_type: str) -> Dict[str, Any]:
        """Analyser avec Ollama"""
        prompt = self._create_prompt(text, analysis_type)
        
        try:
            response = requests.post(
                f"{self.current_config['base_url']}/api/generate",
                json={
                    'model': self.current_config['model'],
                    'prompt': prompt,
                    'stream': False
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                return self._parse_llm_response(result.get('response', ''), analysis_type)
            else:
                logger.error(f"Erreur Ollama: {response.status_code}")
                return self._get_fallback_analysis(text, analysis_type)
                
        except Exception as e:
            logger.error(f"Erreur connexion Ollama: {e}")
            return self._get_fallback_analysis(text, analysis_type)
    
    def _analyze_with_openai(self, text: str, analysis_type: str) -> Dict[str, Any]:
        """Analyser avec OpenAI"""
        if not self.current_config['api_key']:
            logger.error("Clé API OpenAI manquante")
            return self._get_fallback_analysis(text, analysis_type)
            
        prompt = self._create_prompt(text, analysis_type)
        
        try:
            headers = {
                'Authorization': f"Bearer {self.current_config['api_key']}",
                'Content-Type': 'application/json'
            }
            
            response = requests.post(
                f"{self.current_config['base_url']}/chat/completions",
                headers=headers,
                json={
                    'model': self.current_config['model'],
                    'messages': [
                        {"role": "system", "content": "You are a security threat analyst."},
                        {"role": "user", "content": prompt}
                    ],
                    'temperature': 0.7
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                return self._parse_llm_response(content, analysis_type)
            else:
                logger.error(f"Erreur OpenAI: {response.status_code}")
                return self._get_fallback_analysis(text, analysis_type)
                
        except Exception as e:
            logger.error(f"Erreur connexion OpenAI: {e}")
            return self._get_fallback_analysis(text, analysis_type)
    
    def _analyze_with_openrouter(self, text: str, analysis_type: str) -> Dict[str, Any]:
        """Analyser avec OpenRouter"""
        if not self.current_config['api_key']:
            logger.error("Clé API OpenRouter manquante")
            return self._get_fallback_analysis(text, analysis_type)
            
        prompt = self._create_prompt(text, analysis_type)
        
        try:
            headers = {
                'Authorization': f"Bearer {self.current_config['api_key']}",
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://intelligence-system.replit.app',
                'X-Title': 'Intelligence Analysis System'
            }
            
            response = requests.post(
                f"{self.current_config['base_url']}/chat/completions",
                headers=headers,
                json={
                    'model': self.current_config['model'],
                    'messages': [
                        {"role": "system", "content": "You are a security threat analyst."},
                        {"role": "user", "content": prompt}
                    ],
                    'temperature': 0.7
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                content = result['choices'][0]['message']['content']
                return self._parse_llm_response(content, analysis_type)
            else:
                logger.error(f"Erreur OpenRouter: {response.status_code}")
                return self._get_fallback_analysis(text, analysis_type)
                
        except Exception as e:
            logger.error(f"Erreur connexion OpenRouter: {e}")
            return self._get_fallback_analysis(text, analysis_type)
    
    def _create_prompt(self, text: str, analysis_type: str) -> str:
        """Créer le prompt selon le type d'analyse"""
        if analysis_type == 'threat':
            return f"""Analyser ce texte pour identifier les menaces potentielles:
            
{text}

Fournir une analyse structurée avec:
1. Niveau de menace (0-1)
2. Type de menace identifié
3. Entités clés mentionnées
4. Recommandations

Format JSON requis."""
        
        elif analysis_type == 'sentiment':
            return f"""Analyser le sentiment et le ton de ce texte:
            
{text}

Fournir:
1. Sentiment général (positif/neutre/négatif)
2. Score de confiance (0-1)
3. Émotions détectées
4. Indicateurs clés"""
        
        else:
            return f"Analyser ce texte: {text}"
    
    def _parse_llm_response(self, response: str, analysis_type: str) -> Dict[str, Any]:
        """Parser la réponse du LLM"""
        try:
            # Essayer de parser comme JSON
            if response.strip().startswith('{'):
                return json.loads(response)
        except:
            pass
        
        # Analyse basique si pas de JSON
        if analysis_type == 'threat':
            return {
                'threat_level': 0.5,
                'threat_type': 'unknown',
                'entities': [],
                'recommendations': [response],
                'raw_response': response
            }
        else:
            return {
                'analysis': response,
                'timestamp': datetime.now().isoformat()
            }
    
    def _get_fallback_analysis(self, text: str, analysis_type: str) -> Dict[str, Any]:
        """Analyse de secours si LLM non disponible"""
        word_count = len(text.split())
        
        if analysis_type == 'threat':
            # Analyse basique basée sur mots-clés
            threat_keywords = ['attack', 'threat', 'danger', 'risk', 'vulnerability']
            found_keywords = [kw for kw in threat_keywords if kw.lower() in text.lower()]
            threat_level = min(len(found_keywords) * 0.2, 1.0)
            
            return {
                'threat_level': threat_level,
                'threat_type': 'keyword-based',
                'entities': found_keywords,
                'recommendations': ['Analyse manuelle recommandée - LLM non disponible'],
                'fallback': True
            }
        else:
            return {
                'analysis': 'Analyse LLM non disponible',
                'word_count': word_count,
                'fallback': True,
                'timestamp': datetime.now().isoformat()
            }
    
    def test_connection(self) -> Dict[str, Any]:
        """Tester la connexion au fournisseur actuel"""
        test_text = "Test de connexion"
        
        try:
            if self.provider == 'ollama':
                # Test spécifique Ollama
                response = requests.get(f"{self.current_config['base_url']}/api/tags", timeout=5)
                models = response.json().get('models', []) if response.status_code == 200 else []
                
                return {
                    'status': 'connected' if response.status_code == 200 else 'error',
                    'provider': self.provider,
                    'base_url': self.current_config['base_url'],
                    'model': self.current_config['model'],
                    'available_models': [m['name'] for m in models],
                    'error': None if response.status_code == 200 else f"Code: {response.status_code}"
                }
                
            else:
                # Test pour OpenAI/OpenRouter
                result = self.analyze_text(test_text, 'test')
                
                return {
                    'status': 'connected' if not result.get('fallback') else 'error',
                    'provider': self.provider,
                    'model': self.current_config['model'],
                    'api_key_configured': bool(self.current_config['api_key']),
                    'error': 'Clé API manquante' if not self.current_config['api_key'] else None
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'provider': self.provider,
                'error': str(e)
            }
    
    def get_current_config(self) -> Dict[str, Any]:
        """Obtenir la configuration actuelle"""
        return {
            'provider': self.provider,
            'config': {
                'base_url': self.current_config.get('base_url'),
                'model': self.current_config.get('model'),
                'api_key_configured': bool(self.current_config.get('api_key'))
            }
        }

# Instance globale du service
llm_service = LLMService()