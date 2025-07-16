# Structure du Projet - Système d'Analyse d'Intelligence

## Structure Nettoyée (Version 2.3.0)

```
├── client/                          # Frontend React/TypeScript
│   ├── src/
│   │   ├── components/             # Composants React réutilisables
│   │   ├── pages/                  # Pages de l'application
│   │   ├── hooks/                  # Hooks personnalisés
│   │   └── lib/                    # Utilitaires frontend
│   └── index.html
│
├── server/                          # Backend Python/Flask
│   ├── main_optimized.py          # Point d'entrée principal
│   ├── simple_flask_app.py        # Application Flask optimisée
│   ├── optimized_database.py      # Base de données avec pool de connexions
│   ├── cache_manager.py           # Gestionnaire de cache Redis
│   ├── performance_monitor.py     # Monitoring des performances
│   ├── config.py                  # Configuration système
│   │
│   ├── models/                     # Modèles de données
│   │   ├── threat_model.py
│   │   └── deep_learning_models.py
│   │
│   ├── services/                   # Services métier
│   │   ├── threat_service.py
│   │   ├── prescription_service.py
│   │   ├── document_clustering_service.py
│   │   ├── threat_evaluation_service.py
│   │   ├── deep_learning_service.py
│   │   └── data_ingestion.py
│   │
│   ├── routes/                     # Routes API
│   │   ├── deep_learning_routes.py
│   │   └── similarity_routes.py
│   │
│   ├── uploads/                    # Fichiers temporaires
│   └── requirements.txt            # Dependencies Python
│
├── shared/                         # Types et schémas partagés
│   └── schema.ts
│
├── documentation/                  # Documentation technique
│   ├── README.md                  # Documentation principale
│   ├── GUIDE_UTILISATION_v2.3.md # Guide utilisateur
│   ├── CHANGELOG_v2.3.md         # Historique des versions
│   └── SYNTHESE_COMPLETE_v2.3.md # Synthèse technique
│
└── configuration/                  # Fichiers de configuration
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    └── tsconfig.json
```

## Fichiers Supprimés (Nettoyage)

### Backend
- `server/simple_flask_app_broken.py` - Version cassée
- `server/simple_flask_app_original.py` - Version originale obsolète
- `server/flask_app.py` - Version non optimisée
- `server/minimal_flask.py` - Version simplifiée obsolète
- `server/test_db.py` - Tests obsolètes
- `server/flask_debug.log` - Logs de débogage

### Documentation Obsolète
- `README_OLD.md` - Ancienne documentation
- `CHANGELOG_v2.2.md` - Ancien changelog
- `README_v2.2.md` - Ancienne version
- `SYNTHESE_COMPLETE_v2.2.md` - Ancienne synthèse

### Fichiers Temporaires
- `test_flask.py` - Tests temporaires
- `test_file.txt` - Fichier de test
- `test_report.pdf` - Rapport de test
- `uploads/` - Dossier d'uploads temporaires
- `attached_assets/` - Assets attachés temporaires

### Cache et Build
- `server/__pycache__/` - Cache Python
- `server/**/*.pyc` - Fichiers Python compilés

## Services Actifs

### Core Services
- **main_optimized.py** - Point d'entrée principal
- **simple_flask_app.py** - Application Flask optimisée
- **optimized_database.py** - Base de données avec pool de connexions
- **cache_manager.py** - Gestionnaire de cache Redis
- **performance_monitor.py** - Monitoring temps réel

### Services Métier
- **threat_evaluation_service.py** - Réévaluation automatique des menaces
- **document_clustering_service.py** - Clustering de documents
- **prescription_service.py** - Génération de prescriptions
- **deep_learning_service.py** - Services d'IA avancée
- **data_ingestion.py** - Ingestion de données

## État du Système

✅ **Code source nettoyé et optimisé**
✅ **Structure projet reorganisée**
✅ **Fichiers obsolètes supprimés**
✅ **Services actifs documentés**
✅ **Dependencies mises à jour**
✅ **Performance monitoring actif**
✅ **Cache system optimisé**
✅ **Database connection pooling**