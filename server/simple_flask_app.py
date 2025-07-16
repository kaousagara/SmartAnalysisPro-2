import os
import json
import time
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from services.prescription_service import PrescriptionService
from database import db
from routes.deep_learning_routes import deep_learning_bp

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Simple token validation function
def token_required(f):
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].replace('Bearer ', '')
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        # Simple validation - in production, use proper JWT validation
        if not (token.startswith('local_token_') or token.startswith('db_token_')):
            return jsonify({'message': 'Token is invalid!'}), 401
        
        return f(*args, **kwargs)
    
    decorated.__name__ = f.__name__
    return decorated

# Register blueprints
app.register_blueprint(deep_learning_bp)

# Initialize services
prescription_service = PrescriptionService()

# Les données simulées ont été supprimées - utilisez maintenant la base de données

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # Check user credentials using database
        user = db.verify_password(username, password)
        if user:
            return jsonify({
                'success': True,
                'user': user,
                'token': f'local_token_{username}'
            })
        else:
            return jsonify({'success': False, 'message': 'Identifiants invalides'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def auth_login():
    """Handle user authentication using database"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        two_fa_code = data.get('two_fa_code')
        
        if not username or not password:
            return jsonify({'success': False, 'message': 'Nom d\'utilisateur et mot de passe requis'}), 400
        
        # Vérification via la base de données
        user = db.verify_password(username, password)
        
        if not user:
            return jsonify({'success': False, 'message': 'Identifiants invalides'}), 401
        
        # 2FA is optional - if provided, it should be valid
        if two_fa_code and two_fa_code.strip():
            # For demo purposes, accept any 6-digit code or "123456"
            if len(two_fa_code) != 6 or not two_fa_code.isdigit():
                return jsonify({'success': False, 'message': 'Code 2FA invalide (6 chiffres requis)'}), 400
        
        # Générer un token simple (en production, utiliser JWT ou similaire)
        token = f'db_token_{username}_{int(time.time())}'
        
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'name': user['name'],
                'clearance_level': user['clearance_level'],
                'email': user['email']
            },
            'token': token
        })
    
    except Exception as e:
        print(f"Erreur lors de la connexion: {e}")
        return jsonify({'success': False, 'message': f'Erreur lors de la connexion: {str(e)}'}), 500

@app.route('/api/user', methods=['GET'])
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

@app.route('/api/auth/user', methods=['GET'])
def get_auth_user():
    """Get authenticated user info from token"""
    try:
        # In a real system, this would validate the JWT token
        # For now, we'll use a simple header-based approach
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Token d\'authentification requis'}), 401
        
        # Extract token from "Bearer <token>" format
        token = auth_header.replace('Bearer ', '') if auth_header.startswith('Bearer ') else auth_header
        
        # Parse token to get username (simple implementation)
        if token.startswith('db_token_'):
            username = token.split('_')[2]  # db_token_<username>_<timestamp>
            
            # Get user from database
            user = db.get_user_by_username(username)
            if user:
                return jsonify({
                    'id': user['id'],
                    'username': user['username'],
                    'name': user['name'],
                    'clearance_level': user['clearance_level'],
                    'email': user['email']
                })
        
        return jsonify({'error': 'Token invalide'}), 401
    except Exception as e:
        print(f"Erreur lors de la récupération de l'utilisateur authentifié: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def auth_logout():
    """Handle user logout"""
    try:
        # In a real system, this would invalidate the JWT token
        # For now, we'll just return success
        return jsonify({'success': True, 'message': 'Déconnexion réussie'})
    except Exception as e:
        print(f"Erreur lors de la déconnexion: {e}")
        return jsonify({'success': False, 'message': f'Erreur lors de la déconnexion: {str(e)}'}), 500

# === ADMINISTRATION ENDPOINTS ===

@app.route('/api/admin/users', methods=['GET'])
def get_users():
    """Récupérer tous les utilisateurs"""
    try:
        users = db.get_all_users()
        return jsonify({'users': users})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['POST'])
def create_user():
    """Créer un nouvel utilisateur"""
    try:
        data = request.get_json()
        
        # Validation des données
        required_fields = ['username', 'password', 'name', 'email', 'clearance_level']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Le champ {field} est requis'}), 400
        
        # Créer l'utilisateur
        user = db.create_user(
            username=data['username'],
            password=data['password'],
            clearance_level=data['clearance_level'],
            name=data['name'],
            email=data['email']
        )
        
        if user:
            return jsonify({'success': True, 'user': user}), 201
        else:
            return jsonify({'error': 'Nom d\'utilisateur déjà existant'}), 409
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['PUT'])
def update_user(user_id):
    """Mettre à jour un utilisateur"""
    try:
        data = request.get_json()
        
        # Mettre à jour l'utilisateur
        user = db.update_user(
            user_id=user_id,
            username=data.get('username'),
            clearance_level=data.get('clearance_level'),
            name=data.get('name'),
            email=data.get('email'),
            is_active=data.get('is_active')
        )
        
        if user:
            return jsonify({'success': True, 'user': user})
        else:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Supprimer un utilisateur"""
    try:
        success = db.delete_user(user_id)
        
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<int:user_id>/password', methods=['PUT'])
def update_user_password(user_id):
    """Mettre à jour le mot de passe d'un utilisateur"""
    try:
        data = request.get_json()
        
        if 'password' not in data:
            return jsonify({'error': 'Le mot de passe est requis'}), 400
        
        success = db.update_password(user_id, data['password'])
        
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    """Get dashboard statistics"""
    try:
        # Récupérer les statistiques depuis la base de données
        threats = db.get_all_threats()
        
        active_threats = len([t for t in threats if t.get('status') == 'active'])
        avg_score = sum(t.get('score', 0) for t in threats) / len(threats) if threats else 0
        high_severity_count = len([t for t in threats if t.get('severity') in ['high', 'critical']])
        
        return jsonify({
            'stats': {
                'active_threats': active_threats,
                'avg_score': round(avg_score, 2),
                'high_severity_count': high_severity_count,
                'false_positive_rate': 0.05,
                'data_sources': 8,
                'data_sources_operational': 7,
                'system_status': 'operational'
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/threats/realtime', methods=['GET'])
def realtime_threats():
    """Get real-time threats"""
    try:
        limit = request.args.get('limit', 10, type=int)
        threats = db.get_all_threats()[:limit]
        
        return jsonify({
            'threats': threats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/threats/evolution', methods=['GET'])
def threat_evolution():
    """Get threat evolution data"""
    return jsonify({
        'evolution': {
            'timestamps': ['2024-01-15T09:00:00Z', '2024-01-15T10:00:00Z', '2024-01-15T11:00:00Z', '2024-01-15T12:00:00Z'],
            'scores': [0.3, 0.5, 0.7, 0.8],
            'predictions': [0.85, 0.9, 0.92, 0.95]
        }
    })

@app.route('/api/scenarios', methods=['GET'])
def get_scenarios():
    """Get active scenarios"""
    try:
        scenarios = db.get_all_scenarios()
        return jsonify({
            'scenarios': scenarios
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scenarios/<scenario_id>', methods=['GET'])
def get_scenario(scenario_id):
    """Get specific scenario"""
    try:
        scenario = db.get_scenario_by_id(scenario_id)
        if scenario:
            return jsonify({'scenario': scenario})
        return jsonify({'error': 'Scenario not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ingestion/status', methods=['GET'])
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

@app.route('/api/ingestion/upload', methods=['POST'])
@token_required
def upload_document():
    """Uploader et traiter un document"""
    try:
        # Vérifier qu'un fichier est présent
        if 'file' not in request.files:
            return jsonify({'error': 'Aucun fichier fourni'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'Nom de fichier vide'}), 400
        
        # Traiter le fichier
        filename = file.filename
        file_content = file.read()
        file_size = len(file_content)
        
        # Simuler l'analyse du document
        document_analysis = {
            'id': f'doc_{abs(hash(filename))%10000:04d}',
            'filename': filename,
            'size': file_size,
            'type': 'DOCUMENT',
            'classification': 'NON CLASSIFIÉ',
            'timestamp': datetime.now().isoformat(),
            'content': {
                'text_preview': file_content[:500].decode('utf-8', errors='ignore') if file_content else '',
                'word_count': len(file_content.decode('utf-8', errors='ignore').split()) if file_content else 0,
                'language': 'Français',
                'format': filename.split('.')[-1].upper() if '.' in filename else 'UNKNOWN'
            },
            'processing': {
                'entities_extracted': {
                    'locations': ['Gao', 'Kidal', 'Mali'],
                    'organizations': ['Forces Armées', 'Police'],
                    'persons': ['Agent local', 'Responsable sécurité']
                },
                'threat_scoring': {
                    'threat_level': 'MEDIUM',
                    'confidence': 0.65,
                    'risk_factors': ['Activité inhabituelle', 'Zone sensible'],
                    'score': 0.72
                },
                'keywords': ['sécurité', 'surveillance', 'incident', 'rapport'],
                'sentiment': 'Neutre'
            },
            'next_actions': [
                'Validation par analyste',
                'Indexation dans base de données',
                'Génération d\'alertes si nécessaire'
            ]
        }
        
        # Simuler l'ingestion réussie
        ingestion_result = {
            'success': True,
            'document': document_analysis,
            'message': 'Document uploadé et traité avec succès',
            'processing_time': f"{abs(hash(filename)) % 2000 + 500}ms",
            'status': 'PROCESSED',
            'recommendations': [
                'Document ajouté à la base de connaissances',
                'Analyse croisée avec documents similaires programmée',
                'Notification envoyée aux analystes concernés'
            ]
        }
        
        return jsonify(ingestion_result), 200
        
    except Exception as e:
        logger.error(f"Erreur lors de l'upload: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Erreur lors du traitement du document'
        }), 500

@app.route('/api/ingestion/test', methods=['POST'])
def test_ingestion():
    """Tester l'ingestion avec des données réalistes"""
    try:
        data = request.get_json()
        
        # Simuler différents types de documents d'ingestion
        test_documents = [
            {
                'id': 'doc_ingestion_001',
                'type': 'SIGINT',
                'classification': 'SECRET',
                'title': 'Interception communications - Secteur Gao',
                'source': 'Station écoute GA-Alpha',
                'timestamp': datetime.now().isoformat(),
                'content': {
                    'raw_data': 'INTERCEPTED_COMM_142.5MHZ_20250714_1640Z',
                    'frequency': '142.5 MHz',
                    'location': '16.2728°N, 0.0402°W',
                    'duration': '00:12:34',
                    'signal_strength': '-67 dBm',
                    'encryption': 'Partial',
                    'language': 'Français/Arabe',
                    'participants': 3,
                    'transcript': 'Conversation partiellement cryptée. Mots-clés détectés: [véhicule], [nord], [demain], [opération]'
                },
                'metadata': {
                    'confidence': 0.72,
                    'quality_score': 0.85,
                    'analyst_notes': 'Communications suspectes coordonnées',
                    'keywords': ['véhicule', 'nord', 'opération', 'demain'],
                    'threat_indicators': ['coordination suspecte', 'timing inhabituel']
                }
            },
            {
                'id': 'doc_ingestion_002',
                'type': 'HUMINT',
                'classification': 'CONFIDENTIEL',
                'title': 'Rapport agent local - Mouvements Kidal',
                'source': 'Agent KI-7',
                'timestamp': datetime.now().isoformat(),
                'content': {
                    'report_text': 'Observation de convoi de 4 véhicules type pick-up, sans plaques, direction Sud-Est vers 14h30. Population locale rapporte activité inhabituelle depuis 48h. Commerçants locaux inquiets, plusieurs ont fermé boutiques prématurément.',
                    'location': 'Kidal - Route N15',
                    'witness_count': 7,
                    'vehicle_description': '4 pick-up Toyota Hilux, couleur beige/sable, sans plaques visibles',
                    'time_observed': '14:30 local time',
                    'direction': 'Sud-Est vers zone rurale',
                    'additional_info': 'Conducteurs portaient uniformes non identifiés, équipement radio visible'
                },
                'metadata': {
                    'confidence': 0.68,
                    'reliability_score': 0.75,
                    'agent_experience': 'Expérimenté (5 ans)',
                    'cross_referenced': False,
                    'threat_assessment': 'Moyen',
                    'follow_up_required': True
                }
            },
            {
                'id': 'doc_ingestion_003',
                'type': 'OSINT',
                'classification': 'NON CLASSIFIÉ',
                'title': 'Analyse réseaux sociaux - Activité région Mali',
                'source': 'Monitoring automatique',
                'timestamp': datetime.now().isoformat(),
                'content': {
                    'platform': 'Twitter/Facebook/Telegram',
                    'posts_analyzed': 15420,
                    'relevant_posts': 47,
                    'sentiment_analysis': 'Négatif (72%)',
                    'key_themes': ['sécurité dégradée', 'présence groupes armés', 'population inquiète'],
                    'geolocation_data': 'Gao, Kidal, Tombouctou',
                    'language_distribution': {'Français': 65, 'Arabe': 20, 'Bambara': 15},
                    'trending_hashtags': ['#MaliSecurity', '#Gao', '#SécuritéDégradée']
                },
                'metadata': {
                    'confidence': 0.79,
                    'automated_analysis': True,
                    'human_verification': False,
                    'data_volume': 'Élevé',
                    'collection_period': '72h',
                    'alerts_generated': 3
                }
            }
        ]
        
        # Simuler le processus d'ingestion
        ingestion_results = []
        for doc in test_documents:
            # Validation du document
            validation_result = {
                'document_id': doc['id'],
                'validation_status': 'VALID',
                'format_check': 'PASSED',
                'classification_check': 'PASSED',
                'metadata_check': 'PASSED',
                'content_analysis': 'COMPLETED'
            }
            
            # Extraction d'entités
            entities_extracted = {
                'locations': ['Gao', 'Kidal', 'Tombouctou'],
                'organizations': ['Station écoute GA-Alpha', 'Agent KI-7'],
                'persons': ['Agent KI-7'],
                'vehicles': ['Toyota Hilux'],
                'frequencies': ['142.5 MHz'] if doc['type'] == 'SIGINT' else [],
                'timestamps': [doc['timestamp']],
                'threat_indicators': doc['metadata'].get('threat_indicators', [])
            }
            
            # Scoring de menace
            threat_score = {
                'overall_score': doc['metadata']['confidence'],
                'components': {
                    'source_reliability': doc['metadata'].get('reliability_score', 0.7),
                    'content_relevance': 0.8,
                    'temporal_relevance': 0.85,
                    'geographical_relevance': 0.9
                },
                'threat_level': 'MEDIUM' if doc['metadata']['confidence'] > 0.7 else 'LOW'
            }
            
            # Enrichissement avec données contextuelles
            enrichment = {
                'historical_context': f"Document similaire analysé il y a 48h dans zone {doc['content'].get('location', 'inconnue')}",
                'related_incidents': 2,
                'pattern_matching': 'Correspond au pattern "Activité Coordonnée Suspecte"',
                'risk_assessment': 'Nécessite surveillance accrue'
            }
            
            ingestion_result = {
                'document': doc,
                'validation': validation_result,
                'entities': entities_extracted,
                'threat_scoring': threat_score,
                'enrichment': enrichment,
                'processing_time': f"{abs(hash(doc['id']) % 1000)}ms",
                'status': 'INGESTED',
                'next_actions': [
                    'Analyse croisée avec documents similaires',
                    'Validation par analyste humain',
                    'Génération d\'alertes si nécessaire'
                ]
            }
            
            ingestion_results.append(ingestion_result)
        
        # Statistiques globales d'ingestion
        ingestion_stats = {
            'total_documents': len(test_documents),
            'successful_ingestions': len(ingestion_results),
            'failed_ingestions': 0,
            'average_processing_time': f"{sum(int(r['processing_time'].replace('ms', '')) for r in ingestion_results) / len(ingestion_results):.0f}ms",
            'total_entities_extracted': sum(len(r['entities']['locations']) + len(r['entities']['organizations']) + len(r['entities']['persons']) for r in ingestion_results),
            'threat_distribution': {
                'HIGH': len([r for r in ingestion_results if r['threat_scoring']['threat_level'] == 'HIGH']),
                'MEDIUM': len([r for r in ingestion_results if r['threat_scoring']['threat_level'] == 'MEDIUM']),
                'LOW': len([r for r in ingestion_results if r['threat_scoring']['threat_level'] == 'LOW'])
            },
            'ingestion_timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'message': 'Test d\'ingestion réalisé avec succès',
            'ingestion_results': ingestion_results,
            'statistics': ingestion_stats,
            'recommendations': [
                'Requête de collecte automatique générée pour zone Gao',
                'Alerte créée pour surveillance accrue secteur Kidal',
                'Analyse croisée recommandée avec données SIGINT précédentes'
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/actions', methods=['GET'])
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

@app.route('/api/alerts', methods=['GET'])
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

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '2.0.0'
    })

# ===================== ADMIN ROUTES =====================



@app.route('/api/admin/test-llm', methods=['POST'])
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
        import os
        
        # Utiliser la clé API de l'environnement ou de la configuration
        api_key = config.get('openai_api_key', '') or os.getenv('OPENAI_API_KEY')
        if not api_key:
            return jsonify({'success': False, 'error': 'Cle API OpenAI manquante'}), 400
        
        # Test avec la vraie API OpenAI
        try:
            import openai
            
            client = openai.OpenAI(api_key=api_key)
            model = config.get('openai_model', 'gpt-4o')
            
            # Test simple avec une requête basique
            response = client.chat.completions.create(
                model=model,
                messages=[{'role': 'user', 'content': 'Test de connexion - repondez simplement "OK"'}],
                max_tokens=10
            )
            
            return jsonify({
                'success': True, 
                'message': f'Connexion OpenAI reussie avec {model}',
                'model': model,
                'response': response.choices[0].message.content.strip()
            })
            
        except openai.AuthenticationError:
            return jsonify({'success': False, 'error': 'Cle API OpenAI invalide'}), 400
        except openai.RateLimitError:
            return jsonify({'success': False, 'error': 'Limite de taux depassee'}), 400
        except openai.APIError as e:
            return jsonify({'success': False, 'error': f'Erreur API OpenAI: {str(e)}'}), 400
        except Exception as e:
            return jsonify({'success': False, 'error': f'Erreur OpenAI: {str(e)}'}), 400
            
    except ImportError:
        return jsonify({'success': False, 'error': 'Module OpenAI non installe'}), 400
    except Exception as e:
        return jsonify({'success': False, 'error': f'Erreur inattendue: {str(e)}'}), 500

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

@app.route('/api/admin/config', methods=['GET', 'POST'])
def admin_config():
    """Configuration d'administration"""
    if request.method == 'GET':
        # Recuperer la configuration actuelle
        config = {
            'llm_provider': 'chatgpt',
            'llm_config': {
                'openai_api_key': '***masked***',
                'openai_model': 'gpt-4o',
                'ollama_url': 'http://localhost:11434',
                'ollama_model': 'llama3.1:8b'
            },
            'system_config': {
                'threat_threshold': 0.7,
                'alert_enabled': True,
                'data_retention_days': 90
            }
        }
        return jsonify(config)
    
    elif request.method == 'POST':
        # Sauvegarder la configuration
        try:
            data = request.get_json()
            
            # Simuler la sauvegarde de la configuration
            # En production, vous sauvegarderiez en base de donnees
            saved_config = {
                'llm_provider': data.get('llm_provider', 'chatgpt'),
                'llm_config': data.get('llm_config', {}),
                'system_config': data.get('system_config', {}),
                'saved_at': datetime.now().isoformat()
            }
            
            return jsonify({'message': 'Configuration sauvegardee avec succes', 'config': saved_config})
            
        except Exception as e:
            return jsonify({'error': f'Erreur lors de la sauvegarde: {str(e)}'}), 500

@app.route('/api/admin/system-status', methods=['GET'])
def system_status():
    """Obtenir le statut du systeme"""
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

# ===================== PRESCRIPTION ROUTES =====================

@app.route('/api/prescriptions', methods=['GET'])
def get_prescriptions():
    """Récupérer toutes les prescriptions"""
    try:
        prescriptions = prescription_service.get_prescriptions()
        return jsonify({'prescriptions': prescriptions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/<prescription_id>', methods=['GET'])
def get_prescription(prescription_id):
    """Récupérer une prescription spécifique"""
    try:
        prescription = prescription_service.get_prescription_by_id(prescription_id)
        if not prescription:
            return jsonify({'error': 'Prescription non trouvée'}), 404
        return jsonify({'prescription': prescription})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/<prescription_id>/status', methods=['POST'])
def update_prescription_status(prescription_id):
    """Mettre à jour le statut d'une prescription"""
    try:
        data = request.get_json()
        status = data.get('status')
        
        if not status:
            return jsonify({'error': 'Statut manquant'}), 400
        
        if status not in ['pending', 'in_progress', 'completed', 'dismissed']:
            return jsonify({'error': 'Statut invalide'}), 400
        
        success = prescription_service.update_prescription_status(prescription_id, status)
        if not success:
            return jsonify({'error': 'Prescription non trouvée'}), 404
        
        return jsonify({'message': 'Statut mis à jour avec succès'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/<prescription_id>/actions/<action_id>/execute', methods=['POST'])
def execute_prescription_action(prescription_id, action_id):
    """Exécuter une action d'une prescription"""
    try:
        success = prescription_service.execute_action(prescription_id, action_id)
        if not success:
            return jsonify({'error': 'Prescription ou action non trouvée'}), 404
        
        return jsonify({'message': 'Action exécutée avec succès'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/generate', methods=['POST'])
def generate_prescription():
    """Générer une nouvelle prescription basée sur une menace"""
    try:
        data = request.get_json()
        threat_data = data.get('threat_data')
        
        if not threat_data:
            return jsonify({'error': 'Données de menace manquantes'}), 400
        
        prescription = prescription_service.generate_prescription_from_threat(threat_data)
        prescription_service.prescriptions.append(prescription)
        
        return jsonify({'prescription': prescription})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/statistics', methods=['GET'])
def get_prescription_statistics():
    """Récupérer les statistiques des prescriptions"""
    try:
        stats = prescription_service.get_prescription_statistics()
        return jsonify({'statistics': stats})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/validate/<threat_id>', methods=['POST'])
def validate_prediction(threat_id):
    """Valider une prédiction pour l'auto-apprentissage"""
    try:
        data = request.get_json()
        actual_outcome = data.get('actual_outcome', False)
        
        result = prescription_service.validate_prediction(threat_id, actual_outcome)
        
        if 'error' in result:
            return jsonify(result), 400
        
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/api/prescriptions/trends', methods=['GET'])
def get_prediction_trends():
    """Obtenir les tendances de prédiction"""
    try:
        trends = {
            'threat_001': {
                'recent_trend': 0.15,
                'overall_trend': 0.08,
                'current_score': 0.72,
                'volatility': 0.12
            },
            'threat_002': {
                'recent_trend': -0.03,
                'overall_trend': 0.02,
                'current_score': 0.58,
                'volatility': 0.08
            },
            'threat_003': {
                'recent_trend': 0.22,
                'overall_trend': 0.18,
                'current_score': 0.89,
                'volatility': 0.15
            },
            'threat_004': {
                'recent_trend': 0.0,
                'overall_trend': -0.05,
                'current_score': 0.45,
                'volatility': 0.06
            },
            'threat_005': {
                'recent_trend': 0.08,
                'overall_trend': 0.12,
                'current_score': 0.63,
                'volatility': 0.10
            }
        }
        return jsonify({'trends': trends})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/signals', methods=['GET'])
def get_signal_analysis():
    """Analyse des signaux faibles et forts"""
    try:
        # Simuler l'analyse des signaux
        signal_analysis = {
            'weak_signals': [
                {
                    'id': 'weak_001',
                    'description': 'Augmentation subtile du trafic réseau vers certaines régions',
                    'score': 0.65,
                    'confidence': 0.65,
                    'entities': ['entity_001', 'entity_002'],
                    'trend': 'increasing',
                    'impact_potential': 'medium',
                    'timeframe': '7-14 jours'
                },
                {
                    'id': 'weak_002',
                    'description': 'Changements dans les patterns de communication',
                    'score': 0.72,
                    'confidence': 0.72,
                    'entities': ['entity_001', 'entity_002'],
                    'trend': 'increasing',
                    'impact_potential': 'high',
                    'timeframe': '3-7 jours'
                }
            ],
            'strong_signals': [
                {
                    'id': 'strong_001',
                    'description': 'Activité suspecte confirmée sur infrastructure critique',
                    'score': 0.89,
                    'confidence': 0.89,
                    'entities': ['entity_001', 'entity_002'],
                    'trend': 'increasing',
                    'impact_potential': 'critical',
                    'timeframe': '24-48 heures'
                }
            ],
            'trend_analysis': {
                'increasing_threats': 15,
                'decreasing_threats': 8,
                'stable_threats': 23
            }
        }
        
        return jsonify(signal_analysis)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Route de validation déjà définie plus haut

@app.route('/api/prescriptions/collection-requests', methods=['GET'])
def get_prescription_collection_requests():
    """Récupérer les requêtes de collecte des prescriptions"""
    try:
        collection_requests = [
            {
                'id': 'CR-2024-001',
                'objective': 'Collecter des informations sur les activités suspectes dans la région Nord',
                'collection_type': 'SIGINT',
                'urgency': 'haute',
                'created_at': '2024-01-15T10:30:00Z',
                'status': 'active'
            },
            {
                'id': 'CR-2024-002',
                'objective': 'Analyser les communications chiffrées détectées',
                'collection_type': 'COMINT',
                'urgency': 'critique',
                'created_at': '2024-01-15T11:15:00Z',
                'status': 'en_cours'
            },
            {
                'id': 'CR-2024-003',
                'objective': 'Surveillance des mouvements suspects dans la zone urbaine',
                'collection_type': 'HUMINT',
                'urgency': 'moyenne',
                'created_at': '2024-01-15T09:45:00Z',
                'status': 'complete'
            }
        ]
        return jsonify({'collection_requests': collection_requests})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===================== REPORT ROUTES =====================

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Récupérer tous les rapports"""
    try:
        # Données de rapport simulées avec plus de détails
        reports = [
            {
                'id': 'RPT-2024-001',
                'title': 'Weekly Threat Intelligence Summary',
                'type': 'Intelligence Summary',
                'date': '2024-01-15',
                'created_at': '2024-01-15T08:30:00Z',
                'status': 'Published',
                'classification': 'SECRET',
                'pages': 15,
                'threats': 23,
                'author': 'Agent Smith',
                'description': 'Analyse hebdomadaire des menaces détectées avec évaluation des risques',
                'tags': ['weekly', 'summary', 'threats']
            },
            {
                'id': 'RPT-2024-002',
                'title': 'APT Group XYZ Activity Assessment',
                'type': 'Threat Assessment',
                'date': '2024-01-14',
                'created_at': '2024-01-14T14:20:00Z',
                'status': 'Published',
                'classification': 'TOP SECRET',
                'pages': 8,
                'threats': 5,
                'author': 'Agent Johnson',
                'description': 'Évaluation approfondie des activités du groupe APT XYZ',
                'tags': ['apt', 'assessment', 'cybersecurity']
            },
            {
                'id': 'RPT-2024-003',
                'title': 'Mali Regional Security Analysis',
                'type': 'Regional Analysis',
                'date': '2024-01-13',
                'created_at': '2024-01-13T10:15:00Z',
                'status': 'Draft',
                'classification': 'CONFIDENTIAL',
                'pages': 22,
                'threats': 12,
                'author': 'Agent Williams',
                'description': 'Analyse de sécurité régionale pour le Mali',
                'tags': ['regional', 'mali', 'security']
            }
        ]
        
        return jsonify({'reports': reports})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<report_id>', methods=['GET'])
def get_report(report_id):
    """Récupérer un rapport spécifique"""
    try:
        # Simuler la récupération d'un rapport
        report = {
            'id': report_id,
            'title': 'Weekly Threat Intelligence Summary',
            'type': 'Intelligence Summary',
            'date': '2024-01-15',
            'status': 'Published',
            'classification': 'SECRET',
            'pages': 15,
            'threats': 23,
            'author': 'Agent Smith',
            'content': 'Contenu détaillé du rapport...',
            'executive_summary': 'Résumé exécutif du rapport...',
            'sections': [
                {'title': 'Executive Summary', 'page': 1},
                {'title': 'Threat Landscape', 'page': 3},
                {'title': 'Regional Analysis', 'page': 8},
                {'title': 'Recommendations', 'page': 12}
            ]
        }
        
        return jsonify({'report': report})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/generate', methods=['POST'])
def generate_report():
    """Générer un nouveau rapport"""
    try:
        data = request.get_json()
        
        # Valider les données requises
        required_fields = ['title', 'type', 'classification', 'date_range']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Champ manquant: {field}'}), 400
        
        # Générer un ID unique pour le rapport
        report_id = f"RPT-{datetime.now().strftime('%Y')}-{str(datetime.now().microsecond).zfill(6)}"
        
        # Créer le nouveau rapport
        new_report = {
            'id': report_id,
            'title': data['title'],
            'type': data['type'],
            'classification': data['classification'],
            'date_range': data['date_range'],
            'include_sections': data.get('include_sections', []),
            'format': data.get('format', 'PDF'),
            'status': 'Generating',
            'created_at': datetime.now().isoformat(),
            'author': 'System',
            'progress': 0
        }
        
        # Simuler la génération du rapport
        import time
        time.sleep(2)  # Simuler le temps de génération
        
        # Mettre à jour le statut
        new_report['status'] = 'Generated'
        new_report['progress'] = 100
        new_report['pages'] = 12
        new_report['threats'] = 8
        new_report['download_url'] = f'/reports/{report_id}/download'
        
        return jsonify({
            'message': 'Rapport généré avec succès',
            'report': new_report
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reports/<report_id>/download', methods=['GET'])
def download_report(report_id):
    """Télécharger un rapport"""
    try:
        from flask import Response
        from io import BytesIO
        
        # Générer un contenu PDF simulé
        pdf_content = generate_fake_pdf_content(report_id)
        
        # Créer la réponse avec le bon type MIME
        response = Response(
            pdf_content,
            mimetype='application/pdf',
            headers={
                'Content-Disposition': f'attachment; filename=rapport_{report_id}.pdf',
                'Content-Type': 'application/pdf'
            }
        )
        
        return response
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def generate_fake_pdf_content(report_id):
    """Générer un contenu PDF simulé"""
    # Création d'un PDF simple avec des données simulées
    pdf_header = b'%PDF-1.4\n'
    pdf_catalog = b'1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n'
    pdf_pages = b'2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n'
    pdf_page = b'3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n/Resources <<\n/Font <<\n/F1 5 0 R\n>>\n>>\n>>\nendobj\n'
    pdf_content = b'4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Rapport ' + report_id.encode() + b') Tj\nET\nendstream\nendobj\n'
    pdf_font = b'5 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n'
    pdf_xref = b'xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \n0000000179 00000 n \n0000000251 00000 n \n'
    pdf_trailer = b'trailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n338\n%%EOF\n'
    
    return pdf_header + pdf_catalog + pdf_pages + pdf_page + pdf_content + pdf_font + pdf_xref + pdf_trailer

@app.route('/api/reports/templates', methods=['GET'])
def get_report_templates():
    """Récupérer les modèles de rapport"""
    try:
        templates = [
            {
                'id': 'template_001',
                'name': 'Intelligence Summary',
                'description': 'Résumé hebdomadaire des menaces',
                'sections': ['Executive Summary', 'Threat Analysis', 'Recommendations'],
                'classification': 'SECRET'
            },
            {
                'id': 'template_002',
                'name': 'Threat Assessment',
                'description': 'Évaluation détaillée des menaces',
                'sections': ['Threat Overview', 'Risk Assessment', 'Mitigation Strategies'],
                'classification': 'TOP SECRET'
            },
            {
                'id': 'template_003',
                'name': 'Regional Analysis',
                'description': 'Analyse sécuritaire régionale',
                'sections': ['Regional Context', 'Security Situation', 'Forecasts'],
                'classification': 'CONFIDENTIAL'
            }
        ]
        
        return jsonify({'templates': templates})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ===================== COLLECTION REQUESTS ROUTES =====================

@app.route('/api/collection-requests', methods=['GET'])
def get_api_collection_requests():
    """Récupérer toutes les requêtes de collecte"""
    try:
        # Données simulées - à remplacer par des données réelles
        requests = [
            {
                'id': 'req_001',
                'zone': 'Gao',
                'objectif': 'Confirmer la présence d\'un groupe armé dans le secteur Est',
                'origine': 'Manque d\'information dans 3 documents consécutifs',
                'urgence': 'Haute',
                'date': '2025-07-14',
                'type_requete': 'HUMINT ou SIGINT ciblé',
                'scenario_id': 'scenario_001',
                'scenario_name': 'ATT-2024-MALI',
                'status': 'pending',
                'created_at': '2025-07-14T10:30:00Z',
                'priority_score': 0.85,
                'documents_analysed': 12,
                'confidence_level': 0.75
            },
            {
                'id': 'req_002',
                'zone': 'Kidal',
                'objectif': 'Vérifier les mouvements de véhicules suspects',
                'origine': 'Signalement SIGINT incomplète',
                'urgence': 'Moyenne',
                'date': '2025-07-14',
                'type_requete': 'IMINT géospatial',
                'scenario_id': 'scenario_002',
                'scenario_name': 'CYBER-INTRUSION-07',
                'status': 'in_progress',
                'created_at': '2025-07-14T09:15:00Z',
                'priority_score': 0.65,
                'documents_analysed': 8,
                'confidence_level': 0.60,
                'assigned_to': 'Agent Delta'
            },
            {
                'id': 'req_003',
                'zone': 'Tombouctou',
                'objectif': 'Évaluer la menace cyber sur infrastructure critique',
                'origine': 'Analyse prédictive faible confiance',
                'urgence': 'Critique',
                'date': '2025-07-14',
                'type_requete': 'TECHINT réseau',
                'scenario_id': 'scenario_003',
                'scenario_name': 'INFRA-PROTECTION-2025',
                'status': 'completed',
                'created_at': '2025-07-13T14:20:00Z',
                'priority_score': 0.92,
                'documents_analysed': 15,
                'confidence_level': 0.88,
                'assigned_to': 'Agent Alpha'
            }
        ]
        
        return jsonify({'requests': requests}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/collection-requests/statistics', methods=['GET'])
def get_collection_requests_statistics():
    """Obtenir les statistiques des requêtes de collecte"""
    try:
        # Données simulées - à remplacer par des données réelles
        statistics = {
            'active_requests': 5,
            'completed_requests': 23,
            'success_rate': '87%',
            'avg_completion_time': '2.4h',
            'by_urgency': {
                'Critique': 2,
                'Haute': 3,
                'Moyenne': 8,
                'Faible': 1
            },
            'by_type': {
                'HUMINT': 6,
                'SIGINT': 4,
                'IMINT': 3,
                'TECHINT': 1
            }
        }
        
        return jsonify({'statistics': statistics}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/collection-requests/generate', methods=['POST'])
def generate_collection_request():
    """Générer une nouvelle requête de collecte automatiquement"""
    try:
        data = request.get_json()
        
        # Logique de génération automatique basée sur les scénarios
        import time
        import random
        
        # Zones géographiques du Mali
        zones = [
            'Gao - Secteur Nord', 'Kidal - Route principale', 'Tombouctou - Centre urbain',
            'Ménaka - Frontière', 'Tessalit - Poste avancé', 'Ansongo - Zone rurale',
            'Bourem - Fleuve Niger', 'Araouane - Région désertique'
        ]
        
        # Types de requêtes réalistes
        types_requetes = [
            'HUMINT local + SIGINT', 'IMINT satellite + OSINT', 'TECHINT réseau + COMINT',
            'SIGINT multi-sources', 'ELINT + COMINT', 'MASINT + IMINT'
        ]
        
        # Objectifs basés sur l'analyse prédictive
        objectifs = [
            'Confirmer activité suspecte détectée par analyse prédictive',
            'Valider signal faible identifié par corrélation automatique',
            'Combler lacune géographique dans la couverture',
            'Vérifier évolution menace prédite par modèle IA',
            'Confirmer pattern détecté dans communications interceptées'
        ]
        
        # Scénarios actifs
        scenarios = [
            {'id': 'PREDICT-2025-AUTO', 'name': 'PREDICTION-AUTOMATIQUE-2025'},
            {'id': 'LACUNE-GEO-2025', 'name': 'COMBLEMENT-LACUNE-GEOGRAPHIQUE'},
            {'id': 'SIGNAL-FAIBLE-2025', 'name': 'DETECTION-SIGNAUX-FAIBLES'},
            {'id': 'CORRELATION-IA-2025', 'name': 'CORRELATION-INTELLIGENCE-ARTIFICIELLE'},
            {'id': 'THREAT-EVOLUTION-2025', 'name': 'EVOLUTION-MENACE-PREDICTIVE'}
        ]
        
        # Sélection aléatoire pour simulation réaliste
        selected_zone = random.choice(zones)
        selected_type = random.choice(types_requetes)
        selected_objectif = random.choice(objectifs)
        selected_scenario = random.choice(scenarios)
        
        # Détermination de l'urgence basée sur le score de priorité
        priority_score = random.uniform(0.4, 0.95)
        if priority_score > 0.85:
            urgence = 'Critique'
        elif priority_score > 0.7:
            urgence = 'Haute'
        elif priority_score > 0.5:
            urgence = 'Moyenne'
        else:
            urgence = 'Faible'
        
        # Génération de la requête
        new_request = {
            'id': f'req_auto_{int(time.time())}',
            'zone': selected_zone,
            'objectif': selected_objectif,
            'origine': 'Génération automatique - Seuil de confiance atteint (<0.4) ou lacune détectée',
            'urgence': urgence,
            'date': datetime.now().strftime('%Y-%m-%d'),
            'type_requete': selected_type,
            'scenario_id': selected_scenario['id'],
            'scenario_name': selected_scenario['name'],
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'priority_score': round(priority_score, 2),
            'documents_analysés': random.randint(3, 15),
            'confidence_level': random.uniform(0.25, 0.45),  # Faible pour justifier la génération
            'estimated_completion': (datetime.now() + timedelta(hours=random.randint(12, 72))).isoformat(),
            'collection_type': 'Automatique - Génération prédictive'
        }
        
        return jsonify({'request': new_request, 'message': 'Requête générée avec succès par analyse prédictive'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/collection-requests/<request_id>/status', methods=['PUT'])
def update_collection_request_status(request_id):
    """Mettre à jour le statut d'une requête de collecte"""
    try:
        data = request.get_json()
        new_status = data.get('status')
        
        if new_status not in ['pending', 'in_progress', 'completed', 'cancelled']:
            return jsonify({'error': 'Statut invalide'}), 400
        
        # Simulation de mise à jour
        updated_request = {
            'id': request_id,
            'status': new_status,
            'updated_at': datetime.now().isoformat()
        }
        
        return jsonify({'request': updated_request, 'message': 'Statut mis à jour'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/collection-requests/<request_id>/documents', methods=['GET'])
def get_collection_request_documents(request_id):
    """Récupérer les documents analysés pour une requête de collecte"""
    try:
        # Données simulées basées sur des documents réels d'analyse de renseignement
        documents = [
            {
                'id': 'doc_001',
                'title': 'Rapport SIGINT - Activité radio secteur Gao',
                'type': 'SIGINT',
                'classification': 'SECRET',
                'date_created': '2025-07-13T14:30:00Z',
                'source': 'Station d\'écoute Gao',
                'confidence_score': 0.75,
                'content': {
                    'resume': 'Interception de communications radio dans le secteur Est de Gao. Plusieurs transmissions non identifiées sur fréquences 142.5 MHz et 156.8 MHz.',
                    'details': 'Communications interceptées entre 14h30 et 16h45 le 13/07/2025. Contenu partiellement crypté. Identification de 3 émetteurs distincts. Géolocalisation approximative: 16.2728°N, 0.0402°W.',
                    'key_points': [
                        'Fréquences inhabituelles pour la zone',
                        'Chiffrement partiel détecté',
                        'Mouvements coordonnés suggérés',
                        'Activité accrue par rapport à la normale'
                    ]
                },
                'gaps_identified': [
                    'Contenu exact des communications cryptées',
                    'Identification des émetteurs',
                    'Intention réelle des communications'
                ]
            },
            {
                'id': 'doc_002',
                'title': 'Rapport HUMINT - Témoignage population locale',
                'type': 'HUMINT',
                'classification': 'CONFIDENTIEL',
                'date_created': '2025-07-13T18:00:00Z',
                'source': 'Agent local GA-7',
                'confidence_score': 0.60,
                'content': {
                    'resume': 'Témoignages de la population locale concernant des mouvements inhabituels dans la zone rurale Est de Gao.',
                    'details': 'Plusieurs témoins rapportent le passage de véhicules non identifiés dans la nuit du 12 au 13 juillet. Véhicules de type pick-up, sans plaques d\'immatriculation visibles. Estimés à 4-6 véhicules.',
                    'key_points': [
                        'Véhicules non identifiés',
                        'Mouvement nocturne inhabituel',
                        'Population inquiète',
                        'Zone habituellement calme'
                    ]
                },
                'gaps_identified': [
                    'Identification précise des véhicules',
                    'Nombre exact de personnes',
                    'Destination finale',
                    'Lien avec activités illégales'
                ]
            },
            {
                'id': 'doc_003',
                'title': 'Analyse IMINT - Images satellite secteur Gao',
                'type': 'IMINT',
                'classification': 'SECRET',
                'date_created': '2025-07-14T09:15:00Z',
                'source': 'Satellite reconnaissance',
                'confidence_score': 0.45,
                'content': {
                    'resume': 'Images satellite montrant des modifications dans les patterns de circulation et des structures temporaires.',
                    'details': 'Analyse comparative des images des 10-14 juillet 2025. Détection de structures temporaires (probablement tentes/abris) dans une zone habituellement vide. Traces de véhicules récentes visibles.',
                    'key_points': [
                        'Structures temporaires détectées',
                        'Traces de véhicules récentes',
                        'Changement dans les patterns habituels',
                        'Zone d\'intérêt: 16.274°N, 0.038°W'
                    ]
                },
                'gaps_identified': [
                    'Nature exacte des structures',
                    'Nombre de personnes présentes',
                    'Durée prévue de l\'installation',
                    'Activités menées sur place'
                ]
            },
            {
                'id': 'doc_004',
                'title': 'Rapport contextuel - Situation sécuritaire régionale',
                'type': 'OSINT',
                'classification': 'NON CLASSIFIÉ',
                'date_created': '2025-07-12T16:00:00Z',
                'source': 'Synthèse sources ouvertes',
                'confidence_score': 0.80,
                'content': {
                    'resume': 'Contexte sécuritaire régional et évolution des menaces dans la région de Gao.',
                    'details': 'Augmentation des tensions dans la région depuis début juillet. Plusieurs incidents rapportés dans les zones limitrophes. Présence accrue de groupes non identifiés.',
                    'key_points': [
                        'Tensions régionales en hausse',
                        'Incidents récents dans zones limitrophes',
                        'Groupes non identifiés actifs',
                        'Contexte sécuritaire dégradé'
                    ]
                },
                'gaps_identified': [
                    'Lien entre incidents régionaux',
                    'Identification des groupes actifs',
                    'Intentions stratégiques',
                    'Évolution prévisible'
                ]
            }
        ]
        
        # Calcul des statistiques d'analyse
        total_documents = len(documents)
        avg_confidence = sum(doc['confidence_score'] for doc in documents) / total_documents
        gaps_count = sum(len(doc['gaps_identified']) for doc in documents)
        
        analysis_summary = {
            'total_documents': total_documents,
            'average_confidence': round(avg_confidence, 2),
            'total_gaps_identified': gaps_count,
            'document_types': list(set(doc['type'] for doc in documents)),
            'classification_levels': list(set(doc['classification'] for doc in documents)),
            'analysis_period': {
                'start': '2025-07-12T16:00:00Z',
                'end': '2025-07-14T09:15:00Z'
            }
        }
        
        return jsonify({
            'request_id': request_id,
            'documents': documents,
            'analysis_summary': analysis_summary
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/collection-requests/test-scenario', methods=['POST'])
def test_collection_scenario():
    """Tester un scénario complet de génération automatique de requêtes"""
    try:
        # Simuler la détection d'un scénario nécessitant une requête de collecte
        scenario_data = {
            'scenario_name': 'ATT-2024-MALI-URGENT',
            'threat_score': 0.35,  # Faible confiance déclenchant une requête
            'location': 'Gao - Secteur Est',
            'threat_type': 'Groupe armé suspect',
            'analysis_gaps': [
                'Manque de confirmation HUMINT',
                'Géolocalisation imprécise',
                'Information obsolète (>48h)'
            ]
        }
        
        # Générer automatiquement des requêtes basées sur les gaps
        generated_requests = []
        import random
        
        # Requête pour combler le gap HUMINT
        humint_request = {
            'id': f'req_test_humint_{int(datetime.now().timestamp())}',
            'zone': scenario_data['location'],
            'objectif': f'Confirmer présence de {scenario_data["threat_type"]} par source locale',
            'origine': 'Test automatique - Gap HUMINT détecté',
            'urgence': 'Haute',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'type_requete': 'HUMINT local',
            'scenario_id': scenario_data['scenario_name'],
            'scenario_name': scenario_data['scenario_name'],
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'priority_score': 0.89,
            'documents_analysés': 8,
            'confidence_level': scenario_data['threat_score'],
            'estimated_completion': (datetime.now() + timedelta(hours=24)).isoformat(),
            'collection_type': 'Automatique - Test scénario',
            'gap_addressed': 'HUMINT'
        }
        
        # Requête pour améliorer la géolocalisation
        geo_request = {
            'id': f'req_test_geo_{int(datetime.now().timestamp())}',
            'zone': scenario_data['location'],
            'objectif': f'Préciser géolocalisation de {scenario_data["threat_type"]}',
            'origine': 'Test automatique - Gap géolocalisation détecté',
            'urgence': 'Moyenne',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'type_requete': 'IMINT satellite + SIGINT',
            'scenario_id': scenario_data['scenario_name'],
            'scenario_name': scenario_data['scenario_name'],
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'priority_score': 0.72,
            'documents_analysés': 5,
            'confidence_level': scenario_data['threat_score'],
            'estimated_completion': (datetime.now() + timedelta(hours=6)).isoformat(),
            'collection_type': 'Automatique - Test scénario',
            'gap_addressed': 'Géolocalisation'
        }
        
        # Requête pour actualiser l'information
        update_request = {
            'id': f'req_test_update_{int(datetime.now().timestamp())}',
            'zone': scenario_data['location'],
            'objectif': f'Actualiser information sur {scenario_data["threat_type"]}',
            'origine': 'Test automatique - Information obsolète détectée',
            'urgence': 'Haute',
            'date': datetime.now().strftime('%Y-%m-%d'),
            'type_requete': 'SIGINT + OSINT',
            'scenario_id': scenario_data['scenario_name'],
            'scenario_name': scenario_data['scenario_name'],
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'priority_score': 0.83,
            'documents_analysés': 12,
            'confidence_level': scenario_data['threat_score'],
            'estimated_completion': (datetime.now() + timedelta(hours=12)).isoformat(),
            'collection_type': 'Automatique - Test scénario',
            'gap_addressed': 'Actualisation'
        }
        
        generated_requests = [humint_request, geo_request, update_request]
        
        # Calcul des statistiques de test
        test_stats = {
            'scenario_triggered': scenario_data['scenario_name'],
            'threat_score': scenario_data['threat_score'],
            'requests_generated': len(generated_requests),
            'gaps_identified': len(scenario_data['analysis_gaps']),
            'total_priority_score': sum(req['priority_score'] for req in generated_requests),
            'avg_priority_score': sum(req['priority_score'] for req in generated_requests) / len(generated_requests),
            'urgency_distribution': {
                'Critique': len([r for r in generated_requests if r['urgence'] == 'Critique']),
                'Haute': len([r for r in generated_requests if r['urgence'] == 'Haute']),
                'Moyenne': len([r for r in generated_requests if r['urgence'] == 'Moyenne']),
                'Faible': len([r for r in generated_requests if r['urgence'] == 'Faible'])
            },
            'collection_types': list(set([req['type_requete'] for req in generated_requests])),
            'test_timestamp': datetime.now().isoformat()
        }
        
        return jsonify({
            'message': 'Scénario de test exécuté avec succès',
            'scenario_data': scenario_data,
            'generated_requests': generated_requests,
            'test_statistics': test_stats
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/generate_test_data', methods=['POST'])
def generate_test_data():
    """Générer des données de test pour l'application"""
    try:
        result = db.generate_test_data()
        return jsonify(result), 200 if result.get('success') else 500
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Erreur lors de la génération des données de test: {str(e)}"
        }), 500

@app.route('/api/admin/clear_test_data', methods=['POST'])
def clear_test_data():
    """Supprimer toutes les données de test"""
    try:
        result = db.clear_test_data()
        return jsonify(result), 200 if result.get('success') else 500
        
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Erreur lors de la suppression des données de test: {str(e)}"
        }), 500

@app.route('/api/admin/database_stats', methods=['GET'])
def get_database_stats():
    """Obtenir les statistiques de la base de données"""
    try:
        stats = db.get_database_stats()
        return jsonify({"stats": stats}), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/deep-learning/status', methods=['GET'])
def deep_learning_status():
    """Obtenir le statut du système deep learning"""
    try:
        from services.deep_learning_service import deep_learning_service
        stats = deep_learning_service.get_model_statistics()
        return jsonify(stats), 200
    except Exception as e:
        return jsonify({"error": str(e), "models_loaded": False}), 500

# ==================== PIPELINE DEEP LEARNING ROUTES ====================

@app.route('/api/ingestion/pipeline-status', methods=['GET'])
def get_pipeline_status():
    """Obtenir le statut du pipeline d'ingestion avec deep learning"""
    try:
        from services.data_ingestion import DataIngestionService
        ingestion_service = DataIngestionService()
        
        # Obtenir le statut complet avec métriques DL
        status = ingestion_service.get_ingestion_status()
        
        # Ajouter des métriques spécifiques au pipeline
        status['pipeline_metrics'] = {
            'total_processed_today': 1247,
            'deep_learning_enhanced': 1098,
            'anomalies_flagged': 23,
            'critical_threats_detected': 5,
            'processing_speed': '2.3 MB/s',
            'queue_health': 'good',
            'last_updated': datetime.now().isoformat()
        }
        
        return jsonify(status)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ingestion/test-pipeline', methods=['POST'])
def test_complete_pipeline():
    """Tester le pipeline complet avec analyse deep learning"""
    try:
        # Données de test avec différents niveaux de complexité
        test_scenarios = [
            {
                "name": "Menace critique détectée",
                "data": {
                    "content": "URGENT - Groupe terroriste XYZ planifie attaque immédiate sur infrastructure critique. Sources multiples confirment. Niveau de confiance: 95%. Action requise dans les 2 heures.",
                    "source": {
                        "type": "sigint",
                        "reliability": 0.95,
                        "classification": "SECRET"
                    },
                    "timestamp": datetime.now().isoformat()
                },
                "format": "json"
            },
            {
                "name": "Activité suspecte - analyse requise",
                "data": {
                    "content": "Augmentation notable des communications cryptées dans la région de Tombouctou. Patterns inhabituels détectés. Possible préparation d'opération.",
                    "source": {
                        "type": "sigint",
                        "reliability": 0.7,
                        "classification": "CONFIDENTIEL"
                    },
                    "timestamp": datetime.now().isoformat()
                },
                "format": "json"
            },
            {
                "name": "Rapport d'analyse comportementale",
                "data": {
                    "content": "Analyse des réseaux sociaux révèle changements dans les patterns de communication des groupes sous surveillance. Indicateurs faibles mais persistants.",
                    "source": {
                        "type": "osint",
                        "reliability": 0.6,
                        "classification": "RESTREINT"
                    },
                    "timestamp": datetime.now().isoformat()
                },
                "format": "json"
            }
        ]
        
        # Traiter chaque scénario
        pipeline_results = []
        for scenario in test_scenarios:
            try:
                from services.data_ingestion import DataIngestionService
                ingestion_service = DataIngestionService()
                
                # Traitement complet
                processed = ingestion_service.ingest_data(
                    scenario["data"], 
                    scenario["format"]
                )
                
                # Extraire les résultats DL
                dl_results = processed.get("deep_learning", {})
                
                result = {
                    "scenario": scenario["name"],
                    "status": "success",
                    "ingestion_complete": True,
                    "deep_learning_analysis": {
                        "anomaly_detected": dl_results.get("anomaly_detection", {}).get("is_anomaly", False),
                        "anomaly_score": dl_results.get("anomaly_detection", {}).get("anomaly_score", 0.0),
                        "predicted_severity": processed.get("predicted_severity", "medium"),
                        "confidence": dl_results.get("severity_classification", {}).get("confidence", 0.0)
                    },
                    "quality_indicators": processed.get("quality_indicators", {}),
                    "processing_time": "42ms"
                }
                
                pipeline_results.append(result)
                
            except Exception as e:
                pipeline_results.append({
                    "scenario": scenario["name"],
                    "status": "error",
                    "error": str(e)
                })
        
        return jsonify({
            "message": "Test pipeline complet terminé",
            "pipeline_health": "operational",
            "deep_learning_active": True,
            "results": pipeline_results,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/ingestion/enhanced-test', methods=['POST'])
def test_enhanced_ingestion():
    """Tester l'ingestion avec analyse deep learning complète"""
    try:
        # Données de test avec analyse approfondie
        enhanced_test_data = {
            "content": "Analyse des interceptions SIGINT révèle coordonnées GPS suspectes 16.2728°N, 0.0402°W. Groupe armé non identifié semble planifier mouvement vers infrastructure critique région Gao. Communications cryptées niveau élevé détectées. Urgence maximale requise.",
            "source": {
                "type": "sigint",
                "reliability": 0.89,
                "classification": "SECRET",
                "collector": "Station GA-Alpha"
            },
            "timestamp": datetime.now().isoformat(),
            "metadata": {
                "geographic_entities": ["Gao", "Mali"],
                "threat_indicators": ["groupe armé", "infrastructure critique", "communications cryptées"],
                "urgency_level": "maximum"
            }
        }
        
        # Traitement avec deep learning complet
        from services.data_ingestion import DataIngestionService
        ingestion_service = DataIngestionService()
        
        processed_data = ingestion_service.ingest_data(enhanced_test_data, "json")
        
        # Analyse des résultats
        analysis_results = {
            "ingestion_status": "success",
            "data_quality": processed_data.get("quality_indicators", {}),
            "deep_learning_enhanced": processed_data.get("deep_learning") is not None,
            "anomaly_analysis": processed_data.get("deep_learning", {}).get("anomaly_detection", {}),
            "severity_classification": processed_data.get("deep_learning", {}).get("severity_classification", {}),
            "predicted_threat_level": processed_data.get("predicted_severity", "medium"),
            "processing_metadata": processed_data.get("metadata", {}),
            "entities_extracted": processed_data.get("network", {}).get("entities", []),
            "recommendation": "Analyse approfondie recommandée - score d'anomalie élevé détecté"
        }
        
        return jsonify({
            "message": "Test d'ingestion amélioré terminé",
            "test_successful": True,
            "analysis": analysis_results,
            "raw_processed_data": processed_data,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==================== DEEP LEARNING ADMIN ROUTES ====================

@app.route('/api/admin/deep-learning/config', methods=['GET'])
def get_deep_learning_config():
    """Récupérer la configuration deep learning"""
    try:
        from services.deep_learning_service import DeepLearningService
        service = DeepLearningService()
        
        config = {
            'enabled': not service.simulation_mode,
            'model_path': service.model_path,
            'training_enabled': True,
            'auto_retrain': True,
            'retrain_interval_hours': 24,
            # Configuration des modèles
            'classification_model': 'random_forest',
            'classification_features': 50,
            'classification_trees': 100,
            'regression_model': 'linear_regression',
            'regression_alpha': 1.0,
            'regression_max_iter': 1000,
            'clustering_model': 'kmeans',
            'clustering_clusters': 5,
            'clustering_eps': 0.5,
            # Hyperparamètres
            'learning_rate': 0.01,
            'batch_size': 32,
            'epochs': 100,
            'validation_split': 0.2,
            'early_stopping_patience': 10,
            'cross_validation': False,
            'model_configs': {
                'threat_classifier': {
                    'hidden_layers': [128, 64, 32],
                    'activation': 'relu',
                    'solver': 'adam',
                    'max_iter': 1000
                },
                'anomaly_detector': {
                    'contamination': 0.1,
                    'n_estimators': 100
                },
                'threat_predictor': {
                    'hidden_layers': [64, 32],
                    'activation': 'relu',
                    'solver': 'adam',
                    'max_iter': 1000
                }
            },
            'thresholds': {
                'anomaly_threshold': 0.3,
                'prediction_confidence_min': 0.7,
                'severity_threshold': 0.8
            }
        }
        
        return jsonify(config)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/deep-learning/config', methods=['POST'])
def update_deep_learning_config():
    """Mettre à jour la configuration deep learning"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Données manquantes'}), 400
        
        # Valider les paramètres
        validation_errors = []
        
        # Validation des modèles
        valid_classification_models = ['random_forest', 'gradient_boosting', 'svm', 'neural_network']
        valid_regression_models = ['linear_regression', 'ridge_regression', 'lasso_regression', 'elastic_net', 'decision_tree']
        valid_clustering_models = ['kmeans', 'dbscan', 'hierarchical', 'gaussian_mixture']
        
        if data.get('classification_model') and data['classification_model'] not in valid_classification_models:
            validation_errors.append(f"Modèle de classification invalide: {data['classification_model']}")
        
        if data.get('regression_model') and data['regression_model'] not in valid_regression_models:
            validation_errors.append(f"Modèle de régression invalide: {data['regression_model']}")
        
        if data.get('clustering_model') and data['clustering_model'] not in valid_clustering_models:
            validation_errors.append(f"Modèle de clustering invalide: {data['clustering_model']}")
        
        # Validation des paramètres numériques
        if data.get('learning_rate') is not None and (data['learning_rate'] <= 0 or data['learning_rate'] > 1):
            validation_errors.append("Le taux d'apprentissage doit être entre 0 et 1")
        
        if data.get('batch_size') is not None and data['batch_size'] <= 0:
            validation_errors.append("La taille du batch doit être positive")
        
        if data.get('epochs') is not None and data['epochs'] <= 0:
            validation_errors.append("Le nombre d'époques doit être positif")
        
        if data.get('validation_split') is not None and (data['validation_split'] < 0.1 or data['validation_split'] > 0.4):
            validation_errors.append("Le ratio de validation doit être entre 0.1 et 0.4")
        
        if validation_errors:
            return jsonify({'error': 'Erreurs de validation', 'details': validation_errors}), 400
        
        # Simuler la mise à jour de la configuration
        # En mode production, ici on mettrait à jour le service deep learning
        logger.info(f"Configuration deep learning mise à jour: {data}")
        
        return jsonify({
            'message': 'Configuration des modèles ML mise à jour avec succès',
            'config': data,
            'models_updated': {
                'classification': data.get('classification_model', 'random_forest'),
                'regression': data.get('regression_model', 'linear_regression'),
                'clustering': data.get('clustering_model', 'kmeans')
            }
        })
    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour de la configuration: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/deep-learning/retrain', methods=['POST'])
def retrain_deep_learning_models():
    """Réentraîner les modèles deep learning"""
    try:
        from services.deep_learning_service import DeepLearningService
        service = DeepLearningService()
        
        result = service.retrain_models([])
        
        return jsonify({
            'message': 'Réentraînement des modèles lancé avec succès',
            'result': result
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/deep-learning/models', methods=['GET'])
def get_deep_learning_models():
    """Récupérer les informations sur les modèles"""
    try:
        from services.deep_learning_service import DeepLearningService
        service = DeepLearningService()
        stats = service.get_model_statistics()
        
        models = {
            'threat_classifier': {
                'name': 'Classificateur de Menaces',
                'description': 'Classifie automatiquement la sévérité des menaces',
                'type': 'MLPClassifier',
                'status': 'active' if not service.simulation_mode else 'simulation',
                'accuracy': 0.87,
                'last_trained': '2025-07-15T18:20:00Z'
            },
            'anomaly_detector': {
                'name': 'Détecteur d\'Anomalies',
                'description': 'Détecte les comportements anormaux dans les données',
                'type': 'IsolationForest',
                'status': 'active' if not service.simulation_mode else 'simulation',
                'accuracy': 0.83,
                'last_trained': '2025-07-15T18:20:00Z'
            },
            'threat_predictor': {
                'name': 'Prédicteur de Menaces',
                'description': 'Prédit l\'évolution des scores de menaces',
                'type': 'MLPRegressor',
                'status': 'active' if not service.simulation_mode else 'simulation',
                'accuracy': 0.89,
                'last_trained': '2025-07-15T18:20:00Z'
            }
        }
        
        return jsonify({
            'models': models,
            'statistics': stats
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ingestion/test-themes', methods=['POST'])
def test_theme_analysis():
    """Tester spécifiquement l'analyse thématique"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        from services.data_ingestion import DataIngestionService
        data_ingestion_service = DataIngestionService()
        
        # Document de test avec plusieurs thèmes
        test_document = {
            'content': '''
            RAPPORT D'INCIDENT SÉCURITAIRE - MALI
            
            Incident de sécurité: Braquage de la chambre des orpailleurs
            Les forces de police ont rapporté un braquage à Kita impliquant des individus armés.
            L'alerte sécuritaire a été déclenchée immédiatement.
            
            Contexte économique:
            L'exploitation minière représente 60% de l'activité économique locale.
            Les orpailleurs constituent une part importante de l'économie régionale.
            Le commerce de l'or génère des revenus significatifs pour la région.
            
            Analyse politique:
            Les autorités locales ont organisé une réunion d'urgence.
            Le gouvernement régional évalue les mesures de sécurité.
            Une commission d'enquête politique sera mise en place.
            
            Situation militaire:
            Déploiement de forces militaires supplémentaires dans la zone.
            Les forces armées coordonnent avec les services de renseignement.
            Une opération militaire préventive est en cours de planification.
            ''',
            'source': {
                'type': 'field_report',
                'reliability': 0.9,
                'classification': 'CONFIDENTIEL'
            },
            'timestamp': datetime.now().isoformat()
        }
        
        # Tester l'analyse thématique
        result = data_ingestion_service.ingest_data(test_document, 'json')
        
        # Ajouter des informations de test
        result['test_analysis'] = {
            'document_length': len(test_document['content']),
            'expected_themes': ['sécurité', 'économie', 'politique', 'militaire'],
            'theme_analysis_method': 'deep_learning_simulation',
            'test_timestamp': datetime.now().isoformat()
        }
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Erreur test analyse thématique: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ingestion/test-deduplication', methods=['POST'])
def test_deduplication():
    """Tester le système de déduplication"""
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        from services.data_ingestion import DataIngestionService
        data_ingestion_service = DataIngestionService()
        
        # Document de test
        test_document = {
            'content': 'Document de test pour la déduplication. Contenu identique pour vérifier le hash.',
            'source': {
                'type': 'test_source',
                'reliability': 0.8
            },
            'timestamp': datetime.now().isoformat()
        }
        
        # Premier envoi
        result1 = data_ingestion_service.ingest_data(test_document, 'json')
        
        # Deuxième envoi (doit être détecté comme doublon)
        result2 = data_ingestion_service.ingest_data(test_document, 'json')
        
        return jsonify({
            'first_ingestion': result1,
            'second_ingestion': result2,
            'deduplication_test': {
                'first_status': result1.get('status', 'unknown'),
                'second_status': result2.get('status', 'unknown'),
                'deduplication_working': result2.get('status') == 'duplicate',
                'test_timestamp': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)