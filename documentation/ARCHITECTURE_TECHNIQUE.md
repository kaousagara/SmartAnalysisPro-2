# Architecture Technique - Système d'Analyse d'Intelligence

## Version 2.3.0 - Architecture Optimisée

### Vue d'ensemble architecturale

Le système d'analyse d'intelligence suit une architecture moderne en couches avec séparation claire des responsabilités, optimisations de performance et haute disponibilité.

---

## Architecture Globale

### Diagramme de l'architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  React 18 + TypeScript + Vite + Tailwind CSS + Radix UI       │
│  - Dashboard temps réel                                        │
│  - Gestion des menaces                                         │
│  - Interface d'administration                                  │
│  - Composants réutilisables                                    │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                             │
├─────────────────────────────────────────────────────────────────┤
│  Express.js Proxy + CORS + Authentication + Rate Limiting     │
│  - Routage des requêtes                                       │
│  - Validation des tokens                                       │
│  - Gestion des erreurs                                         │
│  - Monitoring des requêtes                                     │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  Flask Application + Services + Controllers                   │
│  - Logique métier                                             │
│  - Orchestration des services                                 │
│  - Gestion des workflows                                       │
│  - Validation des données                                      │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    BUSINESS SERVICES                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Threat Service  │ │ Prescription    │ │ Deep Learning   │   │
│  │ - Scoring       │ │ Service         │ │ Service         │   │
│  │ - Classification│ │ - Génération    │ │ - LSTM Models   │   │
│  │ - Alertes       │ │ - Priorisation  │ │ - Autoencoders  │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Evaluation      │ │ Clustering      │ │ Data Ingestion  │   │
│  │ Service         │ │ Service         │ │ Service         │   │
│  │ - Réévaluation  │ │ - Document      │ │ - Upload        │   │
│  │ - Clustering    │ │ - Similarité    │ │ - Processing    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                    INFRASTRUCTURE LAYER                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ Cache Manager   │ │ Performance     │ │ Optimized       │   │
│  │ - Redis Cache   │ │ Monitor         │ │ Database        │   │
│  │ - TTL Management│ │ - Metrics       │ │ - Connection    │   │
│  │ - Invalidation  │ │ - Alerts        │ │ - Pool          │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                  ↓
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │ PostgreSQL      │ │ Redis Cache     │ │ File System     │   │
│  │ - Threats       │ │ - Sessions      │ │ - Uploads       │   │
│  │ - Documents     │ │ - Query Cache   │ │ - Models        │   │
│  │ - Predictions   │ │ - User Cache    │ │ - Logs          │   │
│  │ - Prescriptions │ │ - Stats Cache   │ │ - Temp Files    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Couche Présentation (Frontend)

### Technologies utilisées
- **React 18** avec hooks avancés et concurrent features
- **TypeScript** pour la sécurité de type
- **Vite** pour le build et HMR optimisé
- **Tailwind CSS** avec thème sombre personnalisé
- **Radix UI** pour l'accessibilité et les composants
- **TanStack Query** pour la gestion d'état serveur
- **React Hook Form** avec validation Zod

### Architecture des composants

```
client/src/
├── components/
│   ├── ui/                     # Composants UI de base
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── chart.tsx
│   ├── layout/                 # Composants de mise en page
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── features/               # Composants métier
│   │   ├── ThreatCard.tsx
│   │   ├── AlertPanel.tsx
│   │   └── PrescriptionList.tsx
│   └── forms/                  # Composants de formulaires
│       ├── ThreatForm.tsx
│       └── UserForm.tsx
├── pages/                      # Pages de l'application
│   ├── Dashboard.tsx
│   ├── Threats.tsx
│   ├── Analytics.tsx
│   └── Settings.tsx
├── hooks/                      # Hooks personnalisés
│   ├── useAuth.ts
│   ├── useApi.ts
│   └── useCache.ts
├── lib/                        # Utilitaires
│   ├── api.ts
│   ├── utils.ts
│   └── constants.ts
└── types/                      # Types TypeScript
    ├── api.ts
    ├── threat.ts
    └── user.ts
```

