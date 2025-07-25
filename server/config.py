import os
from datetime import timedelta

class Config:
    # Database
    DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost/intelligence_db')
    
    # Security
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-here')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    # Redis
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379')
    
    # ML Models
    ML_MODEL_PATH = os.getenv('ML_MODEL_PATH', './models')
    
    # Threat Scoring Parameters
    THREAT_SCORE_WEIGHTS = {
        'intention_probability': 0.35,
        'source_credibility': 0.25,
        'temporal_coherence': 0.20,
        'network_density': 0.20
    }
    
    # Thresholds
    THREAT_ALERT_THRESHOLD = 0.70
    CRITICAL_SCORE_DELTA = 0.20
    FALSE_POSITIVE_THRESHOLD = 0.08
    
    # Performance
    LATENCY_THRESHOLD_MS = 400
    
    # Data Ingestion
    STIX_TAXII_ENDPOINT = os.getenv('STIX_TAXII_ENDPOINT', 'https://api.example.com/taxii')
    KAFKA_BOOTSTRAP_SERVERS = os.getenv('KAFKA_BOOTSTRAP_SERVERS', 'localhost:9092')
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # LLM Configuration
    LLM_PROVIDER = os.getenv('LLM_PROVIDER', 'ollama')  # Options: ollama, openai, openrouter
    
    # Ollama Configuration (Default)
    OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')
    OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3')
    
    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
    OPENAI_MODEL = os.getenv('OPENAI_MODEL', 'gpt-4')
    
    # OpenRouter Configuration
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY', '')
    OPENROUTER_MODEL = os.getenv('OPENROUTER_MODEL', 'openai/gpt-4')
