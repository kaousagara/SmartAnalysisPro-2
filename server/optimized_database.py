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
            # Utiliser DATABASE_URL si disponible, sinon utiliser les variables individuelles
            database_url = os.getenv('DATABASE_URL')
            
            if database_url:
                # Parser DATABASE_URL pour extraire les paramètres
                from urllib.parse import urlparse
                parsed = urlparse(database_url)
                
                self.connection_pool = SimpleConnectionPool(
                    min_connections,
                    max_connections,
                    host=parsed.hostname,
                    database=parsed.path[1:],  # Enlever le slash initial
                    user=parsed.username,
                    password=parsed.password,
                    port=parsed.port or 5432,
                    sslmode='require'  # Forcer SSL comme dans l'URL
                )
            else:
                # Fallback sur les variables individuelles
                self.connection_pool = SimpleConnectionPool(
                    min_connections,
                    max_connections,
                    host=os.getenv('PGHOST', 'localhost'),
                    database=os.getenv('PGDATABASE', 'postgres'),
                    user=os.getenv('PGUSER', 'postgres'),
                    password=os.getenv('PGPASSWORD', ''),
                    port=int(os.getenv('PGPORT', '5432'))
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

        # Toujours forcer refresh pour éviter les problèmes de cache
        # if not force_refresh:
        #     cached_result = cache_manager.get(cache_key)
        #     if cached_result:
        #         return cached_result

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

    def generate_test_data(self) -> Dict:
        """Générer des données de test pour le système"""
        try:
            # Supprimer les données existantes (sauf users) dans l'ordre des dépendances
            self.execute_query("DELETE FROM threat_scores")
            self.execute_query("DELETE FROM alerts")
            self.execute_query("DELETE FROM actions")
            self.execute_query("DELETE FROM threats")
            self.execute_query("DELETE FROM scenarios")
            self.execute_query("DELETE FROM data_sources")
            self.execute_query("DELETE FROM prescriptions")
            self.execute_query("DELETE FROM document_analysis")
            self.execute_query("DELETE FROM predictions")
            
            # Invalider le cache pour forcer la suppression
            self.invalidate_cache(['*'])

            # Insérer des sources de données de test
            data_sources = [
                ('SIGINT Collection Alpha', 'sigint', 'https://sigint.intel.gov/feed', 'active', '2024-01-15 10:30:00', 1250.5),
                ('HUMINT Network Beta', 'humint', 'https://humint.intel.gov/reports', 'active', '2024-01-15 11:45:00', 850.3),
                ('OSINT Crawler Gamma', 'osint', 'https://osint.intel.gov/api', 'active', '2024-01-15 09:15:00', 2100.7),
                ('STIX/TAXII Feed Delta', 'stix', 'https://taxii.intel.gov/collections', 'active', '2024-01-15 08:20:00', 950.2),
                ('COMINT Intercept Epsilon', 'comint', 'https://comint.intel.gov/stream', 'active', '2024-01-15 12:10:00', 1750.8),
                ('IMINT Satellite Zeta', 'imint', 'https://imint.intel.gov/imagery', 'active', '2024-01-15 07:45:00', 3200.4),
                ('Legacy System Theta', 'json', 'https://legacy.intel.gov/export', 'inactive', '2024-01-14 18:30:00', 125.1),
                ('Emergency Feed Kappa', 'json', 'https://emergency.intel.gov/alerts', 'error', '2024-01-15 06:00:00', 0.0)
            ]

            source_ids = []
            for name, type_, url, status, last_ingested, throughput in data_sources:
                result = self.execute_query("""
                    INSERT INTO data_sources (name, type, url, status, last_ingested, throughput)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
                """, (name, type_, url, status, last_ingested, throughput), fetch_one=True)
                if result:
                    source_ids.append(result['id'])
            
            print(f"DEBUG: Created {len(source_ids)} data sources: {source_ids}")

            # Vérifier les sources de données créées
            actual_sources = self.execute_query("SELECT id FROM data_sources ORDER BY id", fetch_all=True)
            actual_source_ids = [row['id'] for row in actual_sources] if actual_sources else []
            print(f"DEBUG: Actual data sources from DB: {actual_source_ids}")
            
            # Insérer des menaces de test avec validation des IDs
            threats = [
                ('Activité réseau suspecte', 'Tentative d\'intrusion détectée sur infrastructure critique', 0.85, 'high', 'active', '{"ip": "192.168.1.100", "port": 22, "protocol": "ssh"}'),
                ('Détection de malware', 'Logiciel malveillant identifié dans les communications', 0.92, 'critical', 'active', '{"hash": "a1b2c3d4", "type": "trojan", "family": "APT29"}'),
                ('Tentative d\'accès non autorisé', 'Multiples tentatives de connexion échouées', 0.67, 'medium', 'resolved', '{"user": "admin", "attempts": 15, "source_ip": "203.0.113.0"}'),
                ('Communication chiffrée anormale', 'Trafic chiffré inhabituel détecté', 0.78, 'high', 'active', '{"encryption": "AES-256", "frequency": "high", "destination": "unknown"}'),
                ('Exfiltration de données suspectée', 'Volume de données sortant anormalement élevé', 0.89, 'critical', 'active', '{"size": "2.5GB", "destination": "external", "protocol": "https"}'),
                ('Mouvement de personnel suspect', 'Mouvement inhabituel détecté par imagerie satellite', 0.73, 'medium', 'active', '{"location": "45.123,-73.456", "vehicles": 12, "personnel": 45}'),
                ('Alerte système legacy', 'Alerte générée par système hérité', 0.45, 'low', 'archived', '{"system": "legacy", "alert_type": "maintenance"}'),
                ('Panne de communication', 'Interruption des communications d\'urgence', 0.95, 'critical', 'active', '{"duration": "2h30m", "affected_units": 23, "cause": "unknown"}')
            ]

            threat_ids = []
            for i, (name, desc, score, severity, status, metadata) in enumerate(threats):
                if actual_source_ids:
                    source_id = actual_source_ids[i % len(actual_source_ids)]
                    result = self.execute_query("""
                        INSERT INTO threats (name, description, score, severity, status, source_id, metadata)
                        VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb) RETURNING id
                    """, (name, desc, score, severity, status, source_id, metadata), fetch_one=True)
                    if result:
                        threat_ids.append(result['id'])
            
            print(f"DEBUG: Created {len(threat_ids)} threats: {threat_ids}")

            # Insérer des scénarios de test
            scenarios = [
                ('CYBER-INTRUSION-07', 'Détection d\'intrusion cybernétique', 
                 '[{"type": "network_anomaly", "threshold": 0.8}, {"type": "multiple_failures", "count": 3}]',
                 '[{"type": "SIGINT_COLLECTION", "description": "Renforcer la surveillance réseau"}, {"type": "INCIDENT_RESPONSE", "description": "Activer l\'équipe de réponse"}]',
                 'active', 1, 'P1H'),
                ('ATT-2024-MALI', 'Surveillance des menaces au Mali', 
                 '[{"type": "geographic_alert", "region": "mali"}, {"type": "threat_level", "min": 0.7}]',
                 '[{"type": "HUMINT_COLLECTION", "description": "Déployer agents sur le terrain"}, {"type": "SATELLITE_MONITORING", "description": "Surveillance par satellite"}]',
                 'active', 2, 'P24H'),
                ('PHISHING-CAMPAIGN-DETECT', 'Détection de campagne de phishing',
                 '[{"type": "email_indicators", "value": "suspicious"}, {"type": "volume", "operator": ">", "value": 100}]',
                 '[{"type": "EMAIL_FILTERING", "description": "Activer le filtrage email"}, {"type": "USER_NOTIFICATION", "description": "Notifier les utilisateurs"}]',
                 'partial', 3, 'P12H')
            ]

            scenario_ids = []
            for name, desc, conditions, actions, status, priority, validity in scenarios:
                result = self.execute_query("""
                    INSERT INTO scenarios (name, description, conditions, actions, status, priority, validity_window)
                    VALUES (%s, %s, %s::jsonb, %s::jsonb, %s, %s, %s) RETURNING id
                """, (name, desc, conditions, actions, status, priority, validity), fetch_one=True)
                if result:
                    scenario_ids.append(result['id'])
            
            print(f"DEBUG: Created {len(scenario_ids)} scenarios: {scenario_ids}")

            # Insérer des actions de test
            actions = [
                ('sigint', 'Collection SIGINT intensifiée sur réseau cible', 'P1', 'in_progress', threat_ids[0] if threat_ids else None, scenario_ids[0] if scenario_ids else None, '{"target": "network_alpha", "duration": "72h"}'),
                ('humint', 'Activation d\'agent sur terrain Mali', 'P2', 'pending', threat_ids[1] if len(threat_ids) > 1 else None, scenario_ids[1] if len(scenario_ids) > 1 else None, '{"agent_id": "H001", "location": "mali"}'),
                ('collection', 'Surveillance renforcée communications', 'P1', 'completed', threat_ids[2] if len(threat_ids) > 2 else None, scenario_ids[0] if scenario_ids else None, '{"channels": ["radio", "satellite"], "priority": "high"}'),
                ('alert', 'Alerte diffusée aux unités terrain', 'P3', 'completed', threat_ids[3] if len(threat_ids) > 3 else None, None, '{"units": ["alpha", "bravo"], "message": "threat_detected"}'),
                ('imint', 'Analyse imagerie satellite zone sensible', 'P2', 'in_progress', threat_ids[4] if len(threat_ids) > 4 else None, scenario_ids[1] if len(scenario_ids) > 1 else None, '{"coordinates": "45.123,-73.456", "resolution": "0.5m"}'),
                ('investigation', 'Enquête approfondie sur exfiltration', 'P1', 'pending', threat_ids[5] if len(threat_ids) > 5 else None, None, '{"lead_investigator": "I002", "estimated_duration": "48h"}')
            ]

            for type_, desc, priority, status, threat_id, scenario_id, metadata in actions:
                self.execute_query("""
                    INSERT INTO actions (type, description, priority, status, related_threat_id, related_scenario_id, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb)
                """, (type_, desc, priority, status, threat_id, scenario_id, metadata))

            # Insérer des alertes de test
            alerts = [
                ('threat', 'critical', 'Menace critique détectée', 'La menace "Détection de malware" a atteint un niveau critique (0.92)', False, threat_ids[1] if len(threat_ids) > 1 else None),
                ('threat', 'warning', 'Nouvelle menace identifiée', 'Une nouvelle menace a été détectée: "Activité réseau suspecte"', False, threat_ids[0] if threat_ids else None),
                ('system', 'error', 'Erreur de source de données', 'La source "Emergency Feed Kappa" ne répond plus', True, None),
                ('data', 'info', 'Ingestion de données complétée', 'Ingestion réussie de 1,250 enregistrements depuis SIGINT Alpha', True, None),
                ('threat', 'warning', 'Évolution de menace', 'Le score de menace "Communication chiffrée anormale" a augmenté', False, threat_ids[3] if len(threat_ids) > 3 else None)
            ]

            for type_, severity, title, message, is_read, threat_id in alerts:
                self.execute_query("""
                    INSERT INTO alerts (type, severity, title, message, is_read, related_threat_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (type_, severity, title, message, is_read, threat_id))

            # Invalider tous les caches
            self.invalidate_cache(['*'])

            return {
                'threats_created': len(threat_ids),
                'scenarios_created': len(scenario_ids),
                'actions_created': len(actions),
                'alerts_created': len(alerts),
                'data_sources_created': len(source_ids),
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            print(f"Erreur génération données de test: {str(e)}")
            raise e

    def clear_test_data(self) -> Dict:
        """Supprimer toutes les données de test (sauf utilisateurs)"""
        try:
            deleted_counts = {}
            
            # Supprimer les données dans l'ordre des dépendances
            tables = ['threat_scores', 'alerts', 'actions', 'threats', 'scenarios', 'data_sources', 'prescriptions', 'document_analysis', 'predictions']
            
            for table in tables:
                result = self.execute_query(f"DELETE FROM {table}")
                deleted_counts[table] = result
            
            # Invalider tous les caches
            self.invalidate_cache(['*'])
            
            return {
                'deleted_counts': deleted_counts,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Erreur suppression données de test: {str(e)}")
            raise e

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