### Optimisations frontend
- **Code splitting** avec lazy loading
- **Memoization** des composants coûteux
- **Virtualisation** des listes longues
- **Caching** intelligent avec TanStack Query
- **Bundling** optimisé avec Vite
- **Tree shaking** automatique

---

## Couche API (Express Proxy)

### Architecture du proxy

```typescript
// server/index.ts
app.use('/api', (req, res, next) => {
  // Authentification
  const token = req.headers.authorization;
  
  // Validation
  if (!validateToken(token)) {
    return res.status(401).json({ message: 'Token invalid' });
  }
  
  // Proxy vers Flask
  proxy(`http://localhost:8000${req.path}`, {
    headers: req.headers,
    method: req.method,
    body: req.body
  });
});
```

### Responsabilités
- **Routage** des requêtes vers le backend Flask
- **Authentification** et validation des tokens
- **CORS** et gestion des headers
- **Rate limiting** et protection DDoS
- **Monitoring** des requêtes
- **Gestion d'erreurs** centralisée

---

## Couche Application (Flask Backend)

### Architecture Flask

```python
# server/simple_flask_app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from services.threat_service import ThreatService
from services.prescription_service import PrescriptionService
from optimized_database import optimized_db
from cache_manager import cache_manager
from performance_monitor import performance_monitor

app = Flask(__name__)
CORS(app)

# Middleware d'authentification
@app.before_request
def authenticate():
    if request.endpoint != 'login':
        token = request.headers.get('Authorization')
        if not validate_token(token):
            return jsonify({'error': 'Unauthorized'}), 401

# Routes API
@app.route('/api/threats', methods=['GET'])
@cache_manager.cached(timeout=60)
def get_threats():
    service = ThreatService()
    return jsonify(service.get_all_threats())
```

### Structure des services

```python
# Service Pattern
class ThreatService:
    def __init__(self):
        self.db = optimized_db
        self.cache = cache_manager
        
    def get_all_threats(self):
        # Logique métier
        pass
    
    def calculate_score(self, threat_data):
        # Calcul du score
        pass
```

---

## Couche Services Métier

### 1. Threat Service

```python
class ThreatService:
    """Service de gestion des menaces"""
    
    def __init__(self):
        self.db = optimized_db
        self.cache = cache_manager
        self.ml_models = self._load_ml_models()
    
    def calculate_threat_score(self, threat_data: Dict) -> float:
        """Calcul du score de menace avec ML"""
        # Algorithme de scoring
        intention_score = self._calculate_intention(threat_data)
        credibility_score = self._calculate_credibility(threat_data)
        temporal_score = self._calculate_temporal_coherence(threat_data)
        network_score = self._calculate_network_density(threat_data)
        
        # Pondération
        weights = {
            'intention': 0.35,
            'credibility': 0.25,
            'temporal': 0.20,
            'network': 0.20
        }
        
        total_score = (
            intention_score * weights['intention'] +
            credibility_score * weights['credibility'] +
            temporal_score * weights['temporal'] +
            network_score * weights['network']
        )
        
        return min(max(total_score, 0.0), 1.0)
```

### 2. Threat Evaluation Service

```python
class ThreatEvaluationService:
    """Service de réévaluation automatique"""
    
    def __init__(self):
        self.db = optimized_db
        self.clustering_service = DocumentClusteringService()
        self.threat_service = ThreatService()
        self.prescription_service = PrescriptionService()
    
    def evaluate_document(self, document_id: int) -> Dict:
        """Évaluation d'un document et réévaluation du cluster"""
        
        # 1. Récupérer le document
        document = self.db.get_document_by_id(document_id)
        
        # 2. Identifier le cluster
        cluster_id = self.clustering_service.get_cluster_id(document)
        
        # 3. Réévaluer tous les documents du cluster
        cluster_documents = self.db.get_documents_by_cluster(cluster_id)
        
        # 4. Recalculer les scores
        evaluation_results = []
        for doc in cluster_documents:
            new_score = self.threat_service.calculate_threat_score(doc)
            self.db.update_document_score(doc['id'], new_score)
            evaluation_results.append({
                'document_id': doc['id'],
                'old_score': doc['threat_score'],
                'new_score': new_score
            })
        
        # 5. Générer des prédictions
        predictions = self._generate_predictions(cluster_documents)
        
        # 6. Créer des prescriptions
        prescriptions = self.prescription_service.generate_from_cluster(
            cluster_documents, predictions
        )
        
        # 7. Invalider le cache
        self.cache.invalidate_pattern(f"threats_*")
        self.cache.invalidate_pattern(f"cluster_{cluster_id}_*")
        
        return {
            'document_id': document_id,
            'cluster_id': cluster_id,
            'documents_updated': len(evaluation_results),
            'predictions_generated': len(predictions),
            'prescriptions_created': len(prescriptions),
            'evaluation_results': evaluation_results
        }
