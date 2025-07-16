# Guide d'Installation - Système d'Analyse d'Intelligence

## Version 2.3.0 - Installation Complète

### Prérequis Système

#### Système d'exploitation
- **Linux** : Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **macOS** : 10.15+ (Catalina)
- **Windows** : Windows 10/11 avec WSL2

#### Outils requis
- **Node.js** : Version 20.x LTS
- **Python** : Version 3.11+
- **PostgreSQL** : Version 13+
- **Redis** : Version 6+
- **Git** : Version 2.25+

---

## Installation Rapide (Replit)

### Sur Replit (Recommandé)

Le projet est optimisé pour Replit avec configuration automatique :

```bash
# Le projet est déjà configuré
npm run dev
```

**Accès** : http://localhost:5000

**Comptes de test** :
- Admin : `admin / admin123`
- Analyste : `analyst / analyst123`
- Opérateur : `operator / operator123`

---

## Installation Locale Complète

### 1. Clonage du Projet

```bash
# Cloner le repository
git clone https://github.com/your-org/intelligence-analysis-system.git
cd intelligence-analysis-system

# Vérifier la structure
ls -la
```

### 2. Installation des Dependencies

#### Frontend (Node.js)
```bash
# Installation des packages npm
npm install

# Vérification
npm list --depth=0
```

#### Backend (Python)
```bash
# Création de l'environnement virtuel
python -m venv venv

# Activation
# Linux/macOS
source venv/bin/activate
# Windows
venv\Scripts\activate

# Installation des dependencies
pip install -r server/requirements.txt

# Vérification
pip list
```

### 3. Configuration des Services

#### PostgreSQL
```bash
# Installation PostgreSQL
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# CentOS/RHEL
sudo yum install postgresql-server postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Création de la base de données
sudo -u postgres psql
CREATE DATABASE intelligence_db;
CREATE USER intelligence_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE intelligence_db TO intelligence_user;
\q
```

#### Redis
```bash
# Installation Redis
# Ubuntu/Debian
sudo apt install redis-server

# CentOS/RHEL
sudo yum install redis

# macOS
brew install redis
brew services start redis

# Vérification
redis-cli ping
```

### 4. Configuration des Variables d'Environnement

```bash
# Création du fichier .env
touch .env

# Configuration
cat > .env << EOF
# Base de données
DATABASE_URL=postgresql://intelligence_user:your_password@localhost:5432/intelligence_db

# Sécurité
SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-this-too

# Cache Redis
REDIS_URL=redis://localhost:6379

# Logs
LOG_LEVEL=INFO

# Environnement
NODE_ENV=development
FLASK_ENV=development
EOF
```

### 5. Initialisation de la Base de Données

```bash
# Démarrage du serveur Python pour initialiser la DB
cd server
python main_optimized.py

# Ou utilisation du script d'initialisation
python -c "
from optimized_database import optimized_db
optimized_db.init_tables()
print('Database initialized successfully')
"
```

---

## Configuration Avancée

### 1. Configuration PostgreSQL

```bash
# Edition du fichier postgresql.conf
sudo nano /etc/postgresql/13/main/postgresql.conf

# Optimisations recommandées
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 2. Configuration Redis

```bash
# Edition du fichier redis.conf
sudo nano /etc/redis/redis.conf

# Optimisations recommandées
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. Configuration du Serveur Web

#### Nginx (Production)
```bash
# Installation
sudo apt install nginx

# Configuration
sudo nano /etc/nginx/sites-available/intelligence-analysis

server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Activation
sudo ln -s /etc/nginx/sites-available/intelligence-analysis /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Démarrage des Services

### 1. Mode Développement

```bash
# Terminal 1 - Frontend + Backend intégré
npm run dev

# Accès
# Frontend: http://localhost:5000
# Backend API: http://localhost:8000
```

### 2. Mode Production

```bash
# Build du frontend
npm run build

# Démarrage du backend optimisé
cd server
python main_optimized.py

# Ou avec Gunicorn
pip install gunicorn
gunicorn --workers 4 --bind 0.0.0.0:8000 "simple_flask_app:app"
```

### 3. Services Système (Linux)

#### Service Backend
```bash
# Création du service systemd
sudo nano /etc/systemd/system/intelligence-backend.service

