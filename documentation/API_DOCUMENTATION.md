# Documentation API - Système d'Analyse d'Intelligence

## Version 2.3.0 - Documentation complète des APIs

### Base URL
```
http://localhost:8000/api
```

### Authentification
Toutes les API nécessitent un token d'authentification dans le header :
```
Authorization: Bearer <token>
```

---

## Endpoints d'Authentification

### POST /api/auth/login
Authentification utilisateur avec base de données PostgreSQL.

**Request Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response Success (200):**
```json
{
  "message": "Login successful",
  "token": "db_token_admin_1234567890",
  "user": {
    "id": 1,
    "username": "admin",
    "clearance_level": 5,
    "name": "Administrator",
    "email": "admin@system.local"
  }
}
```

**Response Error (401):**
```json
{
  "message": "Invalid credentials"
}
```

### GET /api/auth/user
Récupération des informations utilisateur authentifié.

**Response Success (200):**
```json
{
  "id": 1,
  "username": "admin",
  "clearance_level": 5,
  "name": "Administrator",
  "email": "admin@system.local"
}
```

---

## Endpoints du Dashboard

### GET /api/dashboard/stats
Statistiques du tableau de bord avec cache optimisé.

**Response Success (200):**
```json
{
  "total_threats": 42,
  "active_threats": 15,
  "average_score": 67.3,
  "critical_alerts": 3,
  "processing_time": 0.045,
  "cache_hit": true,
  "last_updated": "2025-07-16T14:30:00Z"
}
```

### GET /api/threats/realtime
Menaces en temps réel avec pagination.

**Query Parameters:**
- `limit` (int, default=10): Nombre de menaces à retourner

**Response Success (200):**
```json
{
  "threats": [
    {
      "id": 1,
      "title": "Suspicious Network Activity",
      "severity": "high",
      "score": 85.2,
      "timestamp": "2025-07-16T14:25:00Z",
      "location": "Bamako, Mali",
      "source": "Network Monitor",
      "status": "active"
    }
  ],
  "total": 42,
  "processing_time": 0.023
}
```

### GET /api/threats/evolution
Évolution des menaces avec filtres temporels.

**Query Parameters:**
- `filter` (string): Filtre temporel (24H, 7D, 30D)

**Response Success (200):**
```json
{
  "data": [
    {
      "timestamp": "2025-07-16T14:00:00Z",
      "average_score": 65.4,
      "threat_count": 12,
      "critical_count": 2
    }
  ],
  "processing_time": 0.087
}
```

### GET /api/alerts
Alertes actives du système.

**Response Success (200):**
```json
{
  "alerts": [
    {
      "id": 1,
      "title": "Critical Threat Detected",
      "severity": "critical",
      "timestamp": "2025-07-16T14:28:00Z",
      "message": "High-risk activity detected in Kidal region",
      "acknowledged": false
    }
  ],
  "total": 5
}
```

---

## Endpoints de Gestion des Menaces

### GET /api/threats
Liste complète des menaces avec pagination.

**Query Parameters:**
- `page` (int, default=1): Page de résultats
- `limit` (int, default=50): Nombre de résultats par page
- `severity` (string): Filtrer par niveau de gravité
- `status` (string): Filtrer par statut

**Response Success (200):**
```json
{
  "threats": [
    {
      "id": 1,
      "title": "Suspicious Network Activity",
      "description": "Unusual network patterns detected",
      "severity": "high",
      "score": 85.2,
      "source": "Network Monitor",
      "location": "Bamako, Mali",
      "timestamp": "2025-07-16T14:25:00Z",
      "status": "active",
      "tags": ["network", "suspicious", "mali"],
      "metadata": {
        "detection_method": "ml_classifier",
        "confidence": 0.923
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 156,
    "pages": 4
  }
}
```

### POST /api/threats
Création d'une nouvelle menace.

