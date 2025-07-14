import os
import json
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Mock user data
USERS = {
    'analyst': {
        'password': generate_password_hash('analyst123'),
        'clearance_level': 3,
        'name': 'Analyst J.Smith'
    },
    'admin': {
        'password': generate_password_hash('admin123'),
        'clearance_level': 5,
        'name': 'Admin User'
    }
}

# Mock data for demonstration
SAMPLE_THREATS = [
    {
        'id': 'threat_001',
        'name': 'Activité réseau suspecte',
        'score': 0.85,
        'severity': 'high',
        'timestamp': '2024-01-15T10:30:00Z',
        'status': 'active'
    },
    {
        'id': 'threat_002',
        'name': 'Détection de malware',
        'score': 0.92,
        'severity': 'critical',
        'timestamp': '2024-01-15T11:45:00Z',
        'status': 'active'
    },
    {
        'id': 'threat_003',
        'name': 'Tentative d\'accès non autorisé',
        'score': 0.67,
        'severity': 'medium',
        'timestamp': '2024-01-15T09:15:00Z',
        'status': 'resolved'
    },
    {
        'id': 'threat_004',
        'name': 'Intrusion système détectée',
        'score': 0.78,
        'severity': 'high',
        'timestamp': '2024-01-15T12:15:00Z',
        'status': 'active'
    },
    {
        'id': 'threat_005',
        'name': 'Phishing email campaign',
        'score': 0.64,
        'severity': 'medium',
        'timestamp': '2024-01-15T08:45:00Z',
        'status': 'monitoring'
    },
    {
        'id': 'threat_006',
        'name': 'Attaque DDoS en cours',
        'score': 0.89,
        'severity': 'critical',
        'timestamp': '2024-01-15T13:00:00Z',
        'status': 'active'
    }
]

SAMPLE_SCENARIOS = [
    {
        'id': 'scenario_001',
        'name': 'ATT-2024-MALI',
        'description': 'Détection de menaces régionales pour la zone Mali',
        'conditions': [
            {'type': 'location', 'value': 'Mali'},
            {'type': 'threat_score', 'operator': '>', 'value': 0.7}
        ],
        'actions': [
            {'type': 'SIGINT', 'description': 'Initialiser la collecte SIGINT'},
            {'type': 'HUMINT', 'description': 'Déployer les actifs HUMINT'}
        ],
        'status': 'active',
        'priority': 1,
        'conditions_met': 2,
        'total_conditions': 2,
        'last_triggered': '2024-01-15T12:00:00Z'
    },
    {
        'id': 'scenario_002',
        'name': 'CYBER-INTRUSION-07',
        'description': 'Détection d\'intrusion cybernétique avancée',
        'conditions': [
            {'type': 'threat_type', 'value': 'cyber'},
            {'type': 'severity', 'operator': '>=', 'value': 'high'}
        ],
        'actions': [
            {'type': 'NETWORK_ISOLATION', 'description': 'Isoler le réseau compromis'},
            {'type': 'FORENSIC_ANALYSIS', 'description': 'Lancer l\'analyse forensique'}
        ],
        'status': 'active',
        'priority': 2,
        'conditions_met': 1,
        'total_conditions': 2,
        'last_triggered': '2024-01-15T11:30:00Z'
    },
    {
        'id': 'scenario_003',
        'name': 'PHISHING-CAMPAIGN-DETECT',
        'description': 'Détection de campagne de phishing',
        'conditions': [
            {'type': 'email_indicators', 'value': 'suspicious'},
            {'type': 'volume', 'operator': '>', 'value': 100}
        ],
        'actions': [
            {'type': 'EMAIL_FILTERING', 'description': 'Activer le filtrage email'},
            {'type': 'USER_NOTIFICATION', 'description': 'Notifier les utilisateurs'}
        ],
        'status': 'partial',
        'priority': 3,
        'conditions_met': 1,
        'total_conditions': 2,
        'last_triggered': '2024-01-15T08:45:00Z'
    }
]