[Unit]
Description=Intelligence Analysis Backend
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=intelligence
WorkingDirectory=/opt/intelligence-analysis-system/server
Environment=PATH=/opt/intelligence-analysis-system/venv/bin
ExecStart=/opt/intelligence-analysis-system/venv/bin/python main_optimized.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Activation
sudo systemctl daemon-reload
sudo systemctl enable intelligence-backend
sudo systemctl start intelligence-backend
```

#### Service Frontend
```bash
# Création du service systemd
sudo nano /etc/systemd/system/intelligence-frontend.service

[Unit]
Description=Intelligence Analysis Frontend
After=network.target

[Service]
Type=simple
User=intelligence
WorkingDirectory=/opt/intelligence-analysis-system
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target

# Activation
sudo systemctl daemon-reload
sudo systemctl enable intelligence-frontend
sudo systemctl start intelligence-frontend
```

---

## Vérification de l'Installation

### 1. Tests de Connectivité

```bash
# Test de la base de données
python -c "
from server.optimized_database import optimized_db
stats = optimized_db.get_database_stats()
print('Database OK:', stats['total_tables'] > 0)
"

# Test du cache Redis
redis-cli ping

# Test de l'API
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 2. Tests de Performance

```bash
# Test de charge basique
ab -n 100 -c 10 http://localhost:5000/

# Test de l'API
ab -n 100 -c 10 -H "Authorization: Bearer your-token" \
  http://localhost:8000/api/dashboard/stats
```

### 3. Monitoring des Logs

```bash
# Logs du backend
tail -f server/logs/application.log

# Logs système
sudo journalctl -u intelligence-backend -f
sudo journalctl -u intelligence-frontend -f
```

---

## Résolution des Problèmes

### 1. Problèmes de Base de Données

#### Erreur de connexion
```bash
# Vérifier le service PostgreSQL
sudo systemctl status postgresql

# Vérifier les permissions
sudo -u postgres psql -c "\du"

# Recréer l'utilisateur
sudo -u postgres psql
DROP USER IF EXISTS intelligence_user;
CREATE USER intelligence_user WITH PASSWORD 'new_password';
GRANT ALL PRIVILEGES ON DATABASE intelligence_db TO intelligence_user;
```

#### Problème de performance
```bash
# Vérifier les connexions actives
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Optimiser les index
sudo -u postgres psql intelligence_db -c "
REINDEX DATABASE intelligence_db;
ANALYZE;
"
```

### 2. Problèmes de Cache Redis

#### Redis non accessible
```bash
# Vérifier le service
sudo systemctl status redis

# Vérifier la configuration
redis-cli info memory

# Nettoyer le cache
redis-cli flushall
```

### 3. Problèmes de Dependencies

#### Dependencies Python manquantes
```bash
# Réinstaller les dependencies
pip install --upgrade pip
pip install -r server/requirements.txt --force-reinstall
```

#### Dependencies Node.js manquantes
```bash
# Nettoyer et réinstaller
rm -rf node_modules package-lock.json
npm install
```

### 4. Problèmes de Permissions

#### Permissions de fichiers
```bash
# Définir les permissions correctes
sudo chown -R intelligence:intelligence /opt/intelligence-analysis-system
sudo chmod -R 755 /opt/intelligence-analysis-system
sudo chmod +x server/main_optimized.py
```

---

## Optimisations Post-Installation

### 1. Optimisations Système

```bash
# Limites de fichiers
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimisations kernel
echo "net.core.somaxconn = 1024" >> /etc/sysctl.conf
echo "net.core.netdev_max_backlog = 5000" >> /etc/sysctl.conf
sysctl -p
```

### 2. Optimisations Base de Données

```sql
-- Optimisations PostgreSQL
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
SELECT pg_reload_conf();
```

### 3. Monitoring et Alertes

```bash
# Installation de outils de monitoring
pip install prometheus-client
npm install prom-client

# Configuration d'alertes
# Créer des scripts de monitoring pour :
# - Utilisation CPU > 80%
# - Utilisation mémoire > 85%
# - Espace disque < 10%
# - Temps de réponse API > 500ms
```

---

## Maintenance

### 1. Sauvegardes