**Request Body:**
```json
{
  "title": "New Threat",
  "description": "Description of the threat",
  "severity": "medium",
  "source": "Manual Entry",
  "location": "Gao, Mali",
  "tags": ["manual", "security"]
}
```

**Response Success (201):**
```json
{
  "id": 157,
  "title": "New Threat",
  "score": 0.0,
  "status": "active",
  "created_at": "2025-07-16T14:30:00Z"
}
```

### PUT /api/threats/{id}
Mise à jour d'une menace existante.

**Request Body:**
```json
{
  "title": "Updated Threat Title",
  "severity": "high",
  "status": "resolved"
}
```

**Response Success (200):**
```json
{
  "id": 157,
  "updated_at": "2025-07-16T14:35:00Z",
  "changes": ["title", "severity", "status"]
}
```

### DELETE /api/threats/{id}
Suppression d'une menace (suppression logique).

**Response Success (200):**
```json
{
  "message": "Threat deleted successfully",
  "id": 157
}
```

---

## Endpoints d'Ingestion de Données

### POST /api/ingestion
Ingestion de documents avec analyse automatique.

**Request Body (multipart/form-data):**
```
file: <file_upload>
metadata: {
  "source": "Intelligence Report",
  "classification": "confidential"
}
```

**Response Success (200):**
```json
{
  "message": "Document uploaded and processed successfully",
  "document": {
    "id": 89,
    "filename": "report_2025_07_16.pdf",
    "content_type": "application/pdf",
    "file_size": 245760,
    "threat_score": 73.5,
    "entities": {
      "persons": ["Ahmad Touré", "Moussa Konaté"],
      "locations": ["Bamako", "Kidal"],
      "organizations": ["MINUSMA"]
    },
    "processing_time": 2.34,
    "cluster_id": 12
  },
  "evaluation_results": {
    "threats_updated": 15,
    "predictions_generated": 3,
    "prescriptions_created": 2
  }
}
```

### GET /api/ingestion/status
Statut du système d'ingestion.

**Response Success (200):**
```json
{
  "status": "operational",
  "documents_processed": 1247,
  "processing_queue": 3,
  "last_processing": "2025-07-16T14:32:00Z",
  "performance": {
    "avg_processing_time": 1.87,
    "success_rate": 98.3,
    "throughput_per_hour": 156
  }
}
```

### POST /api/documents/{id}/evaluate
Réévaluation d'un document spécifique.

**Response Success (200):**
```json
{
  "message": "Document evaluated successfully",
  "document_id": 89,
  "evaluation_results": {
    "new_threat_score": 75.2,
    "cluster_updated": true,
    "similar_documents": 14,
    "predictions_generated": 2,
    "prescriptions_updated": 1
  },
  "processing_time": 0.847
}
```

### POST /api/cluster/{id}/evaluate
Réévaluation de tous les documents d'un cluster.

**Response Success (200):**
```json
{
  "message": "Cluster evaluated successfully",
  "cluster_id": 12,
  "evaluation_results": {
    "documents_processed": 15,
    "threats_updated": 8,
    "predictions_generated": 5,
    "prescriptions_created": 3,
    "avg_score_change": 2.3
  },
  "processing_time": 12.45
}
```

---

## Endpoints de Prescriptions

### GET /api/prescriptions
Liste des prescriptions avec filtres.

**Query Parameters:**
- `status` (string): Filtrer par statut
- `priority` (string): Filtrer par priorité
- `category` (string): Filtrer par catégorie

**Response Success (200):**
```json
{
  "prescriptions": [
    {
      "id": 34,
      "title": "Enhance Security Monitoring",
      "description": "Implement additional monitoring in high-risk zones",
      "category": "security",
      "priority": "high",
      "status": "active",
      "assigned_to": "Security Team Alpha",
      "due_date": "2025-07-20T12:00:00Z",
      "created_at": "2025-07-16T14:30:00Z",
      "metadata": {
        "threat_reference": [1, 5, 12],
        "estimated_effort": "4 hours",
        "resources_required": ["personnel", "equipment"]
      }
    }
  ],
  "total": 67
}
```