@app.route('/auth/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if username in USERS and check_password_hash(USERS[username]['password'], password):
            user_data = {
                'username': username,
                'name': USERS[username]['name'],
                'clearance_level': USERS[username]['clearance_level']
            }
            return jsonify({
                'success': True,
                'user': user_data,
                'token': f'local_token_{username}'
            })
        else:
            return jsonify({'success': False, 'message': 'Identifiants invalides'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/user', methods=['GET'])
def get_user():
    """Get current user info"""
    try:
        # For demo purposes, return a default user
        # In a real system, this would check the JWT token
        return jsonify({
            'user': {
                'username': 'analyst',
                'name': 'Analyst J.Smith',
                'clearance_level': 3
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """Get dashboard statistics"""
    return jsonify({
        'stats': {
            'active_threats': len([t for t in SAMPLE_THREATS if t['status'] == 'active']),
            'avg_score': sum(t['score'] for t in SAMPLE_THREATS) / len(SAMPLE_THREATS),
            'high_severity_count': len([t for t in SAMPLE_THREATS if t['severity'] in ['high', 'critical']]),
            'false_positive_rate': 0.05,
            'data_sources': 8,
            'data_sources_operational': 7,
            'system_status': 'operational'
        }
    })

@app.route('/threats/realtime', methods=['GET'])
def realtime_threats():
    """Get real-time threats"""
    return jsonify({
        'threats': SAMPLE_THREATS[:10]  # Return first 10 threats
    })

@app.route('/threats/evolution', methods=['GET'])
def threat_evolution():
    """Get threat evolution data"""
    return jsonify({
        'evolution': {
            'timestamps': ['2024-01-15T09:00:00Z', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', '2024-01-15T12:00:00Z'],
            'scores': [0.3, 0.5, 0.7, 0.8],
            'predictions': [0.85, 0.9, 0.92, 0.95]
        }
    })

@app.route('/scenarios', methods=['GET'])
def get_scenarios():
    """Get active scenarios"""
    return jsonify({
        'scenarios': SAMPLE_SCENARIOS
    })

@app.route('/scenarios/<scenario_id>', methods=['GET'])
def get_scenario(scenario_id):
    """Get specific scenario"""
    scenario = next((s for s in SAMPLE_SCENARIOS if s['id'] == scenario_id), None)
    if scenario:
        return jsonify({'scenario': scenario})
    return jsonify({'error': 'Scenario not found'}), 404

@app.route('/ingestion/status', methods=['GET'])
def ingestion_status():
    """Get data ingestion status"""
    return jsonify({
        'sources': [
            {
                'name': 'Flux SIGINT',
                'type': 'stream',
                'status': 'operational',
                'last_updated': '2024-01-15T12:00:00Z',
                'throughput': '1.2K/sec',
                'queue_size': 45
            },
            {
                'name': 'Rapports HUMINT',
                'type': 'batch',
                'status': 'operational',
                'last_updated': '2024-01-15T11:30:00Z',
                'throughput': '25/hour'
            },
            {
                'name': 'Intelligence Open Source',
                'type': 'stream',
                'status': 'degraded',
                'last_updated': '2024-01-15T10:15:00Z',
                'throughput': '800/sec',
                'queue_size': 120
            },
            {
                'name': 'Feeds STIX/TAXII',
                'type': 'stream',
                'status': 'operational',
                'last_updated': '2024-01-15T12:30:00Z',
                'throughput': '2.5K/sec',
                'queue_size': 15
            },
            {
                'name': 'Logs de sécurité',
                'type': 'stream',
                'status': 'operational',
                'last_updated': '2024-01-15T12:45:00Z',
                'throughput': '5K/sec',
                'queue_size': 230
            }
        ]
    })

@app.route('/actions', methods=['GET'])
def get_actions():
    """Get recent actions"""
    return jsonify({
        'actions': [
            {
                'id': 'action_001',
                'type': 'SIGINT_COLLECTION',
                'description': 'Collection SIGINT initiée pour la région Mali',
                'priority': 'high',
                'status': 'in_progress',
                'timestamp': '2024-01-15T11:45:00Z'
            },
            {
                'id': 'action_002',
                'type': 'THREAT_ANALYSIS',
                'description': 'Analyse de l\'échantillon de malware threat_002',
                'priority': 'critical',
                'status': 'completed',
                'timestamp': '2024-01-15T11:30:00Z'
            },
            {
                'id': 'action_003',
                'type': 'NETWORK_MONITORING',
                'description': 'Surveillance réseau activée pour IP suspecte',
                'priority': 'medium',
                'status': 'active',
                'timestamp': '2024-01-15T11:15:00Z'
            }
        ]
    })

@app.route('/alerts', methods=['GET'])
def get_alerts():
    """Get active alerts"""
    return jsonify({
        'alerts': [
            {
                'id': 'alert_001',
                'type': 'threat',
                'severity': 'critical',
                'title': 'Score de Menace Élevé Détecté',
                'message': 'La menace threat_002 a dépassé le seuil critique',
                'timestamp': '2024-01-15T11:45:00Z',
                'threat_id': 'threat_002'
            },
            {
                'id': 'alert_002',
                'type': 'system',
                'severity': 'warning',
                'title': 'Latence Système Élevée',
                'message': 'Temps de réponse élevé détecté sur le module d\'analyse',
                'timestamp': '2024-01-15T11:30:00Z'
            }
        ]
    })

@app.route('/feedback', methods=['POST'])
def submit_feedback():
    """Submit feedback"""
    try:
        data = request.get_json()
        # Process feedback (in real implementation, this would update ML models)
        return jsonify({'success': True, 'message': 'Feedback processed successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0'
    })

# ===================== ADMIN ROUTES =====================

@app.route('/admin/config', methods=['GET', 'POST'])
def admin_config():
    """Configuration d'administration"""
    DEFAULT_CONFIG = {
        'llm_provider': 'chatgpt',
        'llm_config': {
            'openai_api_key': '',
            'openai_model': 'gpt-4o',
            'ollama_url': 'http://localhost:11434',
            'ollama_model': 'llama3.1:8b',
            'openrouter_api_key': '',
            'openrouter_model': 'anthropic/claude-3-sonnet'
        },
        'system_config': {
            'threat_threshold': 0.7,
            'alert_enabled': True,
            'data_retention_days': 90,
            'max_concurrent_ingestion': 10,
            'response_timeout': 30,
            'false_positive_threshold': 0.08
        }
    }
    
    if request.method == 'GET':
        try:
            config_path = 'config/admin_config.json'
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
            else:
                config = DEFAULT_CONFIG
            
            return jsonify({'config': config})
        except Exception as e:
            return jsonify({'error': str(e)}), 500
    
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            if not data:
                return jsonify({'error': 'Données manquantes'}), 400
            
            config = {
                'llm_provider': data.get('llm_provider', 'chatgpt'),
                'llm_config': data.get('llm_config', {}),
                'system_config': data.get('system_config', {}),
                'last_updated': datetime.now().isoformat()
            }
            
            # Créer le dossier config s'il n'existe pas
            os.makedirs('config', exist_ok=True)
            
            # Sauvegarder la configuration
            config_path = 'config/admin_config.json'
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
            
            return jsonify({'message': 'Configuration sauvegardée avec succès'})
            
        except Exception as e:
            return jsonify({'error': str(e)}), 500

@app.route('/admin/test-llm', methods=['POST'])
def test_llm():
    """Tester la connexion LLM"""
    try:
        data = request.get_json()
        provider = data.get('provider', 'chatgpt')
        config = data.get('config', {})
        
        if provider == 'chatgpt':
            return test_openai(config)
        elif provider == 'ollama':
            return test_ollama(config)
        elif provider == 'openrouter':
            return test_openrouter(config)
        else:
            return jsonify({'success': False, 'error': 'Fournisseur non supporté'}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def test_openai(config):
    """Tester la connexion OpenAI"""
    try:
        api_key = config.get('openai_api_key', '')
        if not api_key:
            return jsonify({'success': False, 'error': 'Clé API OpenAI manquante'}), 400
        
        # Simuler un test de connexion réussi pour la démo
        return jsonify({
            'success': True, 
            'message': 'Connexion OpenAI réussie',
            'model': config.get('openai_model', 'gpt-4o')
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erreur OpenAI: {str(e)}'}), 400

def test_ollama(config):
    """Tester la connexion Ollama"""
    try:
        url = config.get('ollama_url', 'http://localhost:11434')
        model = config.get('ollama_model', 'llama3.1:8b')
        
        # Simuler un test de connexion pour la démo
        return jsonify({
            'success': True, 
            'message': 'Connexion Ollama réussie',
            'model': model
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erreur Ollama: {str(e)}'}), 400

def test_openrouter(config):
    """Tester la connexion OpenRouter"""
    try:
        api_key = config.get('openrouter_api_key', '')
        if not api_key:
            return jsonify({'success': False, 'error': 'Clé API OpenRouter manquante'}), 400
        
        model = config.get('openrouter_model', 'anthropic/claude-3-sonnet')
        
        # Simuler un test de connexion pour la démo
        return jsonify({
            'success': True, 
            'message': 'Connexion OpenRouter réussie',
            'model': model
        })
        
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erreur OpenRouter: {str(e)}'}), 400

@app.route('/admin/system-status', methods=['GET'])
def system_status():
    """Obtenir le statut du système"""
    try:
        system_info = {
            'version': '2.0.0',
            'uptime': '5 heures',
            'memory_usage': '45%',
            'disk_usage': '32%',
            'active_connections': 12,
            'last_backup': '2024-01-15 08:30:00',
            'llm_provider': 'chatgpt',
            'database_status': 'operational'
        }
        
        return jsonify({'system_info': system_info})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)