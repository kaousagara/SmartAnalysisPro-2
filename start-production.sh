#!/bin/bash

# Script de démarrage en production pour le système d'analyse d'intelligence

echo "🚀 Démarrage du système d'analyse d'intelligence en mode production..."

# Vérifier les variables d'environnement
if [ ! -f .env.production ]; then
    echo "❌ Erreur: Fichier .env.production introuvable!"
    echo "Veuillez copier .env.production.example et configurer vos variables."
    exit 1
fi

# Charger les variables d'environnement
export $(cat .env.production | grep -v '^#' | xargs)

# Vérifier la connexion à la base de données
echo "🔍 Vérification de la connexion à la base de données..."
python3 -c "
import psycopg2
import os
try:
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    print('✅ Connexion à la base de données réussie')
    conn.close()
except Exception as e:
    print(f'❌ Erreur de connexion à la base de données: {e}')
    exit(1)
"

# Construire le frontend
echo "🔨 Construction du frontend..."
npm run build

# Démarrer le serveur en production
echo "🌐 Démarrage du serveur en mode production..."

# Utiliser gunicorn pour Python et PM2 pour Node.js
if command -v gunicorn &> /dev/null; then
    # Démarrer Flask avec Gunicorn
    gunicorn -w 4 -b 0.0.0.0:8000 --timeout 120 --access-logfile - --error-logfile - server.simple_flask_app:app &
    FLASK_PID=$!
    echo "✅ Flask démarré avec Gunicorn (PID: $FLASK_PID)"
else
    echo "⚠️  Gunicorn non installé, utilisation du serveur de développement Flask"
    python3 server/main_optimized.py &
    FLASK_PID=$!
fi

# Démarrer le serveur Node.js
NODE_ENV=production node server/index.js &
NODE_PID=$!
echo "✅ Serveur Node.js démarré (PID: $NODE_PID)"

echo "✨ Système d'analyse d'intelligence démarré avec succès!"
echo "📍 Frontend: http://localhost:5000"
echo "📍 Backend API: http://localhost:8000"
echo ""
echo "Pour arrêter le système, utilisez: kill $FLASK_PID $NODE_PID"

# Garder le script en cours d'exécution
wait