### GET /api/prescriptions/statistics
Statistiques des prescriptions.

**Response Success (200):**
```json
{
  "total_prescriptions": 67,
  "active": 23,
  "completed": 41,
  "overdue": 3,
  "by_priority": {
    "critical": 5,
    "high": 18,
    "medium": 32,
    "low": 12
  },
  "by_category": {
    "security": 25,
    "investigation": 18,
    "mitigation": 15,
    "response": 9
  },
  "completion_rate": 85.7
}
```

### POST /api/prescriptions
Création d'une nouvelle prescription.

**Request Body:**
```json
{
  "title": "New Security Measure",
  "description": "Implement new security protocol",
  "category": "security",
  "priority": "high",
  "assigned_to": "Security Team Beta",
  "due_date": "2025-07-25T12:00:00Z"
}
```

**Response Success (201):**
```json
{
  "id": 68,
  "title": "New Security Measure",
  "status": "active",
  "created_at": "2025-07-16T14:35:00Z"
}
```

---

## Endpoints de Scénarios

### GET /api/scenarios
Liste des scénarios actifs.

**Response Success (200):**
```json
{
  "scenarios": [
    {
      "id": 1,
      "name": "ATT-2024-MALI",
      "description": "Regional threat monitoring scenario",
      "status": "active",
      "conditions": {
        "threat_score_threshold": 70,
        "location_filter": ["Mali", "Burkina Faso"],
        "keywords": ["terrorism", "violence"]
      },
      "actions": [
        "alert_generation",
        "data_collection",
        "reporting"
      ],
      "created_at": "2025-01-15T08:00:00Z",
      "last_triggered": "2025-07-16T13:45:00Z"
    }
  ],
  "total": 8
}
```

### GET /api/actions
Actions récentes du système.

**Response Success (200):**
```json
{
  "actions": [
    {
      "id": 156,
      "type": "alert_generated",
      "description": "Critical threat alert generated",
      "timestamp": "2025-07-16T14:28:00Z",
      "user": "system",
      "metadata": {
        "threat_id": 1,
        "severity": "critical",
        "auto_generated": true
      }
    }
  ],
  "total": 234
}
```

---

## Endpoints de Deep Learning

### GET /api/ml/models
Liste des modèles disponibles.

**Response Success (200):**
```json
{
  "models": [
    {
      "name": "threat_lstm",
      "type": "LSTM",
      "status": "trained",
      "accuracy": 92.5,
      "last_training": "2025-07-15T10:00:00Z",
      "parameters": {
        "input_size": 10,
        "hidden_size": 64,
        "num_layers": 2
      }
    },
    {
      "name": "anomaly_autoencoder",
      "type": "Autoencoder",
      "status": "trained",
      "accuracy": 89.3,
      "last_training": "2025-07-15T11:30:00Z"
    }
  ]
}
```

### POST /api/ml/train
Entraînement d'un modèle ML.

**Request Body:**
```json
{
  "model_type": "lstm",
  "parameters": {
    "epochs": 100,
    "learning_rate": 0.001,
    "batch_size": 32
  }
}
```

**Response Success (200):**
```json
{
  "message": "Model training started",
  "job_id": "training_job_1234",
  "estimated_duration": "15 minutes",
  "status": "in_progress"
}
```

### POST /api/ml/predict
Prédiction avec modèle ML.

**Request Body:**
```json
{
  "model_name": "threat_lstm",
  "input_data": [
    [0.8, 0.6, 0.9, 0.7, 0.5, 0.8, 0.6, 0.7, 0.9, 0.8]
  ]
}
```

**Response Success (200):**
```json
{
  "predictions": [
    {
      "value": 0.847,
      "confidence": 0.923,
      "model_used": "threat_lstm",
      "interpretation": "High threat probability"
    }
  ],
  "processing_time": 0.023
}
```

---

