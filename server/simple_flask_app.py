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
        'name': 'Suspicious Network Activity',
        'score': 0.85,
        'severity': 'high',
        'timestamp': '2024-01-15T10:30:00Z',
        'status': 'active'
    },
    {
        'id': 'threat_002',
        'name': 'Malware Detection',
        'score': 0.92,
        'severity': 'critical',
        'timestamp': '2024-01-15T11:45:00Z',
        'status': 'active'
    },
    {
        'id': 'threat_003',
        'name': 'Unauthorized Access Attempt',
        'score': 0.67,
        'severity': 'medium',
        'timestamp': '2024-01-15T09:15:00Z',
        'status': 'resolved'
    }
]

SAMPLE_SCENARIOS = [
    {
        'id': 'scenario_001',
        'name': 'ATT-2024-MALI',
        'description': 'Regional threat detection for Mali area',
        'conditions': [
            {'type': 'location', 'value': 'Mali'},
            {'type': 'threat_score', 'operator': '>', 'value': 0.7}
        ],
        'actions': [
            {'type': 'SIGINT', 'description': 'Initiate SIGINT collection'},
            {'type': 'HUMINT', 'description': 'Deploy HUMINT assets'}
        ],
        'status': 'active',
        'priority': 1,
        'conditions_met': 2,
        'total_conditions': 2,
        'last_triggered': '2024-01-15T12:00:00Z'
    }
]

@app.route('/api/auth/login', methods=['POST'])
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
                'token': 'mock_jwt_token'
            })
        else:
            return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/dashboard/stats', methods=['GET'])
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

@app.route('/api/threats/realtime', methods=['GET'])
def realtime_threats():
    """Get real-time threats"""
    return jsonify({
        'threats': SAMPLE_THREATS[:10]  # Return first 10 threats
    })

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
    return jsonify({
        'scenarios': SAMPLE_SCENARIOS
    })

@app.route('/api/scenarios/<scenario_id>', methods=['GET'])
def get_scenario(scenario_id):
    """Get specific scenario"""
    scenario = next((s for s in SAMPLE_SCENARIOS if s['id'] == scenario_id), None)
    if scenario:
        return jsonify({'scenario': scenario})
    return jsonify({'error': 'Scenario not found'}), 404

@app.route('/api/ingestion/status', methods=['GET'])
def ingestion_status():
    """Get data ingestion status"""
    return jsonify({
        'sources': [
            {
                'name': 'SIGINT Feed',
                'type': 'stream',
                'status': 'operational',
                'last_updated': '2024-01-15T12:00:00Z',
                'throughput': '1.2K/sec',
                'queue_size': 45
            },
            {
                'name': 'HUMINT Reports',
                'type': 'batch',
                'status': 'operational',
                'last_updated': '2024-01-15T11:30:00Z',
                'throughput': '25/hour'
            },
            {
                'name': 'Open Source Intelligence',
                'type': 'stream',
                'status': 'degraded',
                'last_updated': '2024-01-15T10:15:00Z',
                'throughput': '800/sec',
                'queue_size': 120
            }
        ]
    })

@app.route('/api/actions/recent', methods=['GET'])
def recent_actions():
    """Get recent actions"""
    return jsonify({
        'actions': [
            {
                'id': 'action_001',
                'type': 'SIGINT_COLLECTION',
                'description': 'Initiated SIGINT collection for Mali region',
                'priority': 'high',
                'status': 'in_progress',
                'timestamp': '2024-01-15T11:45:00Z'
            },
            {
                'id': 'action_002',
                'type': 'THREAT_ANALYSIS',
                'description': 'Analyzed malware sample threat_002',
                'priority': 'critical',
                'status': 'completed',
                'timestamp': '2024-01-15T11:30:00Z'
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
                'title': 'High Threat Score Detected',
                'message': 'Threat threat_002 has exceeded critical threshold',
                'timestamp': '2024-01-15T11:45:00Z',
                'threat_id': 'threat_002'
            }
        ]
    })

@app.route('/api/feedback', methods=['POST'])
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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)