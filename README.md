# Intelligence Analysis System

## Overview

A comprehensive intelligence analysis system for threat detection, assessment, and prediction. Built with modern web technologies and advanced machine learning capabilities.

**Version 2.3.0** - Code source nettoyé et optimisé

## Features

### Core Capabilities
- **Real-time Threat Detection**: Scoring automatique et classification des menaces
- **Advanced Data Ingestion**: Pipeline d'ingestion complet avec support multi-formats
- **Machine Learning Analytics**: Modèles ML avancés avec PyTorch et scikit-learn
- **Interactive Dashboard**: Interface sombre optimisée pour les opérations 24/7
- **Role-based Access Control**: Système de clearance et authentification sécurisée
- **Automated Scenario Management**: Gestion automatique des scénarios de sécurité

### Advanced Features (v2.3.0)
- **Threat Evaluation System**: Réévaluation automatique des menaces basée sur le clustering
- **Performance Optimization**: Cache Redis, pool de connexions DB, monitoring temps réel
- **Document Clustering**: Analyse de TOUS les documents avec clustering intelligent
- **Predictive Analytics**: Détection de signaux faibles et forts avec validation humaine
- **Prescription Engine**: Génération automatique de recommandations de sécurité

## Technology Stack

### Frontend
- **React 18** avec TypeScript pour la robustesse
- **Tailwind CSS** avec thème sombre personnalisé
- **Vite** pour le développement et la production
- **Radix UI** pour les composants accessibles
- **TanStack Query** pour la gestion d'état serveur

### Backend
- **Python Flask** avec optimisations de performance
- **PostgreSQL** avec pool de connexions optimisé
- **Redis** pour le cache et sessions
- **PyTorch** pour les modèles de deep learning
- **scikit-learn** pour l'analyse prédictive

### Infrastructure
- **Cache Manager**: Système de cache multi-niveaux avec TTL
- **Performance Monitor**: Monitoring temps réel CPU, mémoire, latence
- **Optimized Database**: Pool de connexions avec 10 connexions concurrentes
- **Threat Evaluation**: Service de réévaluation automatique des menaces

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   pip install -r server/requirements.txt
   ```

2. **Set Environment Variables**
   ```bash
   DATABASE_URL=postgresql://localhost/intelligence_db
   SECRET_KEY=your-secret-key
   ```

3. **Run the Application**
   ```bash
   npm run dev
   ```

4. **Access the System**
   - Frontend: http://localhost:5000
   - Backend API: http://localhost:8000

## Project Structure (Nettoyée)

```
├── client/                          # Frontend React/TypeScript
│   ├── src/
│   │   ├── components/             # Composants réutilisables
│   │   ├── pages/                  # Pages de l'application
│   │   └── hooks/                  # Hooks personnalisés
│   └── index.html
│
├── server/                          # Backend Python/Flask
│   ├── main_optimized.py          # Point d'entrée principal
│   ├── simple_flask_app.py        # Application Flask optimisée
│   ├── optimized_database.py      # Base de données avec pool
│   ├── cache_manager.py           # Gestionnaire de cache Redis
│   ├── performance_monitor.py     # Monitoring performances
│   ├── services/                   # Services métier
│   └── requirements.txt            # Dependencies Python
│
├── shared/                         # Types et schémas partagés
├── documentation/                  # Documentation technique
└── STRUCTURE_PROJET.md            # Documentation de la structure
```

## Version History

- **v2.3.0** - Code source nettoyé, optimisations de performance, système de réévaluation
- **v2.2.0** - Architecture propre, suppression des données hardcodées
- **v2.1.0** - Intégration ML avancée, deep learning
- **v2.0.0** - Réécriture complète du système

## Performance Metrics

- **Response Time**: < 100ms pour les opérations critiques
- **Database**: Pool de 10 connexions avec requêtes optimisées
- **Cache**: Système Redis avec TTL et invalidation intelligente
- **Monitoring**: Métriques temps réel CPU, mémoire, latence

## System Status

✅ **Code source nettoyé et optimisé**
✅ **Performance système maximisée**
✅ **Système de réévaluation automatique**
✅ **Cache multi-niveaux actif**
✅ **Monitoring temps réel opérationnel**
✅ **Base de données optimisée**

## Contributing

Référez-vous au dossier `documentation/` pour les spécifications techniques détaillées et les guidelines de contribution.