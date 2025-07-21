#!/bin/bash
# Script d'installation des dépendances pour LAKANA ANALYSIS
# Version 2.3.0 - 21 Juillet 2025

echo "======================================"
echo "LAKANA ANALYSIS - Installation complète"
echo "======================================"

# Vérifier la version de Python
echo -e "\n📌 Vérification de Python..."
python --version

# Créer un environnement virtuel si nécessaire
if [ ! -d "venv" ]; then
    echo -e "\n📦 Création de l'environnement virtuel..."
    python -m venv venv
fi

# Activer l'environnement virtuel
echo -e "\n🔧 Activation de l'environnement virtuel..."
source venv/bin/activate 2>/dev/null || venv\Scripts\activate

# Mettre à jour pip
echo -e "\n📦 Mise à jour de pip..."
pip install --upgrade pip

# Installation des dépendances principales
echo -e "\n📦 Installation des dépendances principales..."

# Flask et extensions
echo "→ Installation de Flask et extensions..."
pip install Flask==2.3.3 Flask-CORS==4.0.0 Flask-RESTful==0.3.10 Flask-JWT-Extended==4.5.2

# Base de données
echo "→ Installation des dépendances base de données..."
pip install psycopg2-binary==2.9.7 psycopg2-pool==1.1 redis==4.6.0

# Sécurité
echo "→ Installation des dépendances sécurité..."
pip install Werkzeug==2.3.7 bcrypt==4.0.1

# Machine Learning de base
echo "→ Installation des dépendances ML de base..."
pip install scikit-learn==1.3.0 numpy==1.24.3 pandas==2.0.3 nltk==3.8.1

# PyTorch (version CPU pour éviter les conflits)
echo "→ Installation de PyTorch..."
pip install torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cpu

# Transformers et accelerate
echo "→ Installation de Transformers..."
pip install transformers==4.33.2 accelerate==0.21.0

# Utilitaires
echo "→ Installation des utilitaires..."
pip install python-dotenv==1.0.0 requests==2.31.0 schedule==1.2.0 psutil==5.9.5

# API et validation
echo "→ Installation des dépendances API..."
pip install openai==1.3.0 pydantic==2.1.1

# Dépendances optionnelles (avec gestion d'erreurs)
echo -e "\n📦 Installation des dépendances optionnelles..."

# TensorFlow et Keras
echo "→ Tentative d'installation de TensorFlow et Keras..."
pip install tensorflow==2.13.0 keras==2.13.1 2>/dev/null || {
    echo "  ⚠️  TensorFlow/Keras installation échouée (optionnel)"
}

# Gunicorn
echo "→ Installation de Gunicorn..."
pip install gunicorn==21.2.0 || {
    echo "  ⚠️  Gunicorn installation échouée (optionnel)"
}

# Télécharger les ressources NLTK nécessaires
echo -e "\n📚 Téléchargement des ressources NLTK..."
python -c "
import nltk
try:
    nltk.download('punkt', quiet=True)
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    print('✓ Ressources NLTK téléchargées')
except:
    print('⚠️  Erreur lors du téléchargement NLTK (non critique)')
"

# Vérification finale
echo -e "\n🔍 Vérification de l'installation..."
python test_installation.py

echo -e "\n✅ Installation terminée!"
echo "Pour activer l'environnement virtuel : source venv/bin/activate"
echo "Pour lancer l'application : python simple_flask_app.py"