```

### 3. Document Clustering Service

```python
class DocumentClusteringService:
    """Service de clustering de documents"""
    
    def __init__(self):
        self.db = optimized_db
        self.vectorizer = TfidfVectorizer(max_features=1000)
        self.clustering_model = KMeans(n_clusters=10)
    
    def cluster_all_documents(self) -> Dict:
        """Clustering de TOUS les documents de la base"""
        
        # EXIGENCE CRITIQUE : Utiliser TOUS les documents
        all_documents = self.db.get_all_documents()
        
        if len(all_documents) < 2:
            return {'message': 'Not enough documents for clustering'}
        
        # Extraction des features
        texts = [doc['content'] for doc in all_documents]
        features = self.vectorizer.fit_transform(texts)
        
        # Clustering
        clusters = self.clustering_model.fit_predict(features)
        
        # Mise à jour de la base
        for i, doc in enumerate(all_documents):
            self.db.update_document_cluster(doc['id'], int(clusters[i]))
        
        # Analyse des clusters
        cluster_analysis = self._analyze_clusters(all_documents, clusters)
        
        return {
            'total_documents': len(all_documents),
            'clusters_created': len(set(clusters)),
            'cluster_analysis': cluster_analysis
        }
```

---

## Couche Infrastructure

### 1. Cache Manager

```python
class CacheManager:
    """Gestionnaire de cache Redis optimisé"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host='localhost',
            port=6379,
            decode_responses=True
        )
        self.default_ttl = 300  # 5 minutes
    
    def get(self, key: str) -> Optional[Any]:
        """Récupération avec désérialisation"""
        try:
            value = self.redis_client.get(key)
            return json.loads(value) if value else None
        except Exception:
            return None
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Stockage avec TTL"""
        try:
            ttl = ttl or self.default_ttl
            self.redis_client.setex(
                key, 
                ttl, 
                json.dumps(value, default=str)
            )
        except Exception:
            pass
    
    def invalidate_pattern(self, pattern: str) -> None:
        """Invalidation par pattern"""
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
        except Exception:
            pass
```

### 2. Performance Monitor

```python
class PerformanceMonitor:
    """Monitoring des performances système"""
    
    def __init__(self):
        self.metrics = {
            'requests': defaultdict(list),
            'response_times': defaultdict(list),
            'errors': defaultdict(int),
            'system_metrics': []
        }
        self.start_time = time.time()
    
    def record_request(self, endpoint: str, duration: float, status: int):
        """Enregistrement d'une requête"""
        timestamp = time.time()
        
        self.metrics['requests'][endpoint].append({
            'timestamp': timestamp,
            'duration': duration,
            'status': status
        })
        
        self.metrics['response_times'][endpoint].append(duration)
        
        if status >= 400:
            self.metrics['errors'][endpoint] += 1
    
    def get_system_metrics(self) -> Dict:
        """Métriques système actuelles"""
        return {
            'cpu_usage': psutil.cpu_percent(),
            'memory_usage': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'uptime': time.time() - self.start_time,
            'active_connections': len(psutil.net_connections())
        }
