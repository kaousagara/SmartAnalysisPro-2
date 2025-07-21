# LAKANA ANALYSIS - Guide d'Installation Complet

## Prérequis

### Version Python
- **Python 3.8+** (recommandé : Python 3.11)
- Vérifier avec : `python --version`

### Base de données
- PostgreSQL (fourni par Replit via DATABASE_URL)
- Redis (optionnel, pour le cache avancé)

## Installation Rapide

```bash
cd server
pip install -r requirements.txt
```

## Installation Complète avec Script

```bash
cd server
chmod +x install_dependencies.sh
./install_dependencies.sh
```

## Installation Manuelle Détaillée

### 1. Environnement virtuel (recommandé)

```bash
# Créer l'environnement virtuel
python -m venv venv

# Activer l'environnement
# Linux/macOS:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2. Dépendances Principales

#### Flask et extensions
```bash
pip install Flask==2.3.3 Flask-CORS==4.0.0 Flask-RESTful==0.3.10 Flask-JWT-Extended==4.5.2
```

#### Base de données
```bash
pip install psycopg2-binary==2.9.7 psycopg2-pool==1.1 redis==4.6.0
```

#### Sécurité
```bash
pip install Werkzeug==2.3.7 bcrypt==4.0.1
```

#### Machine Learning de base
```bash
pip install scikit-learn==1.3.0 numpy==1.24.3 pandas==2.0.3 nltk==3.8.1
```

#### PyTorch (choisir selon votre système)
```bash
# CPU uniquement (recommandé pour développement)
pip install torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cpu

# Avec CUDA 11.8 (pour GPU NVIDIA)
pip install torch==2.0.1 torchvision==0.15.2 --index-url https://download.pytorch.org/whl/cu118
```

#### Transformers et NLP
```bash
pip install transformers==4.33.2 accelerate==0.21.0
```

#### Utilitaires
```bash
pip install python-dotenv==1.0.0 requests==2.31.0 schedule==1.2.0 psutil==5.9.5
```

#### API et validation
```bash
pip install openai==1.3.0 pydantic==2.1.1
```

### 3. Dépendances Optionnelles

Ces dépendances ne sont pas essentielles au fonctionnement de base mais ajoutent des fonctionnalités supplémentaires :

#### TensorFlow et Keras (Deep Learning alternatif)
```bash
# Installation standard
pip install tensorflow==2.13.0 keras==2.13.1

# Si erreur de compatibilité, essayer :
pip install tensorflow-cpu==2.13.0 keras==2.13.1
```

**Note** : TensorFlow n'est pas nécessaire si vous utilisez déjà PyTorch. L'application fonctionne avec l'un ou l'autre.

#### Gunicorn (Serveur WSGI pour production)
```bash
pip install gunicorn==21.2.0
```

**Utilisation** : Pour lancer l'application en production
```bash
gunicorn -w 4 -b 0.0.0.0:8000 simple_flask_app:app
```

### 4. Configuration des ressources NLTK

Après l'installation, télécharger les ressources NLTK nécessaires :

```python
python -c "
import nltk
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('wordnet')
"
```

## Résolution des Problèmes

### Conflit de dépendances

Si vous rencontrez des conflits (notamment avec accelerate), essayez :

```bash
# Installation sans accelerate
pip install -r requirements.txt --no-deps
pip install accelerate --upgrade
```

### Erreur psycopg2

Si l'installation de psycopg2-binary échoue :

```bash
# Ubuntu/Debian
sudo apt-get install postgresql-dev python3-dev

# macOS
brew install postgresql

# Puis réessayer
pip install psycopg2-binary==2.9.7
```

### Problèmes de mémoire avec TensorFlow/PyTorch

Pour les systèmes avec peu de mémoire :

```bash
# Utiliser les versions CPU uniquement
pip install tensorflow-cpu==2.13.0
pip install torch==2.0.1+cpu torchvision==0.15.2+cpu -f https://download.pytorch.org/whl/torch_stable.html
```

## Vérification de l'Installation

### Script de test automatique

```bash
cd server
python test_installation.py
```

### Test manuel

```python
# Test des imports essentiels
python -c "
import flask
import psycopg2
import torch
import sklearn
import transformers
print('✓ Toutes les dépendances principales sont installées')
"
```

### Test de l'API

```bash
# Démarrer le serveur
python simple_flask_app.py

# Dans un autre terminal, tester la santé
curl http://localhost:8000/api/health
```

## Structure des Dépendances

### Essentielles (requis pour le fonctionnement)
- Flask et extensions : API REST
- psycopg2 : Connexion PostgreSQL
- PyTorch ou TensorFlow : Deep Learning
- scikit-learn : Machine Learning classique
- transformers : NLP et BERT

### Optionnelles (fonctionnalités supplémentaires)
- TensorFlow/Keras : Alternative à PyTorch
- Gunicorn : Déploiement production
- Redis : Cache avancé (utilise cache mémoire par défaut)

## Mode Production

Pour un déploiement en production :

1. Installer toutes les dépendances incluant Gunicorn
2. Utiliser le script de démarrage :
   ```bash
   ./start-production.sh
   ```

3. Ou manuellement :
   ```bash
   export FLASK_ENV=production
   gunicorn -w 4 -b 0.0.0.0:8000 --timeout 120 simple_flask_app:app
   ```

## Support

En cas de problème d'installation :

1. Vérifier les logs d'erreur complets
2. S'assurer que Python 3.8+ est utilisé
3. Vérifier la connectivité réseau pour télécharger les packages
4. Consulter le fichier README_DEPENDENCIES.md pour plus de détails

## Notes de Version

- **Version actuelle** : 2.3.0
- **Dernière mise à jour** : 21 Juillet 2025
- **Compatibilité testée** : Python 3.8 - 3.11