```bash
# Script de sauvegarde quotidienne
cat > /opt/backup-intelligence.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/intelligence"

# Créer le répertoire de sauvegarde
mkdir -p $BACKUP_DIR

# Sauvegarde de la base de données
pg_dump -U intelligence_user -h localhost intelligence_db > \
  $BACKUP_DIR/database_$DATE.sql

# Sauvegarde des fichiers de configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz \
  /opt/intelligence-analysis-system/server/config.py \
  /opt/intelligence-analysis-system/.env

# Nettoyer les anciennes sauvegardes (>7 jours)
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /opt/backup-intelligence.sh

# Cron job pour sauvegarde quotidienne
echo "0 2 * * * /opt/backup-intelligence.sh" | crontab -
```

### 2. Mise à jour

```bash
# Script de mise à jour
cat > /opt/update-intelligence.sh << 'EOF'
#!/bin/bash
cd /opt/intelligence-analysis-system

# Sauvegarder avant mise à jour
/opt/backup-intelligence.sh

# Arrêter les services
sudo systemctl stop intelligence-frontend
sudo systemctl stop intelligence-backend

# Mettre à jour le code
git pull origin main

# Mettre à jour les dependencies
npm install
pip install -r server/requirements.txt

# Redémarrer les services
sudo systemctl start intelligence-backend
sudo systemctl start intelligence-frontend

# Vérifier le statut
sudo systemctl status intelligence-backend
sudo systemctl status intelligence-frontend
EOF

chmod +x /opt/update-intelligence.sh
```

### 3. Monitoring Continu

```bash
# Script de monitoring
cat > /opt/monitor-intelligence.sh << 'EOF'
#!/bin/bash

# Vérifier les services
systemctl is-active intelligence-backend
systemctl is-active intelligence-frontend
systemctl is-active postgresql
systemctl is-active redis

# Vérifier la santé de l'API
curl -f http://localhost:8000/api/health || echo "API Health Check Failed"

# Vérifier l'utilisation des ressources
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)"
echo "Memory: $(free | grep Mem | awk '{printf "%.2f%%", $3/$2 * 100.0}')"
echo "Disk: $(df -h / | awk 'NR==2{print $5}')"
EOF

chmod +x /opt/monitor-intelligence.sh

# Cron job pour monitoring
echo "*/5 * * * * /opt/monitor-intelligence.sh" | crontab -
```

---

## Support et Dépannage

### 1. Logs Utiles

```bash
# Logs de l'application
tail -f server/logs/application.log

# Logs système
sudo journalctl -u intelligence-backend -f
sudo journalctl -u intelligence-frontend -f

# Logs PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-13-main.log

# Logs Redis
sudo tail -f /var/log/redis/redis-server.log
```

### 2. Commandes de Diagnostic

```bash
# Vérifier les ports
netstat -tlnp | grep -E ":5000|:8000|:5432|:6379"

# Vérifier les processus
ps aux | grep -E "python|node|postgres|redis"

# Vérifier l'utilisation des ressources
htop

# Tester les connexions
telnet localhost 5432
telnet localhost 6379
```

### 3. Contacts Support

- **Documentation** : `/documentation/`
- **Issues** : GitHub Issues
- **Support technique** : support@intelligence-analysis.com
- **Urgences** : +33 X XX XX XX XX

---

## Checklist de Déploiement

### Pré-déploiement
- [ ] Prérequis système vérifiés
- [ ] Dependencies installées
- [ ] Base de données configurée
- [ ] Redis configuré
- [ ] Variables d'environnement définies
- [ ] Certificats SSL installés (production)

### Déploiement
- [ ] Services démarrés
- [ ] Tests de connectivité réussis
- [ ] Tests de performance acceptables
- [ ] Monitoring configuré
- [ ] Sauvegardes programmées
- [ ] Alertes configurées

### Post-déploiement
- [ ] Documentation utilisateur fournie
- [ ] Formation équipe effectuée
- [ ] Procédures d'urgence définies
- [ ] Plan de maintenance établi
- [ ] Support technique disponible

---

## Installation réussie !

Votre système d'analyse d'intelligence est maintenant opérationnel. Consultez la documentation utilisateur pour commencer à utiliser le système.

**Accès** : http://your-domain.com
**API** : http://your-domain.com/api
**Monitoring** : http://your-domain.com/metrics