#!/usr/bin/env python3
"""Script de test pour initialiser la base de données"""

from database import db

def test_database():
    """Test de la base de données"""
    try:
        # Initialiser les tables
        db.init_tables()
        print("✓ Tables initialisées avec succès")
        
        # Générer des données de test
        result = db.generate_test_data()
        if result.get('success'):
            print("✓ Données de test générées avec succès")
            print(f"  - Comptes: {result['counts']}")
        else:
            print("✗ Erreur lors de la génération des données de test")
            print(f"  - Message: {result.get('message', 'Erreur inconnue')}")
            
        # Obtenir les statistiques
        stats = db.get_database_stats()
        print(f"✓ Statistiques de la base de données: {stats}")
        
    except Exception as e:
        print(f"✗ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_database()