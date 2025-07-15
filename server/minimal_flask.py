#!/usr/bin/env python3

# Serveur Flask minimal qui fonctionne
from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import sys
import json

app = Flask(__name__)
CORS(app)

# Simple authentification
def simple_auth():
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    return token.startswith('local_token_')

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if username == 'admin' and password == 'admin123':
        return jsonify({
            'success': True,
            'user': {'id': 1, 'username': 'admin', 'name': 'Administrateur'},
            'token': f'local_token_{username}'
        })
    return jsonify({'success': False, 'error': 'Identifiants invalides'}), 401

@app.route('/api/dashboard/stats')
def dashboard_stats():
    return jsonify({
        "active_threats": 15,
        "total_threats": 45,
        "average_score": 0.72,
        "status": "operational"
    })

@app.route('/api/ingestion/upload', methods=['POST'])
def upload_document():
    if not simple_auth():
        return jsonify({'error': 'Authentification requise'}), 401
    
    # Simulation d'upload réussi
    return jsonify({
        'success': True,
        'message': 'Document traité avec succès',
        'analysis': {
            'threats_detected': 3,
            'score': 0.85,
            'entities': ['Mali', 'Kita', 'Orpailleur'],
            'classification': 'HIGH'
        }
    })

@app.route('/api/ingestion/status')
def ingestion_status():
    return jsonify({
        'status': 'active',
        'documents_processed': 127,
        'last_update': '2025-01-15T19:00:00Z'
    })

@app.route('/health')
def health():
    return jsonify({"status": "OK", "service": "Flask Backend"})

if __name__ == '__main__':
    print("Démarrage du serveur Flask minimal...")
    try:
        app.run(host='0.0.0.0', port=8000, debug=False, use_reloader=False)
    except Exception as e:
        print(f"Erreur démarrage Flask: {e}")
        sys.exit(1)