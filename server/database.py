import os
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from typing import Dict, List, Optional

class Database:
    def __init__(self):
        self.connection = None
        self.connect()
        self.init_tables()
    
    def connect(self):
        """Établir la connexion à la base de données PostgreSQL"""
        try:
            self.connection = psycopg2.connect(
                host=os.getenv('PGHOST'),
                database=os.getenv('PGDATABASE'),
                user=os.getenv('PGUSER'),
                password=os.getenv('PGPASSWORD'),
                port=os.getenv('PGPORT'),
                cursor_factory=RealDictCursor
            )
            self.connection.autocommit = True
            print("Connexion à la base de données établie avec succès")
        except Exception as e:
            print(f"Erreur de connexion à la base de données: {e}")
    
    def init_tables(self):
        """Initialiser les tables nécessaires"""
        try:
            cursor = self.connection.cursor()
            
            # Créer toutes les tables du système
            self._create_all_tables(cursor)
            
            # Insérer les utilisateurs par défaut s'ils n'existent pas
            cursor.execute("SELECT COUNT(*) FROM users")
            user_count = cursor.fetchone()['count']
            
            if user_count == 0:
                self._create_default_users(cursor)
            
            cursor.close()
            
        except Exception as e:
            print(f"Erreur lors de l'initialisation des tables: {e}")
    
    def _create_all_tables(self, cursor):
        """Créer toutes les tables nécessaires"""
        
        # Table users
        cursor.execute("""
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
            )
        """)
        
        # Table data_sources
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS data_sources (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                type VARCHAR(50) NOT NULL,
                url VARCHAR(255),
                status VARCHAR(20) DEFAULT 'active',
                last_ingested TIMESTAMP,
                throughput REAL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table threats
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS threats (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                score REAL NOT NULL,
                severity VARCHAR(20) NOT NULL,
                status VARCHAR(20) DEFAULT 'active',
                source_id INTEGER REFERENCES data_sources(id),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table scenarios
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS scenarios (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                description TEXT,
                conditions JSONB NOT NULL,
                actions JSONB NOT NULL,
                status VARCHAR(20) DEFAULT 'inactive',
                priority INTEGER DEFAULT 1,
                validity_window VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table actions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS actions (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                priority VARCHAR(10) NOT NULL,
                status VARCHAR(20) DEFAULT 'pending',
                related_threat_id INTEGER REFERENCES threats(id),
                related_scenario_id INTEGER REFERENCES scenarios(id),
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table alerts
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50) NOT NULL,
                severity VARCHAR(20) NOT NULL,
                title VARCHAR(200) NOT NULL,
                message TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                related_threat_id INTEGER REFERENCES threats(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table threat_scores
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS threat_scores (
                id SERIAL PRIMARY KEY,
                threat_id INTEGER REFERENCES threats(id),
                score REAL NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                metadata JSONB
            )
        """)
        
        # Table prescriptions
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS prescriptions (
                id SERIAL PRIMARY KEY,
                threat_id VARCHAR(50),
                priority VARCHAR(10),
                category VARCHAR(50),
                time_estimate VARCHAR(20),
                confidence REAL,
                actions JSONB,
                resources JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status VARCHAR(20) DEFAULT 'active'
            )
        """)
    
    def _create_default_users(self, cursor):
        """Créer les utilisateurs par défaut"""
        default_users = [
            ('analyst', 'analyst123', 3, 'Analyst J.Smith', 'analyst@intel.gov'),
            ('admin', 'admin123', 5, 'Admin User', 'admin@intel.gov'),
            ('operator', 'operator123', 2, 'Opérateur Système', 'operator@intel.gov')
        ]
        
        for username, password, clearance, name, email in default_users:
            hashed_password = generate_password_hash(password)
            cursor.execute("""
                INSERT INTO users (username, password, clearance_level, name, email)
                VALUES (%s, %s, %s, %s, %s)
            """, (username, hashed_password, clearance, name, email))
        
        print("Utilisateurs par défaut créés avec succès")
    
    def get_user_by_username(self, username: str) -> Optional[Dict]:
        """Récupérer un utilisateur par nom d'utilisateur"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("""
                SELECT id, username, password, clearance_level, name, email, is_active, 
                       created_at, updated_at
                FROM users 
                WHERE username = %s AND is_active = TRUE
            """, (username,))
            
            user = cursor.fetchone()
            cursor.close()
            
            return dict(user) if user else None
            
        except Exception as e:
            print(f"Erreur lors de la récupération de l'utilisateur: {e}")
            return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """Récupérer un utilisateur par ID"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("""
                SELECT id, username, clearance_level, name, email, is_active, 
                       created_at, updated_at
                FROM users 
                WHERE id = %s AND is_active = TRUE
            """, (user_id,))
            
            user = cursor.fetchone()
            cursor.close()
            
            return dict(user) if user else None
            
        except Exception as e:
            print(f"Erreur lors de la récupération de l'utilisateur: {e}")
            return None
    
    def get_all_users(self) -> List[Dict]:
        """Récupérer tous les utilisateurs"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("""
                SELECT id, username, clearance_level, name, email, is_active, 
                       created_at, updated_at
                FROM users 
                WHERE is_active = TRUE
                ORDER BY created_at DESC
            """)
            
            users = cursor.fetchall()
            cursor.close()
            
            return [dict(user) for user in users]
            
        except Exception as e:
            print(f"Erreur lors de la récupération des utilisateurs: {e}")
            return []
    
    def create_user(self, username: str, password: str, clearance_level: int, 
                   name: str, email: str) -> Optional[Dict]:
        """Créer un nouvel utilisateur"""
        try:
            cursor = self.connection.cursor()
            
            # Vérifier si l'utilisateur existe déjà
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                cursor.close()
                return None  # L'utilisateur existe déjà
            
            # Hacher le mot de passe
            hashed_password = generate_password_hash(password)
            
            # Insérer le nouvel utilisateur
            cursor.execute("""
                INSERT INTO users (username, password, clearance_level, name, email)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, username, clearance_level, name, email, is_active, 
                          created_at, updated_at
            """, (username, hashed_password, clearance_level, name, email))
            
            user = cursor.fetchone()
            cursor.close()
            
            return dict(user) if user else None
            
        except Exception as e:
            print(f"Erreur lors de la création de l'utilisateur: {e}")
            return None
    
    def update_user(self, user_id: int, username: str = None, clearance_level: int = None,
                   name: str = None, email: str = None, is_active: bool = None) -> Optional[Dict]:
        """Mettre à jour un utilisateur"""
        try:
            cursor = self.connection.cursor()
            
            # Construire la requête de mise à jour dynamiquement
            update_fields = []
            values = []
            
            if username is not None:
                update_fields.append("username = %s")
                values.append(username)
            if clearance_level is not None:
                update_fields.append("clearance_level = %s")
                values.append(clearance_level)
            if name is not None:
                update_fields.append("name = %s")
                values.append(name)
            if email is not None:
                update_fields.append("email = %s")
                values.append(email)
            if is_active is not None:
                update_fields.append("is_active = %s")
                values.append(is_active)
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(user_id)
            
            query = f"""
                UPDATE users 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING id, username, clearance_level, name, email, is_active, 
                          created_at, updated_at
            """
            
            cursor.execute(query, values)
            user = cursor.fetchone()
            cursor.close()
            
            return dict(user) if user else None
            
        except Exception as e:
            print(f"Erreur lors de la mise à jour de l'utilisateur: {e}")
            return None
    
    def delete_user(self, user_id: int) -> bool:
        """Supprimer un utilisateur (suppression logique)"""
        try:
            cursor = self.connection.cursor()
            cursor.execute("""
                UPDATE users 
                SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (user_id,))
            
            cursor.close()
            return True
            
        except Exception as e:
            print(f"Erreur lors de la suppression de l'utilisateur: {e}")
            return False
    
    def verify_password(self, username: str, password: str) -> Optional[Dict]:
        """Vérifier le mot de passe d'un utilisateur"""
        user = self.get_user_by_username(username)
        if user and check_password_hash(user['password'], password):
            # Retourner les données utilisateur sans le mot de passe
            return {
                'id': user['id'],
                'username': user['username'],
                'clearance_level': user['clearance_level'],
                'name': user['name'],
                'email': user['email']
            }
        return None
    
    def update_password(self, user_id: int, new_password: str) -> bool:
        """Mettre à jour le mot de passe d'un utilisateur"""
        try:
            cursor = self.connection.cursor()
            hashed_password = generate_password_hash(new_password)
            
            cursor.execute("""
                UPDATE users 
                SET password = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (hashed_password, user_id))
            
            cursor.close()
            return True
            
        except Exception as e:
            print(f"Erreur lors de la mise à jour du mot de passe: {e}")
            return False

    def generate_test_data(self) -> Dict:
        """Générer des données de test pour le système"""
        try:
            cursor = self.connection.cursor()
            
            # Supprimer les données existantes (sauf users)
            cursor.execute("DELETE FROM threat_scores")
            cursor.execute("DELETE FROM alerts")
            cursor.execute("DELETE FROM actions")
            cursor.execute("DELETE FROM threats")
            cursor.execute("DELETE FROM scenarios")
            cursor.execute("DELETE FROM prescriptions")
            cursor.execute("DELETE FROM data_sources")
            
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
                cursor.execute("""
                    INSERT INTO data_sources (name, type, url, status, last_ingested, throughput)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
                """, (name, type_, url, status, last_ingested, throughput))
                source_ids.append(cursor.fetchone()['id'])
            
            # Insérer des menaces de test
            threats = [
                ('Activité réseau suspecte', 'Tentative d\'intrusion détectée sur infrastructure critique', 0.85, 'high', 'active', source_ids[0], '{"ip": "192.168.1.100", "port": 22, "protocol": "ssh"}'),
                ('Détection de malware', 'Logiciel malveillant identifié dans les communications', 0.92, 'critical', 'active', source_ids[1], '{"hash": "a1b2c3d4", "type": "trojan", "family": "APT29"}'),
                ('Tentative d\'accès non autorisé', 'Multiples tentatives de connexion échouées', 0.67, 'medium', 'resolved', source_ids[2], '{"user": "admin", "attempts": 15, "source_ip": "203.0.113.0"}'),
                ('Communication chiffrée anormale', 'Trafic chiffré inhabituel détecté', 0.78, 'high', 'active', source_ids[3], '{"encryption": "AES-256", "frequency": "high", "destination": "unknown"}'),
                ('Exfiltration de données suspectée', 'Volume de données sortant anormalement élevé', 0.89, 'critical', 'active', source_ids[4], '{"size": "2.5GB", "destination": "external", "protocol": "https"}'),
                ('Mouvement de personnel suspect', 'Mouvement inhabituel détecté par imagerie satellite', 0.73, 'medium', 'active', source_ids[5], '{"location": "45.123,-73.456", "vehicles": 12, "personnel": 45}'),
                ('Alerte système legacy', 'Alerte générée par système hérité', 0.45, 'low', 'archived', source_ids[6], '{"system": "legacy", "alert_type": "maintenance"}'),
                ('Panne de communication', 'Interruption des communications d\'urgence', 0.95, 'critical', 'active', source_ids[7], '{"duration": "2h30m", "affected_units": 23, "cause": "unknown"}')
            ]
            
            threat_ids = []
            for name, desc, score, severity, status, source_id, metadata in threats:
                cursor.execute("""
                    INSERT INTO threats (name, description, score, severity, status, source_id, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb) RETURNING id
                """, (name, desc, score, severity, status, source_id, metadata))
                threat_ids.append(cursor.fetchone()['id'])
            
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
                cursor.execute("""
                    INSERT INTO scenarios (name, description, conditions, actions, status, priority, validity_window)
                    VALUES (%s, %s, %s::jsonb, %s::jsonb, %s, %s, %s) RETURNING id
                """, (name, desc, conditions, actions, status, priority, validity))
                scenario_ids.append(cursor.fetchone()['id'])
            
            # Insérer des actions de test
            actions = [
                ('sigint', 'Collection SIGINT intensifiée sur réseau cible', 'P1', 'in_progress', threat_ids[0], scenario_ids[0], '{"target": "network_alpha", "duration": "72h"}'),
                ('humint', 'Activation d\'agent sur terrain Mali', 'P2', 'pending', threat_ids[1], scenario_ids[1], '{"agent_id": "H001", "location": "mali"}'),
                ('collection', 'Surveillance renforcée communications', 'P1', 'completed', threat_ids[2], scenario_ids[0], '{"channels": ["radio", "satellite"], "priority": "high"}'),
                ('alert', 'Alerte diffusée aux unités terrain', 'P3', 'completed', threat_ids[3], None, '{"units": ["alpha", "bravo"], "message": "threat_detected"}'),
                ('imint', 'Analyse imagerie satellite zone sensible', 'P2', 'in_progress', threat_ids[4], scenario_ids[1], '{"coordinates": "45.123,-73.456", "resolution": "0.5m"}'),
                ('investigation', 'Enquête approfondie sur exfiltration', 'P1', 'pending', threat_ids[5], None, '{"lead_investigator": "I002", "estimated_duration": "48h"}')
            ]
            
            for type_, desc, priority, status, threat_id, scenario_id, metadata in actions:
                cursor.execute("""
                    INSERT INTO actions (type, description, priority, status, related_threat_id, related_scenario_id, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb)
                """, (type_, desc, priority, status, threat_id, scenario_id, metadata))
            
            # Insérer des alertes de test
            alerts = [
                ('threat', 'critical', 'Menace critique détectée', 'La menace "Détection de malware" a atteint un niveau critique (0.92)', False, threat_ids[1]),
                ('threat', 'warning', 'Nouvelle menace identifiée', 'Une nouvelle menace a été détectée: "Activité réseau suspecte"', False, threat_ids[0]),
                ('system', 'error', 'Erreur de source de données', 'La source "Emergency Feed Kappa" ne répond plus', True, None),
                ('data', 'info', 'Ingestion de données complétée', 'Ingestion réussie de 1,250 enregistrements depuis SIGINT Alpha', True, None),
                ('threat', 'warning', 'Évolution de menace', 'Le score de menace "Communication chiffrée anormale" a augmenté', False, threat_ids[3])
            ]
            
            for type_, severity, title, message, is_read, threat_id in alerts:
                cursor.execute("""
                    INSERT INTO alerts (type, severity, title, message, is_read, related_threat_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (type_, severity, title, message, is_read, threat_id))
            
            # Insérer des prescriptions de test
            prescriptions = [
                ('threat_001', 'P1', 'Incident Response', '2-4 heures', 0.92, 
                 '[{"id": "action_001", "type": "containment", "description": "Isoler les systèmes compromis"}, {"id": "action_002", "type": "investigation", "description": "Analyser les logs de sécurité"}]',
                 '["Équipe SOC", "Analystes malware", "Équipe réseau"]', 'active'),
                ('threat_002', 'P2', 'Security Monitoring', '1-2 heures', 0.85,
                 '[{"id": "action_003", "type": "monitoring", "description": "Renforcer la surveillance réseau"}, {"id": "action_004", "type": "alerting", "description": "Configurer alertes temps réel"}]',
                 '["Équipe monitoring", "Administrateurs réseau"]', 'active'),
                ('threat_003', 'P3', 'Investigation', '4-6 heures', 0.78,
                 '[{"id": "action_005", "type": "forensics", "description": "Analyse forensique des artefacts"}, {"id": "action_006", "type": "reporting", "description": "Rédiger rapport d\'incident"}]',
                 '["Équipe forensique", "Analystes threat intel"]', 'completed')
            ]
            
            for threat_id, priority, category, time_est, confidence, actions, resources, status in prescriptions:
                cursor.execute("""
                    INSERT INTO prescriptions (threat_id, priority, category, time_estimate, confidence, actions, resources, status)
                    VALUES (%s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s)
                """, (threat_id, priority, category, time_est, confidence, actions, resources, status))
            
            cursor.close()
            
            # Compter les enregistrements créés
            cursor = self.connection.cursor()
            counts = {}
            for table in ['data_sources', 'threats', 'scenarios', 'actions', 'alerts', 'prescriptions']:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                counts[table] = cursor.fetchone()['count']
            cursor.close()
            
            return {
                'success': True,
                'message': 'Données de test générées avec succès',
                'counts': counts
            }
            
        except Exception as e:
            print(f"Erreur lors de la génération des données de test: {e}")
            return {
                'success': False,
                'message': f'Erreur lors de la génération: {str(e)}'
            }

    def clear_test_data(self) -> Dict:
        """Supprimer toutes les données de test (sauf utilisateurs)"""
        try:
            cursor = self.connection.cursor()
            
            # Supprimer dans l'ordre inverse des dépendances
            cursor.execute("DELETE FROM threat_scores")
            cursor.execute("DELETE FROM alerts")
            cursor.execute("DELETE FROM actions")
            cursor.execute("DELETE FROM prescriptions")
            cursor.execute("DELETE FROM threats")
            cursor.execute("DELETE FROM scenarios")
            cursor.execute("DELETE FROM data_sources")
            
            cursor.close()
            
            return {
                'success': True,
                'message': 'Toutes les données de test ont été supprimées avec succès'
            }
            
        except Exception as e:
            print(f"Erreur lors de la suppression des données de test: {e}")
            return {
                'success': False,
                'message': f'Erreur lors de la suppression: {str(e)}'
            }

    def get_database_stats(self) -> Dict:
        """Obtenir les statistiques de la base de données"""
        try:
            cursor = self.connection.cursor()
            stats = {}
            
            tables = ['users', 'data_sources', 'threats', 'scenarios', 'actions', 'alerts', 'prescriptions', 'threat_scores']
            
            for table in tables:
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                stats[table] = cursor.fetchone()['count']
            
            cursor.close()
            return stats
            
        except Exception as e:
            print(f"Erreur lors de l'obtention des statistiques: {e}")
            return {}

# Instance globale de la base de données
db = Database()