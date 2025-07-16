"""
Générateur de données de test pour le système d'analyse d'intelligence
Version simple et robuste avec gestion des clés étrangères
"""
import psycopg2
from datetime import datetime
import json
import os

class TestDataGenerator:
    def __init__(self):
        self.db_url = os.getenv('DATABASE_URL', 'postgresql://localhost/intelligence_db')
        
    def get_connection(self):
        """Obtenir une connexion à la base de données"""
        return psycopg2.connect(self.db_url)
    
    def clear_test_data(self):
        """Supprimer toutes les données de test"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # Supprimer dans l'ordre des dépendances
            cursor.execute("DELETE FROM threat_scores")
            cursor.execute("DELETE FROM alerts")
            cursor.execute("DELETE FROM actions")
            cursor.execute("DELETE FROM threats")
            cursor.execute("DELETE FROM scenarios")
            cursor.execute("DELETE FROM data_sources")
            cursor.execute("DELETE FROM prescriptions")
            cursor.execute("DELETE FROM document_analysis")
            cursor.execute("DELETE FROM predictions")
            
            conn.commit()
            
    def generate_complete_test_data(self):
        """Générer un jeu complet de données de test"""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # 1. Créer les sources de données
            data_sources = [
                ('SIGINT Collection Alpha', 'sigint', 'https://sigint.intel.gov/feed', 'active', '2024-01-15 10:30:00', 1250.5),
                ('HUMINT Network Beta', 'humint', 'https://humint.intel.gov/reports', 'active', '2024-01-15 11:45:00', 850.3),
                ('OSINT Crawler Gamma', 'osint', 'https://osint.intel.gov/api', 'active', '2024-01-15 09:15:00', 2100.7),
                ('STIX/TAXII Feed Delta', 'stix', 'https://taxii.intel.gov/collections', 'active', '2024-01-15 08:20:00', 950.2),
                ('COMINT Intercept Epsilon', 'comint', 'https://comint.intel.gov/stream', 'active', '2024-01-15 12:10:00', 1750.8)
            ]
            
            source_ids = []
            for name, type_, url, status, last_ingested, throughput in data_sources:
                cursor.execute("""
                    INSERT INTO data_sources (name, type, url, status, last_ingested, throughput)
                    VALUES (%s, %s, %s, %s, %s, %s) RETURNING id
                """, (name, type_, url, status, last_ingested, throughput))
                source_ids.append(cursor.fetchone()[0])
            
            # 2. Créer les scénarios
            scenarios = [
                ('CYBER-INTRUSION-07', 'Détection d\'intrusion cybernétique', 
                 '[{"type": "network_anomaly", "threshold": 0.8}]',
                 '[{"type": "SIGINT_COLLECTION", "description": "Renforcer la surveillance réseau"}]',
                 'active', 1, 'P1H'),
                ('ATT-2024-MALI', 'Surveillance des menaces au Mali', 
                 '[{"type": "geographic_alert", "region": "mali"}]',
                 '[{"type": "HUMINT_COLLECTION", "description": "Déployer agents sur le terrain"}]',
                 'active', 2, 'P24H'),
                ('PHISHING-CAMPAIGN-DETECT', 'Détection de campagne de phishing',
                 '[{"type": "email_indicators", "value": "suspicious"}]',
                 '[{"type": "EMAIL_FILTERING", "description": "Activer le filtrage email"}]',
                 'partial', 3, 'P12H')
            ]
            
            scenario_ids = []
            for name, desc, conditions, actions, status, priority, validity in scenarios:
                cursor.execute("""
                    INSERT INTO scenarios (name, description, conditions, actions, status, priority, validity_window)
                    VALUES (%s, %s, %s::jsonb, %s::jsonb, %s, %s, %s) RETURNING id
                """, (name, desc, conditions, actions, status, priority, validity))
                scenario_ids.append(cursor.fetchone()[0])
            
            # 3. Créer les menaces
            threats = [
                ('Activité réseau suspecte', 'Tentative d\'intrusion détectée sur infrastructure critique', 0.85, 'high', 'active', source_ids[0], '{"ip": "192.168.1.100", "port": 22}'),
                ('Détection de malware', 'Logiciel malveillant identifié dans les communications', 0.92, 'critical', 'active', source_ids[1], '{"hash": "a1b2c3d4", "type": "trojan"}'),
                ('Tentative d\'accès non autorisé', 'Multiples tentatives de connexion échouées', 0.67, 'medium', 'resolved', source_ids[2], '{"user": "admin", "attempts": 15}'),
                ('Communication chiffrée anormale', 'Trafic chiffré inhabituel détecté', 0.78, 'high', 'active', source_ids[3], '{"encryption": "AES-256", "frequency": "high"}'),
                ('Exfiltration de données suspectée', 'Volume de données sortant anormalement élevé', 0.89, 'critical', 'active', source_ids[4], '{"size": "2.5GB", "destination": "external"}')
            ]
            
            threat_ids = []
            for name, desc, score, severity, status, source_id, metadata in threats:
                cursor.execute("""
                    INSERT INTO threats (name, description, score, severity, status, source_id, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb) RETURNING id
                """, (name, desc, score, severity, status, source_id, metadata))
                threat_ids.append(cursor.fetchone()[0])
            
            # 4. Créer les actions
            actions = [
                ('sigint', 'Collection SIGINT intensifiée sur réseau cible', 'P1', 'in_progress', threat_ids[0], scenario_ids[0], '{"target": "network_alpha"}'),
                ('humint', 'Activation d\'agent sur terrain Mali', 'P2', 'pending', threat_ids[1], scenario_ids[1], '{"agent_id": "H001"}'),
                ('collection', 'Surveillance renforcée communications', 'P1', 'completed', threat_ids[2], scenario_ids[0], '{"channels": ["radio", "satellite"]}'),
                ('alert', 'Alerte diffusée aux unités terrain', 'P3', 'completed', threat_ids[3], None, '{"units": ["alpha", "bravo"]}'),
                ('investigation', 'Enquête approfondie sur exfiltration', 'P1', 'pending', threat_ids[4], None, '{"lead_investigator": "I002"}')
            ]
            
            for type_, desc, priority, status, threat_id, scenario_id, metadata in actions:
                cursor.execute("""
                    INSERT INTO actions (type, description, priority, status, related_threat_id, related_scenario_id, metadata)
                    VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb)
                """, (type_, desc, priority, status, threat_id, scenario_id, metadata))
            
            # 5. Créer les alertes
            alerts = [
                ('threat', 'critical', 'Menace critique détectée', 'La menace "Détection de malware" a atteint un niveau critique (0.92)', False, threat_ids[1]),
                ('threat', 'warning', 'Nouvelle menace identifiée', 'Une nouvelle menace a été détectée: "Activité réseau suspecte"', False, threat_ids[0]),
                ('system', 'error', 'Erreur de source de données', 'Une source de données ne répond plus', True, None),
                ('data', 'info', 'Ingestion de données complétée', 'Ingestion réussie de 1,250 enregistrements', True, None),
                ('threat', 'warning', 'Évolution de menace', 'Le score de menace a augmenté', False, threat_ids[3])
            ]
            
            for type_, severity, title, message, is_read, threat_id in alerts:
                cursor.execute("""
                    INSERT INTO alerts (type, severity, title, message, is_read, related_threat_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (type_, severity, title, message, is_read, threat_id))
            
            conn.commit()
            
            return {
                'data_sources_created': len(source_ids),
                'scenarios_created': len(scenario_ids),
                'threats_created': len(threat_ids),
                'actions_created': len(actions),
                'alerts_created': len(alerts),
                'timestamp': datetime.now().isoformat()
            }

if __name__ == "__main__":
    generator = TestDataGenerator()
    generator.clear_test_data()
    result = generator.generate_complete_test_data()
    print(json.dumps(result, indent=2))