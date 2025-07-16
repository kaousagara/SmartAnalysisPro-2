# Guide de Déploiement en Production

## 🚀 Vue d'ensemble

Ce guide détaille les étapes nécessaires pour déployer le système d'analyse d'intelligence en production.

## 📋 Prérequis

### Infrastructure requise
- **Serveur**: Linux (Ubuntu 20.04+ recommandé) avec au moins 4GB RAM
- **Base de données**: PostgreSQL 13+ 
- **Cache**: Redis 6+
- **Node.js**: Version 18+ 
- **Python**: Version 3.9+
- **Nginx**: Pour le reverse proxy

### Services externes (optionnels)
- OpenAI API pour l'analyse LLM
- Service de monitoring (Sentry, DataDog)
- CDN pour les assets statiques

## 🔧 Configuration

### 1. Variables d'environnement

Copier et configurer le fichier `.env.production`:

```bash
cp .env.production.example .env.production
# Éditer .env.production avec vos valeurs
```

Variables critiques à configurer:
- `DATABASE_URL`: URL complète PostgreSQL
- `SECRET_KEY`: Clé secrète unique et sécurisée
- `JWT_SECRET_KEY`: Clé JWT différente de SECRET_KEY
- `REDIS_URL`: URL Redis avec authentification

### 2. Base de données

Initialiser la base de données:

```bash
# Se connecter à PostgreSQL
psql -U postgres

# Créer la base de données
CREATE DATABASE intelligence_production;

# Le système créera automatiquement les tables au démarrage
```

### 3. Installation des dépendances

```bash
# Dépendances Node.js
npm install --production

# Dépendances Python
pip install -r requirements.txt

# Installer les services de production
pip install gunicorn
npm install -g pm2
```

## 🏗️ Build de production

### Frontend

```bash
# Construire le frontend optimisé
npm run build
```

### Backend

Aucun build requis pour le backend Python.

## 🌐 Déploiement

### 1. Méthode automatique

Utiliser le script de démarrage:

```bash
chmod +x start-production.sh
./start-production.sh
```

### 2. Méthode manuelle

#### Backend Flask avec Gunicorn

```bash
gunicorn -w 4 \
  -b 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  server.simple_flask_app:app
```

#### Frontend avec PM2

```bash
# Démarrer avec PM2
NODE_ENV=production pm2 start server/index.js --name "intelligence-frontend"

# Sauvegarder la configuration PM2
pm2 save
pm2 startup
```

### 3. Configuration Nginx

Créer `/etc/nginx/sites-available/intelligence-system`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Redirection HTTP vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Activer le site:

```bash
ln -s /etc/nginx/sites-available/intelligence-system /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 🔒 Sécurité

### 1. Firewall

```bash
# Configurer UFW
ufw allow 22/tcp  # SSH
ufw allow 80/tcp  # HTTP
ufw allow 443/tcp # HTTPS
ufw enable
```

### 2. SSL/TLS

Utiliser Let's Encrypt:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 3. Hardening

- Désactiver les comptes par défaut
- Configurer fail2ban
- Activer les logs d'audit
- Implémenter la rotation des logs

## 📊 Monitoring

### 1. Logs

Les logs sont disponibles dans:
- Frontend: `pm2 logs intelligence-frontend`
- Backend: `/var/log/gunicorn/`
- Nginx: `/var/log/nginx/`

### 2. Métriques

Accéder aux métriques système:
- Performance: `GET /api/system/performance`
- Santé: `GET /api/health`

### 3. Alertes

Configurer des alertes pour:
- CPU > 80%
- Mémoire > 85%
- Temps de réponse API > 1s
- Erreurs 5xx

## 🔄 Mise à jour

### 1. Procédure de mise à jour

```bash
# 1. Backup de la base de données
pg_dump intelligence_production > backup_$(date +%Y%m%d).sql

# 2. Pull des nouvelles modifications
git pull origin main

# 3. Installer les nouvelles dépendances
npm install --production
pip install -r requirements.txt

# 4. Build du frontend
npm run build

# 5. Redémarrer les services
pm2 restart intelligence-frontend
systemctl restart gunicorn
```

### 2. Rollback

En cas de problème:

```bash
# Restaurer la base de données
psql intelligence_production < backup_YYYYMMDD.sql

# Revenir à la version précédente
git checkout [previous-commit-hash]

# Redémarrer
./start-production.sh
```

## 🆘 Dépannage

### Problèmes courants

1. **Erreur de connexion à la base de données**
   - Vérifier DATABASE_URL
   - Vérifier que PostgreSQL est démarré
   - Vérifier les permissions

2. **Erreur 502 Bad Gateway**
   - Vérifier que les services backend sont démarrés
   - Vérifier les logs Nginx
   - Vérifier les ports

3. **Performance dégradée**
   - Vérifier l'utilisation CPU/mémoire
   - Analyser les requêtes lentes PostgreSQL
   - Vérifier le cache Redis

### Commandes utiles

```bash
# Status des services
pm2 status
systemctl status gunicorn

# Logs en temps réel
pm2 logs --lines 100
journalctl -u gunicorn -f

# Redémarrage d'urgence
pm2 restart all
systemctl restart gunicorn nginx redis postgresql
```

## 📞 Support

Pour toute assistance:
- Documentation: `/documentation/`
- Logs détaillés: Activer LOG_LEVEL=DEBUG temporairement
- Monitoring: Vérifier les dashboards de performance

## ✅ Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données initialisée
- [ ] Certificats SSL installés
- [ ] Firewall configuré
- [ ] Backup automatique configuré
- [ ] Monitoring activé
- [ ] Tests de charge effectués
- [ ] Documentation mise à jour
- [ ] Plan de rollback préparé