```

### 3. Optimized Database

```python
class OptimizedDatabase:
    """Base de données avec pool de connexions"""
    
    def __init__(self, min_connections=2, max_connections=10):
        self.connection_pool = psycopg2.pool.ThreadedConnectionPool(
            min_connections,
            max_connections,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        self.cache = cache_manager
    
    def execute_query(self, query: str, params: tuple = None) -> List[Dict]:
        """Exécution optimisée des requêtes"""
        connection = None
        try:
            connection = self.connection_pool.getconn()
            cursor = connection.cursor(cursor_factory=RealDictCursor)
            
            start_time = time.time()
            cursor.execute(query, params)
            execution_time = time.time() - start_time
            
            # Monitoring
            performance_monitor.record_database_query(query, execution_time)
            
            if query.strip().upper().startswith('SELECT'):
                return cursor.fetchall()
            else:
                connection.commit()
                return cursor.rowcount
                
        except Exception as e:
            if connection:
                connection.rollback()
            raise e
        finally:
            if connection:
                self.connection_pool.putconn(connection)
```

---

## Couche Données

### 1. Modèle de données PostgreSQL

```sql
-- Schéma principal
CREATE SCHEMA intelligence_analysis;

-- Table des menaces
CREATE TABLE threats (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity threat_severity DEFAULT 'medium',
    score DECIMAL(3,2) DEFAULT 0.00,
    source VARCHAR(100),
    location VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW(),
    status threat_status DEFAULT 'active',
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table des documents
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    content_type VARCHAR(100),
    file_size INTEGER,
    upload_date TIMESTAMP DEFAULT NOW(),
    processed BOOLEAN DEFAULT FALSE,
    threat_score DECIMAL(3,2) DEFAULT 0.00,
    cluster_id INTEGER,
    entities JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimisation
CREATE INDEX CONCURRENTLY idx_threats_severity ON threats(severity);
CREATE INDEX CONCURRENTLY idx_threats_score ON threats(score DESC);
CREATE INDEX CONCURRENTLY idx_threats_timestamp ON threats(timestamp DESC);
CREATE INDEX CONCURRENTLY idx_documents_cluster ON documents(cluster_id);
CREATE INDEX CONCURRENTLY idx_documents_score ON documents(threat_score DESC);
```

### 2. Cache Redis

```
// Structure du cache
threats:all                    # Liste de toutes les menaces
threats:realtime               # Menaces temps réel
threats:evolution:24H          # Évolution sur 24h
dashboard:stats                # Statistiques du dashboard
prescriptions:all              # Toutes les prescriptions
prescriptions:stats            # Statistiques des prescriptions
cluster:12:documents           # Documents du cluster 12
user:session:token_xyz         # Session utilisateur
```

---

## Patterns Architecturaux

### 1. Repository Pattern

```python
class ThreatRepository:
    """Repository pour les menaces"""
    
    def __init__(self, db: OptimizedDatabase):
        self.db = db
    
    def find_all(self, limit: int = 100) -> List[Dict]:
        query = """
            SELECT * FROM threats 
            WHERE status = 'active' 
            ORDER BY timestamp DESC 
            LIMIT %s
        """
        return self.db.execute_query(query, (limit,))
    
    def find_by_severity(self, severity: str) -> List[Dict]:
        query = """
            SELECT * FROM threats 
            WHERE severity = %s AND status = 'active'
            ORDER BY score DESC
        """
        return self.db.execute_query(query, (severity,))
```

### 2. Service Layer Pattern

```python
class ThreatService:
    """Service pour la logique métier des menaces"""
    
    def __init__(self, threat_repo: ThreatRepository):
        self.threat_repo = threat_repo
        self.cache = cache_manager
    
    @cache_manager.cached(timeout=60)
    def get_realtime_threats(self, limit: int = 10) -> List[Dict]:
        """Menaces temps réel avec cache"""
        return self.threat_repo.find_all(limit)
    
    def calculate_threat_score(self, threat_data: Dict) -> float:
        """Calcul du score de menace"""
        # Logique de scoring
        pass
```

### 3. Observer Pattern

```python
class ThreatObserver:
    """Observateur pour les événements de menaces"""
    
    def __init__(self):
        self.observers = []
    
    def attach(self, observer):
        self.observers.append(observer)
    
    def notify(self, event_type: str, data: Dict):
        for observer in self.observers:
            observer.update(event_type, data)

# Utilisation
threat_observer = ThreatObserver()
threat_observer.attach(AlertService())
threat_observer.attach(PrescriptionService())
threat_observer.attach(NotificationService())
```

---

## Optimisations de Performance

### 1. Stratégies de Cache

```python
# Cache hiérarchique
class HierarchicalCache:
    def __init__(self):
        self.l1_cache = {}  # Cache mémoire
        self.l2_cache = redis_client  # Cache Redis
        self.l3_cache = database  # Base de données
    
    def get(self, key: str):
        # L1 Cache
        if key in self.l1_cache:
            return self.l1_cache[key]
        
        # L2 Cache
        value = self.l2_cache.get(key)
        if value:
            self.l1_cache[key] = value
            return value
        
        # L3 Cache (Database)
        value = self.l3_cache.get(key)
        if value:
            self.l2_cache.set(key, value)
            self.l1_cache[key] = value
            return value
        
        return None
```

### 2. Connection Pooling

```python
# Pool de connexions optimisé
class ConnectionPool:
    def __init__(self, min_conn=2, max_conn=10):
        self.pool = psycopg2.pool.ThreadedConnectionPool(
            min_conn, max_conn,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
    
    @contextmanager
    def get_connection(self):
        connection = self.pool.getconn()
        try:
            yield connection
        finally:
            self.pool.putconn(connection)
```

### 3. Lazy Loading

```python
class LazyLoader:
    """Chargement paresseux des données"""
    
    def __init__(self, loader_func):
        self.loader_func = loader_func
        self._value = None
        self._loaded = False
    
    def __get__(self, obj, objtype=None):
        if not self._loaded:
            self._value = self.loader_func()
            self._loaded = True
        return self._value
```

---

## Monitoring et Observabilité

### 1. Métriques système

```python
class SystemMetrics:
    """Collecte des métriques système"""
    
    def collect_metrics(self) -> Dict:
        return {
            'timestamp': time.time(),
            'cpu_usage': psutil.cpu_percent(interval=1),
            'memory_usage': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'network_io': psutil.net_io_counters()._asdict(),
            'process_count': len(psutil.pids()),
            'load_average': os.getloadavg()
        }
```

### 2. Logging structuré

```python
import structlog

logger = structlog.get_logger()

# Utilisation
logger.info(
    "Threat evaluation completed",
    document_id=123,
    cluster_id=45,
    processing_time=2.34,
    threats_updated=8
)
```

### 3. Health checks

```python
class HealthCheck:
    """Vérification de santé du système"""
    
    def check_database(self) -> bool:
        try:
            optimized_db.execute_query("SELECT 1")
            return True
        except:
            return False
    
    def check_cache(self) -> bool:
        try:
            cache_manager.set("health_check", "ok", 10)
            return cache_manager.get("health_check") == "ok"
        except:
            return False
    
    def get_health_status(self) -> Dict:
        return {
            'database': self.check_database(),
            'cache': self.check_cache(),
            'timestamp': time.time()
        }
```

---

## Sécurité

### 1. Authentification

```python
class AuthenticationService:
    """Service d'authentification"""
    
    def __init__(self):
        self.secret_key = os.environ.get('SECRET_KEY')
        self.token_expiry = timedelta(hours=1)
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        user = self.db.get_user_by_username(username)
        if user and check_password_hash(user['password'], password):
            token = self.generate_token(user)
            return {
                'user': user,
                'token': token
            }
        return None
    
    def generate_token(self, user: Dict) -> str:
        payload = {
            'user_id': user['id'],
            'username': user['username'],
            'clearance_level': user['clearance_level'],
            'exp': datetime.utcnow() + self.token_expiry
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')
```

### 2. Autorisation

```python
class AuthorizationService:
    """Service d'autorisation par niveau"""
    
    def check_clearance(self, user_clearance: int, required_clearance: int) -> bool:
        return user_clearance >= required_clearance
    
    def check_resource_access(self, user: Dict, resource: str, action: str) -> bool:
        permissions = self.get_user_permissions(user)
        return f"{resource}:{action}" in permissions
```

---

## Conclusion

Cette architecture technique offre :

- **Scalabilité** avec architecture en couches
- **Performance** avec cache multi-niveaux
- **Sécurité** avec authentification robuste
- **Monitoring** complet du système
- **Maintenabilité** avec patterns établis
- **Extensibilité** pour futures fonctionnalités

Le système est conçu pour gérer une charge importante tout en maintenant des temps de réponse optimaux et une haute disponibilité.