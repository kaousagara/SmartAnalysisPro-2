#!/usr/bin/env python3
"""
Point d'entrée principal pour l'application d'analyse d'intelligence
Version 2.3.0 - Code source nettoyé et optimisé
"""

import os
import sys
import threading
import time
from datetime import datetime
from simple_flask_app import app
from optimized_database import optimized_db
from cache_manager import cache_manager
from performance_monitor import performance_monitor

def initialize_system():
    """Initialise tous les composants du système"""
    print("🚀 Démarrage de l'application optimisée...")
    
    # Démarrer le monitoring des performances
    performance_monitor.start_monitoring()
    print("📊 Monitoring des performances activé")
    
    # Initialiser la base de données optimisée
    optimized_db.init_tables()
    print("🗄️  Base de données optimisée configurée")
    
    # Initialiser le cache manager
    cache_manager.cleanup_expired()
    print("⚡ Cache manager initialisé")
    
    # Démarrer le nettoyage périodique du cache
    def cleanup_cache_periodically():
        while True:
            time.sleep(600)  # Nettoyer toutes les 10 minutes
            cache_manager.cleanup_expired()
    
    cache_thread = threading.Thread(target=cleanup_cache_periodically, daemon=True)
    cache_thread.start()
    
    print("✅ Système initialisé avec succès")

def main():
    """Point d'entrée principal"""
    try:
        # Initialiser le système
        initialize_system()
        
        # Démarrer l'application Flask
        port = int(os.environ.get('PORT', 8000))
        app.run(
            host='0.0.0.0',
            port=port,
            debug=True,
            threaded=True,
            use_reloader=False  # Éviter le double démarrage
        )
        
    except KeyboardInterrupt:
        print("\n🛑 Arrêt du système...")
        performance_monitor.stop_monitoring()
        sys.exit(0)
    except Exception as e:
        print(f"❌ Erreur lors du démarrage: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()