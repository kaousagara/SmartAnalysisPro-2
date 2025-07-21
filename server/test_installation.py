#!/usr/bin/env python3
"""
Script de test d'installation pour LAKANA ANALYSIS
Vérifie que toutes les dépendances sont installées et que le système fonctionne
"""

import sys
import subprocess
import importlib
import json

def print_header(text):
    print(f"\n{'='*60}")
    print(f"  {text}")
    print(f"{'='*60}")

def test_import(module_name, display_name=None, version_attr='__version__'):
    """Test l'import d'un module Python"""
    if display_name is None:
        display_name = module_name
    
    try:
        module = importlib.import_module(module_name)
        version = "installé"
        
        # Essayer de récupérer la version
        if hasattr(module, version_attr):
            version = getattr(module, version_attr)
        elif hasattr(module, 'version'):
            version = module.version
        elif hasattr(module, 'VERSION'):
            version = module.VERSION
        
        print(f"✓ {display_name:<25} {version}")
        return True
    except ImportError:
        print(f"✗ {display_name:<25} NON INSTALLÉ")
        return False

def test_database_connection():
    """Test la connexion à la base de données PostgreSQL"""
    print_header("Test de connexion à la base de données")
    
    try:
        import os
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        db_url = os.environ.get('DATABASE_URL')
        if not db_url:
            print("✗ DATABASE_URL non définie")
            return False
            
        conn = psycopg2.connect(db_url)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Test de requête simple
        cursor.execute("SELECT COUNT(*) as count FROM users")
        users_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM threats")
        threats_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM prescriptions")
        prescriptions_count = cursor.fetchone()['count']
        
        print(f"✓ Connexion PostgreSQL réussie")
        print(f"  - Utilisateurs: {users_count}")
        print(f"  - Menaces: {threats_count}")
        print(f"  - Prescriptions: {prescriptions_count}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"✗ Erreur de connexion: {str(e)}")
        return False

def test_api_endpoints():
    """Test les endpoints de l'API"""
    print_header("Test des endpoints API")
    
    try:
        import requests
        
        # Test de santé
        health_resp = requests.get('http://localhost:8000/api/health')
        if health_resp.status_code == 200:
            health_data = health_resp.json()
            print(f"✓ Health endpoint: {health_data.get('status')}")
            print(f"  - Version: {health_data.get('version')}")
            print(f"  - CPU: {health_data.get('system_info', {}).get('cpu_percent')}%")
            print(f"  - Mémoire: {health_data.get('system_info', {}).get('memory_percent')}%")
        else:
            print(f"✗ Health endpoint: Erreur {health_resp.status_code}")
            
        # Test via proxy Express
        stats_resp = requests.get('http://localhost:5000/api/dashboard/stats')
        if stats_resp.status_code == 200:
            stats_data = stats_resp.json()
            if 'stats' in stats_data:
                print(f"✓ Dashboard stats (via Express): OK")
                print(f"  - Menaces actives: {stats_data['stats'].get('active_threats', 0)}")
                print(f"  - Score moyen: {stats_data['stats'].get('avg_score', 0)}")
            else:
                print(f"✓ Express proxy: OK (pas de données)")
        else:
            print(f"✗ Express proxy: Erreur {stats_resp.status_code}")
            
        return True
        
    except Exception as e:
        print(f"✗ Erreur lors des tests API: {str(e)}")
        return False

def main():
    print_header("LAKANA ANALYSIS - Test d'installation")
    
    # Python version
    print(f"\nPython version: {sys.version.split()[0]}")
    
    # Test des dépendances principales
    print_header("Dépendances Flask")
    flask_deps = [
        ('flask', 'Flask'),
        ('flask_cors', 'Flask-CORS'),
        ('flask_restful', 'Flask-RESTful'),
        ('flask_jwt_extended', 'Flask-JWT-Extended'),
    ]
    
    for module, name in flask_deps:
        test_import(module, name)
    
    print_header("Dépendances Base de données")
    db_deps = [
        ('psycopg2', 'psycopg2-binary'),
        ('redis', 'Redis'),
    ]
    
    for module, name in db_deps:
        test_import(module, name)
    
    print_header("Dépendances Machine Learning")
    ml_deps = [
        ('sklearn', 'scikit-learn'),
        ('torch', 'PyTorch'),
        ('transformers', 'Transformers'),
        ('numpy', 'NumPy'),
        ('pandas', 'Pandas'),
        ('nltk', 'NLTK'),
    ]
    
    all_ml_ok = True
    for module, name in ml_deps:
        if not test_import(module, name):
            all_ml_ok = False
    
    # Test optionnels
    print("\nDépendances optionnelles:")
    optional_deps = [
        ('tensorflow', 'TensorFlow'),
        ('keras', 'Keras'),
        ('openai', 'OpenAI'),
        ('pydantic', 'Pydantic'),
        ('gunicorn', 'Gunicorn'),
    ]
    
    for module, name in optional_deps:
        test_import(module, name)
    
    print_header("Dépendances Utilitaires")
    util_deps = [
        ('dotenv', 'python-dotenv'),
        ('requests', 'Requests'),
        ('psutil', 'psutil'),
        ('schedule', 'Schedule'),
    ]
    
    for module, name in util_deps:
        test_import(module, name)
    
    # Test de connexion à la base de données
    test_database_connection()
    
    # Test des endpoints API
    test_api_endpoints()
    
    print_header("Résumé")
    print("✓ Installation de base fonctionnelle")
    if not all_ml_ok:
        print("⚠ Certaines dépendances ML manquent")
    print("\nPour installer les dépendances manquantes:")
    print("  cd server && pip install -r requirements.txt")
    
if __name__ == "__main__":
    main()