## Endpoints d'Administration

### GET /api/admin/config
Configuration système actuelle.

**Response Success (200):**
```json
{
  "llm_config": {
    "provider": "openai",
    "model": "gpt-4",
    "api_key": "sk-****",
    "temperature": 0.7
  },
  "ml_config": {
    "model_path": "./models",
    "auto_retrain": true,
    "retrain_interval": 24
  },
  "system_config": {
    "cache_ttl": 300,
    "max_connections": 10,
    "log_level": "INFO"
  }
}
```

### POST /api/admin/config
Sauvegarde de la configuration système.

**Request Body:**
```json
{
  "llm_config": {
    "provider": "openai",
    "model": "gpt-4",
    "temperature": 0.8
  }
}
```

**Response Success (200):**
```json
{
  "message": "Configuration saved successfully",
  "updated_at": "2025-07-16T14:40:00Z"
}
```

### GET /api/admin/performance
Métriques de performance système.

**Response Success (200):**
```json
{
  "system_metrics": {
    "cpu_usage": 23.5,
    "memory_usage": 67.8,
    "disk_usage": 45.2,
    "uptime": 86400
  },
  "api_metrics": {
    "requests_per_second": 12.5,
    "average_response_time": 0.087,
    "error_rate": 0.02
  },
  "database_metrics": {
    "active_connections": 7,
    "query_time": 0.045,
    "cache_hit_rate": 94.3
  },
  "cache_metrics": {
    "hit_rate": 89.5,
    "miss_rate": 10.5,
    "entries": 1247
  }
}
```

---

## Codes d'Erreur

### 400 - Bad Request
```json
{
  "error": "bad_request",
  "message": "Invalid request parameters",
  "details": {
    "field": "severity",
    "expected": ["low", "medium", "high", "critical"]
  }
}
```

### 401 - Unauthorized
```json
{
  "error": "unauthorized",
  "message": "Token is missing or invalid"
}
```

### 403 - Forbidden
```json
{
  "error": "forbidden",
  "message": "Insufficient clearance level",
  "required_level": 3,
  "user_level": 2
}
```

### 404 - Not Found
```json
{
  "error": "not_found",
  "message": "Resource not found",
  "resource": "threat",
  "id": 999
}
```

### 429 - Too Many Requests
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests",
  "retry_after": 60
}
```

### 500 - Internal Server Error
```json
{
  "error": "internal_server_error",
  "message": "An internal error occurred",
  "request_id": "req_1234567890"
}
```

---

## Exemples d'Utilisation

### Authentification et récupération des menaces
```bash
# Authentification
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Utilisation du token
curl -X GET http://localhost:8000/api/threats/realtime \
  -H "Authorization: Bearer db_token_admin_1234567890"
```

### Upload et analyse de document
```bash
curl -X POST http://localhost:8000/api/ingestion \
  -H "Authorization: Bearer db_token_admin_1234567890" \
  -F "file=@document.pdf" \
  -F 'metadata={"source": "Intelligence Report"}'
```

### Réévaluation de cluster
```bash
curl -X POST http://localhost:8000/api/cluster/12/evaluate \
  -H "Authorization: Bearer db_token_admin_1234567890"
```

---

## Limites et Considérations

### Rate Limiting
- **Authentification**: 5 tentatives par minute
- **Ingestion**: 10 documents par minute
- **API générale**: 100 requêtes par minute

### Tailles de données
- **Upload de fichiers**: Maximum 10MB
- **Réponses API**: Maximum 1000 éléments par page
- **Requêtes simultanées**: Maximum 50

### Cache
- **TTL par défaut**: 300 secondes
- **Invalidation**: Automatique lors des modifications
- **Patterns**: Utilisation de wildcards pour l'invalidation

### Sécurité
- **Tokens**: Expiration après 1 heure
- **HTTPS**: Obligatoire en production
- **Validation**: Tous les inputs sont validés
- **Logs**: Toutes les requêtes sont loggées