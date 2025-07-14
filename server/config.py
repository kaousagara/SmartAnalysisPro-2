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
