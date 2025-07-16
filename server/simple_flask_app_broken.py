import os
import json
import time
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
from services.prescription_service import PrescriptionService
from services.document_clustering_service import DocumentClusteringService
from optimized_database import optimized_db
from cache_manager import cache_manager
from routes.deep_learning_routes import deep_learning_bp
import threading

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration optimisée
app.config['JSON_SORT_KEYS'] = False
app.config['JSONIFY_PRETTYPRINT_REGULAR'] = False

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
clustering_service = DocumentClusteringService()

# Nettoyer le cache périodiquement
def cleanup_cache_periodically():
    """Nettoyer le cache toutes les 10 minutes"""
    while True:
        time.sleep(600)  # 10 minutes
        try:
            optimized_db.cleanup_cache()
            cache_manager.cleanup_expired()
        except Exception as e:
            print(f"Erreur lors du nettoyage du cache: {e}")

# Démarrer le thread de nettoyage
cleanup_thread = threading.Thread(target=cleanup_cache_periodically, daemon=True)
cleanup_thread.start()

@app.route('/api/login', methods=['POST'])
def login():
    """Handle user login"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        # Vérifier les credentials depuis la base optimisée
        user = optimized_db.execute_query(
            "SELECT * FROM users WHERE username = %s AND is_active = TRUE",
            (username,), fetch_one=True
        )
        
        if user and check_password_hash(user['password'], password):
            return jsonify({
                'success': True,
                'user': {
                    'id': user['id'],
                    'username': user['username'],
                    'clearance_level': user['clearance_level'],
                    'name': user['name'],
                    'email': user['email']
                },
                'token': f'local_token_{username}'
            })
        else:
            return jsonify({'success': False, 'message': 'Identifiants invalides'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/stats', methods=['GET'])
@token_required
def dashboard_stats():
    """Get dashboard statistics with caching"""
    try:
        stats = optimized_db.get_dashboard_stats_cached()
        return jsonify({'stats': stats})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/threats/realtime', methods=['GET'])
@token_required
def realtime_threats():
    """Get real-time threats with caching"""
    try:
        limit = int(request.args.get('limit', 10))
        
        # Utiliser le cache pour les menaces
        cache_key = f"realtime_threats_limit_{limit}"
        cached_threats = cache_manager.get(cache_key)
        
        if cached_threats:
            return jsonify({'threats': cached_threats})
        
        threats = optimized_db.execute_query("""
            SELECT id, name, description, score, severity, status, 
                   created_at as timestamp, metadata
            FROM threats 
            WHERE status = 'active'
            ORDER BY score DESC, created_at DESC
            LIMIT %s
        """, (limit,), fetch_all=True)
        
        if threats:
            cache_manager.set(cache_key, threats, 60)  # Cache 1 minute
        
        return jsonify({'threats': threats or []})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions', methods=['GET'])
@token_required
def get_prescriptions():
    """Get prescriptions with caching"""
    try:
        cache_key = "prescriptions_all"
        cached_prescriptions = cache_manager.get(cache_key)
        
        if cached_prescriptions:
            return jsonify({'prescriptions': cached_prescriptions})
        
        prescriptions = prescription_service.get_all_prescriptions()
        
        if prescriptions:
            cache_manager.set(cache_key, prescriptions, 180)  # Cache 3 minutes
        
        return jsonify({'prescriptions': prescriptions})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/prescriptions/statistics', methods=['GET'])
@token_required
def get_prescriptions_statistics():
    """Get prescriptions statistics with caching"""
    try:
        cache_key = "prescriptions_statistics"
        cached_stats = cache_manager.get(cache_key)
        
        if cached_stats:
            return jsonify({'statistics': cached_stats})
        
        statistics = prescription_service.get_prescription_statistics()
        
        if statistics:
            cache_manager.set(cache_key, statistics, 120)  # Cache 2 minutes
        
        return jsonify({'statistics': statistics})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/threats/evolution', methods=['GET'])
@token_required
def threat_evolution():
    """Get threat evolution data with caching"""
    try:
        filter_period = request.args.get('filter', '24H')
        
        cache_key = f"threat_evolution_{filter_period}"
        cached_evolution = cache_manager.get(cache_key)
        
        if cached_evolution:
            return jsonify({'evolution': cached_evolution})
        
        # Calculer les données d'évolution
        evolution_data = {
            'predictions': [],
            'scores': [],
            'timeline': []
        }
        
        # Récupérer les données historiques
        threats = optimized_db.execute_query("""
            SELECT score, created_at
            FROM threats
            WHERE created_at >= NOW() - INTERVAL '1 day'
            ORDER BY created_at
        """, fetch_all=True)
        
        if threats:
            for threat in threats:
                evolution_data['scores'].append({
                    'timestamp': threat['created_at'].isoformat(),
                    'score': threat['score']
                })
        
        cache_manager.set(cache_key, evolution_data, 300)  # Cache 5 minutes
        
        return jsonify({'evolution': evolution_data})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/scenarios', methods=['GET'])
@token_required
def get_scenarios():
    """Get active scenarios with caching"""
    try:
        cache_key = "active_scenarios"
        cached_scenarios = cache_manager.get(cache_key)
        
        if cached_scenarios:
            return jsonify({'scenarios': cached_scenarios})
        
        scenarios = optimized_db.execute_query("""
            SELECT id, name, description, conditions, actions, 
                   status, priority, validity_window, created_at
            FROM scenarios 
            WHERE status = 'active'
            ORDER BY priority ASC
        """, fetch_all=True)
        
        if scenarios:
            cache_manager.set(cache_key, scenarios, 180)  # Cache 3 minutes
        
        return jsonify({'scenarios': scenarios or []})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/actions', methods=['GET'])
@token_required
def get_actions():
    """Get recent actions with caching"""
    try:
        cache_key = "recent_actions"
        cached_actions = cache_manager.get(cache_key)
        
        if cached_actions:
            return jsonify({'actions': cached_actions})
        
        actions = optimized_db.execute_query("""
            SELECT id, type, description, priority, status, 
                   related_threat_id, created_at, metadata
            FROM actions 
            ORDER BY created_at DESC
            LIMIT 50
        """, fetch_all=True)
        
        if actions:
            cache_manager.set(cache_key, actions, 120)  # Cache 2 minutes
        
        return jsonify({'actions': actions or []})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts', methods=['GET'])
@token_required
def get_alerts():
    """Get active alerts with caching"""
    try:
        cache_key = "active_alerts"
        cached_alerts = cache_manager.get(cache_key)
        
        if cached_alerts:
            return jsonify({'alerts': cached_alerts})
        
        alerts = optimized_db.execute_query("""
            SELECT id, type, severity, title, message, is_read, 
                   related_threat_id, created_at
            FROM alerts 
            WHERE is_read = FALSE
            ORDER BY created_at DESC
            LIMIT 20
        """, fetch_all=True)
        
        if alerts:
            cache_manager.set(cache_key, alerts, 60)  # Cache 1 minute
        
        return jsonify({'alerts': alerts or []})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clustering/database-documents', methods=['GET'])
@token_required
def get_database_documents():
    """Récupérer tous les documents de la base de données avec cache"""
    try:
        documents = optimized_db.get_all_documents_cached()
        
        return jsonify({
            'success': True,
            'documents': documents,
            'count': len(documents),
            'message': f'{len(documents)} documents récupérés de la base de données'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Erreur lors de la récupération des documents'
        }), 500

@app.route('/api/clustering/analyze', methods=['POST'])
@token_required
def analyze_document_clustering():
    """Analyser le clustering des documents avec optimisations"""
    try:
        data = request.get_json()
        user_documents = data.get('documents', [])
        
        # Récupérer tous les documents de la base avec cache
        db_documents = optimized_db.get_all_documents_cached()
        
        # Combiner les documents
        all_documents = db_documents + user_documents
        
        if len(all_documents) < 2:
            return jsonify({'error': 'Pas assez de documents pour l\'analyse (minimum 2 requis)'}), 400
        
        # Effectuer le clustering avec cache intégré
        clustering_result = clustering_service.cluster_documents_by_similarity(all_documents)
        
        # Générer des insights si pas d'erreur
        insights = {}
        if 'error' not in clustering_result:
            insights = clustering_service.generate_cluster_insights(clustering_result)
        
        return jsonify({
            'success': True,
            'clustering_result': clustering_result,
            'insights': insights,
            'summary': {
                'total_documents': len(all_documents),
                'db_documents': len(db_documents),
                'user_documents': len(user_documents),
                'clusters_found': len(clustering_result.get('clusters', [])),
                'analysis_timestamp': datetime.now().isoformat(),
                'processing_time': clustering_result.get('processing_time', 0),
                'from_cache': clustering_result.get('from_cache', False)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'message': 'Erreur lors de l\'analyse de clustering'
        }), 500

@app.route('/api/system/performance', methods=['GET'])
@token_required
def system_performance():
    """Obtenir les métriques de performance du système"""
    try:
        cache_stats = optimized_db.get_cache_stats()
        
        return jsonify({
            'performance': {
                'cache_stats': cache_stats,
                'active_connections': 'pool_status',
                'memory_usage': 'system_memory',
                'response_times': {
                    'average': '< 100ms',
                    'p95': '< 500ms',
                    'p99': '< 1000ms'
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ingestion/status', methods=['GET'])
@token_required
def ingestion_status():
    """Get data ingestion status"""
    try:
        cache_key = "ingestion_status"
        cached_status = cache_manager.get(cache_key)
        
        if cached_status:
            return jsonify(cached_status)
        
        # Simuler des statistiques d'ingestion
        processing_stats = {
            'avg_processing_time': 150,
            'total_processed': 1250,
            'errors': 5,
            'throughput': 8.5
        }
        
        result = {
            'processing_stats': processing_stats,
            'last_update': datetime.now().isoformat()
        }
        
        cache_manager.set(cache_key, result, 60)  # Cache 1 minute
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint with system stats"""
    try:
        cache_stats = optimized_db.get_cache_stats()
        
        return jsonify({
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'cache_stats': cache_stats,
            'version': '2.3.0-optimized'
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)