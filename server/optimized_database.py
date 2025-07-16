import os
import psycopg2
from psycopg2.extras import Json, RealDictCursor
from psycopg2.pool import SimpleConnectionPool
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from typing import Dict, List, Optional
import json
from cache_manager import cache_manager

class OptimizedDatabase:
    """Version optimisée de la base de données avec pool de connexions et cache"""

    def __init__(self, min_connections=2, max_connections=10):
        self.connection_pool = None
        self.init_connection_pool(min_connections, max_connections)
        self.init_tables()

    def init_connection_pool(self, min_connections, max_connections):
        """Initialiser le pool de connexions"""
        try:
            self.connection_pool = SimpleConnectionPool(
                min_connections,
                max_connections,
                host=os.getenv('PGHOST'),
                database=os.getenv('PGDATABASE'),
                user=os.getenv('PGUSER'),
                password=os.getenv('PGPASSWORD'),
                port=os.getenv('PGPORT')
            )
            print("Pool de connexions initialisé avec succès")
        except Exception as e:
            print(f"Erreur lors de l'initialisation du pool: {e}")

    def get_connection(self):
        """Obtenir une connexion du pool"""
        try:
            return self.connection_pool.getconn()
        except Exception as e:
            print(f"Erreur lors de l'obtention de la connexion: {e}")
            return None

    def return_connection(self, conn):
        """Retourner une connexion au pool"""
        try:
            self.connection_pool.putconn(conn)
        except Exception as e:
            print(f"Erreur lors du retour de la connexion: {e}")

    def execute_query(self, query: str, params: tuple = None, fetch_one: bool = False, fetch_all: bool = False):
        """Exécuter une requête avec gestion optimisée des connexions"""
        conn = None
        retries = 3
        
        for attempt in range(retries):
            try:
                conn = self.get_connection()
                if conn is None:
                    # Essayer de recréer le pool de connexions
                    self.init_connection_pool(2, 10)
                    conn = self.get_connection()
                    if conn is None:
                        return None

                # Tester la connexion
                if conn.closed:
                    print(f"Connexion fermée, tentative {attempt + 1}/{retries}")
                    if conn:
                        self.return_connection(conn)
                    continue
                
                with conn.cursor(cursor_factory=RealDictCursor) as cursor:
                    cursor.execute(query, params)

                    if fetch_one:
                        result = cursor.fetchone()
                        return dict(result) if result else None
                    elif fetch_all:
                        results = cursor.fetchall()
                        return [dict(row) for row in results]
                    else:
                        conn.commit()
                        return cursor.rowcount
                        
            except (psycopg2.OperationalError, psycopg2.InterfaceError) as e:
                print(f"Erreur de connexion (tentative {attempt + 1}/{retries}): {e}")
                if conn:
                    try:
                        self.return_connection(conn)
                    except:
                        pass
                    conn = None
                
                if attempt < retries - 1:
                    # Recréer le pool de connexions
                    self.init_connection_pool(2, 10)
                    continue
                else:
                    return None
                    
            except Exception as e:
                print(f"Erreur lors de l'exécution de la requête: {e}")
                if conn:
                    try:
                        conn.rollback()
                    except:
                        pass
                return None
            finally:
                if conn:
                    try:
                        self.return_connection(conn)
                    except:
                        pass
            
            # Si on arrive ici, la requête a réussi
            break
        
        return None

    def init_tables(self):
        """Initialiser les tables avec requêtes optimisées"""
        try:
            # Créer les tables avec index optimisés
            queries = [
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    clearance_level INTEGER DEFAULT 1,
                    name VARCHAR(100),
                    email VARCHAR(100),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
                CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
                """,
                """
                CREATE TABLE IF NOT EXISTS threats (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    score REAL NOT NULL,
                    severity VARCHAR(20) NOT NULL,
                    status VARCHAR(20) DEFAULT 'active',
                    source_id INTEGER,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_threats_score ON threats(score);
                CREATE INDEX IF NOT EXISTS idx_threats_status ON threats(status);
                CREATE INDEX IF NOT EXISTS idx_threats_created ON threats(created_at);
                CREATE INDEX IF NOT EXISTS idx_threats_severity ON threats(severity);
                """,
                """
                CREATE TABLE IF NOT EXISTS scenarios (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    conditions JSONB NOT NULL,
                    actions JSONB NOT NULL,
                    status VARCHAR(20) DEFAULT 'active',
                    priority INTEGER DEFAULT 3,
                    validity_window VARCHAR(20) DEFAULT 'P7D',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_scenarios_status ON scenarios(status);
                CREATE INDEX IF NOT EXISTS idx_scenarios_priority ON scenarios(priority);
                """,
                """
                CREATE TABLE IF NOT EXISTS actions (
                    id SERIAL PRIMARY KEY,
                    type VARCHAR(50) NOT NULL,
                    description TEXT,
                    priority VARCHAR(10) DEFAULT 'P3',
                    status VARCHAR(20) DEFAULT 'pending',
                    related_threat_id INTEGER,
                    related_scenario_id INTEGER,
                    metadata JSONB,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_actions_status ON actions(status);
                CREATE INDEX IF NOT EXISTS idx_actions_priority ON actions(priority);
                CREATE INDEX IF NOT EXISTS idx_actions_threat ON actions(related_threat_id);
                """,
                """
                CREATE TABLE IF NOT EXISTS alerts (
                    id SERIAL PRIMARY KEY,
                    type VARCHAR(50) NOT NULL,
                    severity VARCHAR(20) NOT NULL,
                    title VARCHAR(200) NOT NULL,
                    message TEXT,
                    is_read BOOLEAN DEFAULT FALSE,
                    related_threat_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(is_read);
                CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
                CREATE INDEX IF NOT EXISTS idx_alerts_created ON alerts(created_at);
                """,
                """
                CREATE TABLE IF NOT EXISTS prescriptions (
                    id SERIAL PRIMARY KEY,
                    threat_id VARCHAR(100) NOT NULL,
                    priority VARCHAR(10) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    time_estimate VARCHAR(50),
                    confidence REAL NOT NULL,
                    actions JSONB NOT NULL,
                    resources JSONB,
                    status VARCHAR(20) DEFAULT 'active',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
                CREATE INDEX IF NOT EXISTS idx_prescriptions_priority ON prescriptions(priority);
                CREATE INDEX IF NOT EXISTS idx_prescriptions_threat ON prescriptions(threat_id);
                """,
                """
                CREATE TABLE IF NOT EXISTS data_sources (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    url VARCHAR(255),
                    status VARCHAR(20) DEFAULT 'active',
                    last_ingested TIMESTAMP,
                    throughput REAL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_data_sources_status ON data_sources(status);
                CREATE INDEX IF NOT EXISTS idx_data_sources_type ON data_sources(type);
                """,
                """
                CREATE TABLE IF NOT EXISTS document_analysis (
                    id SERIAL PRIMARY KEY,
                    document_id VARCHAR(100) NOT NULL,
                    analysis_type VARCHAR(50) NOT NULL,
                    analysis_result JSONB,
                    confidence_score REAL DEFAULT 0.0,
                    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    metadata JSONB
                );
                CREATE INDEX IF NOT EXISTS idx_document_analysis_doc ON document_analysis(document_id);
                CREATE INDEX IF NOT EXISTS idx_document_analysis_type ON document_analysis(analysis_type);
                CREATE INDEX IF NOT EXISTS idx_document_analysis_processed ON document_analysis(processed_at);
                """
            ]

            for query in queries:
                self.execute_query(query)

            # Créer les utilisateurs par défaut si nécessaire
            user_count = self.execute_query("SELECT COUNT(*) FROM users", fetch_one=True)
            if user_count and user_count['count'] == 0:
                self._create_default_users()

        except Exception as e:
            print(f"Erreur lors de l'initialisation des tables: {e}")

    def _create_default_users(self):
        """Créer les utilisateurs par défaut"""
        default_users = [
            ('admin', 'admin123', 5, 'Administrateur', 'admin@intelligence.gov'),
            ('analyst', 'analyst123', 3, 'Analyste Principal', 'analyst@intelligence.gov'),
            ('operator', 'operator123', 2, 'Opérateur', 'operator@intelligence.gov')
        ]

        for username, password, clearance, name, email in default_users:
            hashed_password = generate_password_hash(password)
            self.execute_query(
                "INSERT INTO users (username, password, clearance_level, name, email) VALUES (%s, %s, %s, %s, %s)",
                (username, hashed_password, clearance, name, email)
            )

    def get_all_threats_cached(self, force_refresh: bool = False):
        """Récupérer toutes les menaces avec mise en cache"""
        cache_key = "all_threats"

        if not force_refresh:
            cached_result = cache_manager.get(cache_key)
            if cached_result:
                return cached_result

        threats = self.execute_query("""
            SELECT id, name, description, score, severity, status, 
                   source_id, metadata, created_at as timestamp
            FROM threats 
            ORDER BY created_at DESC
        """, fetch_all=True)

        if threats:
            cache_manager.set(cache_key, threats, 180)  # Cache pour 3 minutes

        return threats or []

    def get_dashboard_stats_cached(self, force_refresh: bool = False):
        """Récupérer les statistiques du dashboard avec cache"""
        cache_key = "dashboard_stats"

        if not force_refresh:
            cached_result = cache_manager.get(cache_key)
            if cached_result:
                return cached_result

        # Requête optimisée pour les statistiques
        stats_query = """
            SELECT 
                COUNT(*) as total_threats,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_threats,
                AVG(score) as avg_score,
                COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity,
                COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_severity
            FROM threats
        """

        stats = self.execute_query(stats_query, fetch_one=True)

        if stats:
            result = {
                'active_threats': int(stats['active_threats']) if stats['active_threats'] else 0,
                'avg_score': float(stats['avg_score']) if stats['avg_score'] else 0.0,
                'high_severity': int(stats['high_severity']) if stats['high_severity'] else 0,
                'critical_severity': int(stats['critical_severity']) if stats['critical_severity'] else 0,
                'total_threats': int(stats['total_threats']) if stats['total_threats'] else 0
            }

            cache_manager.set(cache_key, result, 120)  # Cache pour 2 minutes
            return result

        return {
            'active_threats': 0,
            'avg_score': 0.0,
            'high_severity': 0,
            'critical_severity': 0,
            'total_threats': 0
        }

    def get_all_documents_cached(self, force_refresh: bool = False):
        """Récupérer tous les documents avec mise en cache"""
        cache_key = "all_documents"

        if not force_refresh:
            cached_result = cache_manager.get(cache_key)
            if cached_result:
                return cached_result

        documents = self.execute_query("""
            SELECT id, name, description, metadata, created_at
            FROM threats 
            ORDER BY created_at DESC
        """, fetch_all=True)

        if documents:
            formatted_docs = []
            for doc in documents:
                formatted_docs.append({
                    'id': str(doc['id']),
                    'content': doc['description'] or '',
                    'source': 'Database - Threats',
                    'type': 'THREAT',
                    'created_at': doc['created_at'].isoformat() if doc['created_at'] else None,
                    'entities': [],
                    'threat_score': 0.5,
                    'metadata': doc['metadata'] if doc['metadata'] else {}
                })

            cache_manager.set(cache_key, formatted_docs, 300)  # Cache pour 5 minutes
            return formatted_docs

        return []

    def invalidate_cache(self, patterns: List[str]):
        """Invalider le cache pour des patterns spécifiques"""
        for pattern in patterns:
            cache_manager.invalidate_pattern(pattern)

    def cleanup_cache(self):
        """Nettoyer le cache expiré"""
        cache_manager.cleanup_expired()

    def get_cache_stats(self):
        """Obtenir les statistiques du cache"""
        return cache_manager.get_stats()

    def get_threat_by_id(self, threat_id: str) -> Optional[Dict]:
        """Récupérer une menace par son ID"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT data FROM threats WHERE json_extract(data, '$.id') = ?
                """, (threat_id,))

                result = cursor.fetchone()
                if result:
                    return json.loads(result[0])
                return None

        except Exception as e:
            print(f"Erreur récupération menace par ID: {str(e)}")
            return None

    def update_threat(self, threat_data: Dict) -> bool:
        """Mettre à jour une menace existante"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()

                threat_id = threat_data.get('id')
                if not threat_id:
                    return False

                cursor.execute("""
                    UPDATE threats 
                    SET data = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE json_extract(data, '$.id') = ?
                """, (json.dumps(threat_data), threat_id))

                conn.commit()
                return cursor.rowcount > 0

        except Exception as e:
            print(f"Erreur mise à jour menace: {str(e)}")
            return False

    def store_prescription(self, prescription_data: Dict) -> bool:
        """Stocker une prescription"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO prescriptions (data, created_at)
                    VALUES (?, CURRENT_TIMESTAMP)
                """, (json.dumps(prescription_data),))

                conn.commit()
                return True

        except Exception as e:
            print(f"Erreur stockage prescription: {str(e)}")
            return False

    def get_performance_metrics(self) -> Dict:
        """Récupérer les métriques de performance"""
        return {}

    def store_document(self, document_data: Dict) -> Dict:
        """Stocker un nouveau document dans la base de données"""
        try:
            import time
            # Préparer les données du document
            doc_id = document_data.get('id', int(time.time()))
            name = document_data.get('name', 'Document sans nom')
            content = document_data.get('content', '')
            doc_type = document_data.get('type', 'text')
            threat_score = document_data.get('threat_score', 0.0)
            
            # Stocker le document comme une menace
            insert_query = """
                INSERT INTO threats (id, name, description, threat_score, severity, status, source, timestamp, classification, category, confidence, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    threat_score = EXCLUDED.threat_score,
                    severity = EXCLUDED.severity,
                    timestamp = EXCLUDED.timestamp,
                    metadata = EXCLUDED.metadata
                RETURNING *
            """
            
            # Déterminer la sévérité basée sur le score
            if threat_score >= 0.8:
                severity = 'critical'
            elif threat_score >= 0.6:
                severity = 'high'
            elif threat_score >= 0.4:
                severity = 'medium'
            else:
                severity = 'low'
            
            # Métadonnées du document
            metadata = {
                'document_type': doc_type,
                'ingestion_time': datetime.now().isoformat(),
                'processing_type': 'unified_ingestion',
                'cluster_analysis': 'pending'
            }
            
            # Exécuter l'insertion
            result = self.execute_query(
                insert_query,
                (
                    doc_id,
                    name,
                    content,
                    threat_score,
                    severity,
                    'active',
                    'document_ingestion',
                    datetime.now().isoformat(),
                    'UNCLASSIFIED',
                    'document',
                    min(threat_score + 0.1, 1.0),  # Confidence légèrement supérieure au score
                    json.dumps(metadata)
                ),
                fetch_one=True
            )
            
            # Invalider les caches pertinents
            self.invalidate_cache(['threats*', 'documents*', 'dashboard*'])
            
            return {
                'id': doc_id,
                'name': name,
                'content': content,
                'type': doc_type,
                'threat_score': threat_score,
                'severity': severity,
                'status': 'stored',
                'timestamp': datetime.now().isoformat(),
                'metadata': metadata
            }
            
        except Exception as e:
            print(f"Erreur lors du stockage du document: {e}")
            return {
                'error': str(e),
                'status': 'failed'
            }

# Instance globale optimisée
optimized_db = OptimizedDatabase()