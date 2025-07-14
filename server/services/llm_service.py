"""
Service LLM configurable pour OpenAI, Ollama et OpenRouter
"""

import os
import requests
import json
from typing import Dict, Any, Optional
from dataclasses import dataclass

@dataclass
class LLMConfig:
    provider: str
    model: str
    temperature: float = 0.3
    max_tokens: int = 2000
    api_key: Optional[str] = None
    endpoint: Optional[str] = None

class LLMService:
    def __init__(self):
        self.config = LLMConfig(
            provider=os.getenv('LLM_PROVIDER', 'openai'),
            model=os.getenv('LLM_MODEL', 'gpt-4o'),
            temperature=float(os.getenv('LLM_TEMPERATURE', '0.3')),
            max_tokens=int(os.getenv('LLM_MAX_TOKENS', '2000')),
            api_key=os.getenv('OPENAI_API_KEY'),
            endpoint=os.getenv('OLLAMA_ENDPOINT', 'http://localhost:11434')
        )
        
    def update_config(self, config: Dict[str, Any]) -> None:
        """Met à jour la configuration LLM"""
        self.config.provider = config.get('provider', self.config.provider)
        self.config.model = config.get('model', self.config.model)
        self.config.temperature = config.get('temperature', self.config.temperature)
        self.config.max_tokens = config.get('max_tokens', self.config.max_tokens)
        self.config.api_key = config.get('api_key', self.config.api_key)
        self.config.endpoint = config.get('endpoint', self.config.endpoint)
        
    def analyze_threat(self, threat_data: Dict[str, Any]) -> Dict[str, Any]:
        """Analyse une menace avec le LLM configuré"""
        
        prompt = f"""
        Analysez cette menace potentielle et fournissez une évaluation structurée :
        
        Données de menace : {json.dumps(threat_data, ensure_ascii=False)}
        
        Veuillez fournir une réponse JSON avec les champs suivants :
        - threat_level: (low, medium, high, critical)
        - confidence: (0.0 à 1.0)
        - description: description détaillée
        - recommended_actions: liste d'actions recommandées
        - indicators: indicateurs de compromission identifiés
        """
        
        try:
            if self.config.provider == 'openai':
                return self._call_openai(prompt)
            elif self.config.provider == 'ollama':
                return self._call_ollama(prompt)
            elif self.config.provider == 'openrouter':
                return self._call_openrouter(prompt)
            else:
                raise ValueError(f"Fournisseur LLM non supporté: {self.config.provider}")
                
        except Exception as e:
            return {
                'threat_level': 'medium',
                'confidence': 0.5,
                'description': f'Erreur d\'analyse LLM: {str(e)}',
                'recommended_actions': ['Révision manuelle requise'],
                'indicators': []
            }
    
    def _call_openai(self, prompt: str) -> Dict[str, Any]:
        """Appel API OpenAI"""
        if not self.config.api_key:
            raise ValueError("Clé API OpenAI manquante")
            
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'model': self.config.model,
            'messages': [
                {
                    'role': 'system',
                    'content': 'Vous êtes un expert en cybersécurité spécialisé dans l\'analyse de menaces.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'temperature': self.config.temperature,
            'max_tokens': self.config.max_tokens,
            'response_format': {'type': 'json_object'}
        }
        
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"Erreur API OpenAI: {response.status_code}")
            
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return self._parse_fallback_response(content)
    
    def _call_ollama(self, prompt: str) -> Dict[str, Any]:
        """Appel API Ollama"""
        data = {
            'model': self.config.model,
            'prompt': prompt,
            'stream': False,
            'options': {
                'temperature': self.config.temperature,
                'num_predict': self.config.max_tokens
            }
        }
        
        response = requests.post(
            f'{self.config.endpoint}/api/generate',
            json=data,
            timeout=60
        )
        
        if response.status_code != 200:
            raise Exception(f"Erreur API Ollama: {response.status_code}")
            
        result = response.json()
        content = result.get('response', '')
        
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return self._parse_fallback_response(content)
    
    def _call_openrouter(self, prompt: str) -> Dict[str, Any]:
        """Appel API OpenRouter"""
        if not self.config.api_key:
            raise ValueError("Clé API OpenRouter manquante")
            
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://intelligence-system.app',
            'X-Title': 'Intelligence Analysis System'
        }
        
        data = {
            'model': self.config.model,
            'messages': [
                {
                    'role': 'system',
                    'content': 'Vous êtes un expert en cybersécurité spécialisé dans l\'analyse de menaces.'
                },
                {
                    'role': 'user',
                    'content': prompt
                }
            ],
            'temperature': self.config.temperature,
            'max_tokens': self.config.max_tokens
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code != 200:
            raise Exception(f"Erreur API OpenRouter: {response.status_code}")
            
        result = response.json()
        content = result['choices'][0]['message']['content']
        
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            return self._parse_fallback_response(content)
    
    def _parse_fallback_response(self, content: str) -> Dict[str, Any]:
        """Analyse de réponse de fallback si JSON invalide"""
        # Analyse basique du contenu textuel
        threat_level = 'medium'
        confidence = 0.6
        
        if any(word in content.lower() for word in ['critique', 'critical', 'urgent', 'danger']):
            threat_level = 'critical'
            confidence = 0.8
        elif any(word in content.lower() for word in ['élevé', 'high', 'important']):
            threat_level = 'high'
            confidence = 0.7
        elif any(word in content.lower() for word in ['faible', 'low', 'mineur']):
            threat_level = 'low'
            confidence = 0.5
            
        return {
            'threat_level': threat_level,
            'confidence': confidence,
            'description': content[:500] + '...' if len(content) > 500 else content,
            'recommended_actions': ['Révision manuelle recommandée'],
            'indicators': []
        }
    
    def test_connection(self) -> Dict[str, Any]:
        """Teste la connexion au LLM configuré"""
        try:
            test_prompt = "Répondez simplement par 'OK' si vous recevez ce message."
            
            if self.config.provider == 'openai':
                result = self._call_openai(test_prompt)
            elif self.config.provider == 'ollama':
                result = self._call_ollama(test_prompt)
            elif self.config.provider == 'openrouter':
                result = self._call_openrouter(test_prompt)
            else:
                raise ValueError(f"Fournisseur non supporté: {self.config.provider}")
                
            return {
                'status': 'success',
                'provider': self.config.provider,
                'model': self.config.model,
                'response': result
            }
            
        except Exception as e:
            return {
                'status': 'error',
                'provider': self.config.provider,
                'model': self.config.model,
                'error': str(e)
            }
    
    def get_config(self) -> Dict[str, Any]:
        """Retourne la configuration actuelle"""
        return {
            'provider': self.config.provider,
            'model': self.config.model,
            'temperature': self.config.temperature,
            'max_tokens': self.config.max_tokens,
            'endpoint': self.config.endpoint,
            'api_key_set': bool(self.config.api_key)
        }

# Instance globale du service LLM
llm_service = LLMService()