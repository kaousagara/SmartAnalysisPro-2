#!/usr/bin/env python3
"""
Test complet du système LAKANA ANALYSIS
Tests de toutes les fonctionnalités
"""

import requests
import json
import time
import sys
from datetime import datetime

BASE_URL = 'http://localhost:5000'
FLASK_URL = 'http://localhost:8000'

class TestLakanaSystem:
    def __init__(self):
        self.token = None
        self.headers = {}
        self.results = {
            'passed': 0,
            'failed': 0,
            'errors': []
        }
    
    def login(self, username='admin', password='admin123'):
        """Test de connexion"""
        print("\n1. TEST DE CONNEXION")
        try:
            resp = requests.post(f'{FLASK_URL}/api/auth/login', 
                               json={'username': username, 'password': password})
            if resp.status_code == 200:
                data = resp.json()
                self.token = data.get('token')
                self.headers = {'Authorization': f'Bearer {self.token}'}
                print(f"✓ Connexion réussie - User: {username}")
                self.results['passed'] += 1
                return True
            else:
                print(f"❌ Échec connexion: {resp.status_code}")
                self.results['failed'] += 1
                self.results['errors'].append(f"Login failed: {resp.text}")
                return False
        except Exception as e:
            print(f"❌ Exception connexion: {e}")
            self.results['failed'] += 1
            self.results['errors'].append(f"Login exception: {str(e)}")
            return False
    
    def test_endpoints(self):
        """Test de tous les endpoints API"""
        print("\n2. TEST DES ENDPOINTS API")
        
        endpoints = [
            # Endpoints principaux
            ('/api/health', 'GET', 'Health Check', False),
            ('/api/dashboard/stats', 'GET', 'Dashboard Stats', True),
            ('/api/threats/evolution?filter=24H', 'GET', 'Threat Evolution', True),
            ('/api/prescriptions', 'GET', 'Prescriptions List', True),
            ('/api/prescriptions/statistics', 'GET', 'Prescription Stats', True),
            ('/api/scenarios', 'GET', 'Scenarios', True),
            ('/api/actions', 'GET', 'Actions', True),
            ('/api/alerts', 'GET', 'Alerts', True),
            ('/api/ingestion/status', 'GET', 'Ingestion Status', True),
            ('/api/system/performance', 'GET', 'System Performance', True),
            ('/api/analysis/clustering', 'GET', 'Clustering Analysis', True),
            # Endpoints qui peuvent ne pas exister
            ('/api/threats', 'GET', 'Threats List', True),
            ('/api/predictions', 'GET', 'Predictions', True),
        ]
        
        for endpoint, method, name, auth_required in endpoints:
            try:
                headers = self.headers if auth_required else {}
                
                if method == 'GET':
                    resp = requests.get(f'{BASE_URL}{endpoint}', headers=headers)
                
                if resp.status_code == 200:
                    print(f"✓ {name}: OK")
                    self.results['passed'] += 1
                    
                    # Vérifier la structure des données
                    if resp.headers.get('content-type', '').startswith('application/json'):
                        data = resp.json()
                        if isinstance(data, dict):
                            keys = list(data.keys())[:3]
                            print(f"   Données: {keys}")
                elif resp.status_code == 404:
                    print(f"⚠️  {name}: Endpoint non trouvé")
                    # Ne pas compter comme échec si c'est un endpoint optionnel
                else:
                    print(f"❌ {name}: {resp.status_code}")
                    self.results['failed'] += 1
                    self.results['errors'].append(f"{name}: {resp.status_code} - {resp.text[:100]}")
                    
            except Exception as e:
                print(f"❌ {name}: Exception - {e}")
                self.results['failed'] += 1
                self.results['errors'].append(f"{name}: Exception - {str(e)}")
    
    def test_file_upload(self):
        """Test d'upload de fichier"""
        print("\n3. TEST D'UPLOAD DE FICHIER")
        
        test_docs = [
            {
                'filename': 'threat_report.json',
                'content': json.dumps({
                    'title': 'Rapport de Menace Critique',
                    'content': 'Détection d\'une intrusion malware avec attack sophistiquée. Vulnerability critique dans le système. Urgent: breach détecté.',
                    'source': 'security_intelligence_team',
                    'metadata': {'severity': 'critical', 'region': 'EU'}
                })
            },
            {
                'filename': 'intel_brief.txt',
                'content': 'Intelligence Brief: Potential threat identified in sector 7. Risk assessment ongoing.'
            }
        ]
        
        for doc in test_docs:
            try:
                # Créer le fichier temporaire
                with open(f'/tmp/{doc["filename"]}', 'w') as f:
                    f.write(doc['content'])
                
                # Upload
                with open(f'/tmp/{doc["filename"]}', 'rb') as f:
                    files = {'file': (doc['filename'], f)}
                    resp = requests.post(f'{BASE_URL}/api/ingestion/upload', 
                                       files=files, headers=self.headers)
                
                if resp.status_code == 200:
                    data = resp.json()
                    document = data.get('document', {})
                    print(f"✓ Upload {doc['filename']}: OK")
                    print(f"   - ID: {document.get('id')}")
                    print(f"   - Score: {document.get('threat_score')}")
                    print(f"   - Niveau: {document.get('threat_level')}")
                    self.results['passed'] += 1
                else:
                    print(f"❌ Upload {doc['filename']}: {resp.status_code}")
                    self.results['failed'] += 1
                    self.results['errors'].append(f"Upload {doc['filename']}: {resp.text[:100]}")
                    
            except Exception as e:
                print(f"❌ Upload {doc['filename']}: Exception - {e}")
                self.results['failed'] += 1
                self.results['errors'].append(f"Upload exception: {str(e)}")
    
    def test_data_ingestion(self):
        """Test d'ingestion de données"""
        print("\n4. TEST D'INGESTION DE DONNÉES")
        
        ingestion_data = {
            'type': 'document',
            'data': {
                'items': [
                    {
                        'title': 'Test Ingestion 1',
                        'content': 'Document test avec threat et attack keywords',
                        'source': 'test_system'
                    },
                    {
                        'title': 'Test Ingestion 2',
                        'content': 'Another document with vulnerability and risk',
                        'source': 'automated_test'
                    }
                ]
            }
        }
        
        try:
            resp = requests.post(f'{BASE_URL}/api/ingestion', 
                               json=ingestion_data, headers=self.headers)
            
            if resp.status_code == 200:
                data = resp.json()
                print(f"✓ Ingestion de données: OK")
                print(f"   - Documents traités: {data.get('processed_count', 0)}")
                self.results['passed'] += 1
            else:
                print(f"❌ Ingestion: {resp.status_code}")
                self.results['failed'] += 1
                self.results['errors'].append(f"Ingestion: {resp.text[:100]}")
                
        except Exception as e:
            print(f"❌ Ingestion: Exception - {e}")
            self.results['failed'] += 1
            self.results['errors'].append(f"Ingestion exception: {str(e)}")
    
    def test_frontend_access(self):
        """Test d'accès au frontend"""
        print("\n5. TEST DU FRONTEND")
        
        try:
            resp = requests.get(BASE_URL)
            if resp.status_code == 200:
                if '<div id="root">' in resp.text:
                    print("✓ Frontend React accessible")
                    self.results['passed'] += 1
                    
                    # Vérifier les assets
                    if 'LAKANA ANALYSIS' in resp.text or 'lakana' in resp.text.lower():
                        print("✓ Branding LAKANA ANALYSIS présent")
                        self.results['passed'] += 1
                    else:
                        print("⚠️  Branding LAKANA ANALYSIS non détecté")
                else:
                    print("❌ Frontend React non trouvé")
                    self.results['failed'] += 1
            else:
                print(f"❌ Accès frontend: {resp.status_code}")
                self.results['failed'] += 1
                
        except Exception as e:
            print(f"❌ Frontend: Exception - {e}")
            self.results['failed'] += 1
            self.results['errors'].append(f"Frontend exception: {str(e)}")
    
    def test_authentication_flow(self):
        """Test du flux d'authentification complet"""
        print("\n6. TEST DU FLUX D'AUTHENTIFICATION")
        
        # Test avec différents utilisateurs
        users = [
            ('admin', 'admin123', True),
            ('analyst', 'analyst123', True),
            ('operator', 'operator123', True),
            ('invalid', 'wrongpass', False)
        ]
        
        for username, password, should_succeed in users:
            try:
                resp = requests.post(f'{FLASK_URL}/api/auth/login', 
                                   json={'username': username, 'password': password})
                
                if should_succeed:
                    if resp.status_code == 200:
                        print(f"✓ Login {username}: OK")
                        self.results['passed'] += 1
                    else:
                        print(f"❌ Login {username}: Échec inattendu")
                        self.results['failed'] += 1
                else:
                    if resp.status_code != 200:
                        print(f"✓ Login {username}: Rejet correct")
                        self.results['passed'] += 1
                    else:
                        print(f"❌ Login {username}: Succès inattendu")
                        self.results['failed'] += 1
                        
            except Exception as e:
                print(f"❌ Auth {username}: Exception - {e}")
                self.results['failed'] += 1
    
    def run_all_tests(self):
        """Exécuter tous les tests"""
        print("="*60)
        print("TESTS COMPLETS SYSTÈME LAKANA ANALYSIS")
        print("="*60)
        print(f"Heure: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"URL Base: {BASE_URL}")
        print(f"URL Flask: {FLASK_URL}")
        
        # Connexion initiale
        if not self.login():
            print("\n❌ ARRÊT: Impossible de se connecter")
            return
        
        # Tests
        self.test_endpoints()
        self.test_file_upload()
        self.test_data_ingestion()
        self.test_frontend_access()
        self.test_authentication_flow()
        
        # Résumé
        print("\n" + "="*60)
        print("RÉSUMÉ DES TESTS")
        print("="*60)
        print(f"✓ Tests réussis: {self.results['passed']}")
        print(f"❌ Tests échoués: {self.results['failed']}")
        print(f"📊 Taux de succès: {self.results['passed']/(self.results['passed']+self.results['failed'])*100:.1f}%")
        
        if self.results['errors']:
            print("\nERREURS DÉTECTÉES:")
            for i, error in enumerate(self.results['errors'], 1):
                print(f"{i}. {error}")
        
        print("\n" + "="*60)
        
        # Code de sortie
        return 0 if self.results['failed'] == 0 else 1

if __name__ == '__main__':
    tester = TestLakanaSystem()
    sys.exit(tester.run_all_tests())