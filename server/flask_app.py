import os
import logging
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, g
from flask_restful import Api, Resource
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_cors import CORS
from werkzeug.security import check_password_hash, generate_password_hash
import redis
import json

from server.config import Config
from server.services.threat_service import ThreatService
from server.services.data_ingestion import DataIngestionService
from server.services.scenario_service import ScenarioService

# Configure logging
logging.basicConfig(
    level=getattr(logging, Config.LOG_LEVEL),
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Initialize extensions
jwt = JWTManager(app)
api = Api(app)
CORS(app)

# Initialize services
threat_service = ThreatService()
data_ingestion_service = DataIngestionService()
scenario_service = ScenarioService()
redis_client = redis.from_url(Config.REDIS_URL)

# Mock user data (in production, this would be in a database)
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

# Authentication endpoints
class LoginResource(Resource):
    def post(self):
        try:
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
            two_fa_code = data.get('two_fa_code')
            
            if not username or not password:
                return {'message': 'Username and password required'}, 400
            
            user = USERS.get(username)
            if not user or not check_password_hash(user['password'], password):
                return {'message': 'Invalid credentials'}, 401
            
            # Simple 2FA check (in production, use proper 2FA)
            if two_fa_code != '123456':
                return {'message': 'Invalid 2FA code'}, 401
            
            access_token = create_access_token(
                identity=username,
                expires_delta=Config.JWT_ACCESS_TOKEN_EXPIRES
            )
            
            return {
                'access_token': access_token,
                'user': {
                    'username': username,
                    'name': user['name'],
                    'clearance_level': user['clearance_level']
                }
            }, 200
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            return {'message': 'Login failed'}, 500

class UserProfileResource(Resource):
    @jwt_required()
    def get(self):
        try:
            username = get_jwt_identity()
            user = USERS.get(username)
            
            if not user:
                return {'message': 'User not found'}, 404
            
            return {
                'username': username,
                'name': user['name'],
                'clearance_level': user['clearance_level']
            }, 200
            
        except Exception as e:
            logger.error(f"User profile error: {str(e)}")
            return {'message': 'Failed to get user profile'}, 500

# Dashboard endpoints
class DashboardStatsResource(Resource):
    @jwt_required()
    def get(self):
        try:
            stats = threat_service.get_threat_statistics()
            
            # Add additional dashboard stats
            stats.update({
                'data_sources': 17,
                'data_sources_operational': 17,
                'false_positive_rate': 0.062,
                'system_status': 'operational'
            })
            
            return stats, 200
            
        except Exception as e:
            logger.error(f"Dashboard stats error: {str(e)}")
            return {'message': 'Failed to get dashboard stats'}, 500

class RealtimeThreatsResource(Resource):
    @jwt_required()
    def get(self):
        try:
            limit = request.args.get('limit', 20, type=int)
            threats = threat_service.get_realtime_threats(limit)
            
            return {'threats': threats}, 200
            
        except Exception as e:
            logger.error(f"Realtime threats error: {str(e)}")
            return {'message': 'Failed to get realtime threats'}, 500

class ThreatEvolutionResource(Resource):
    @jwt_required()
    def get(self):
        try:
            # Mock threat evolution data for chart
            now = datetime.now()
            timestamps = []
            scores = []
            
            for i in range(24):  # 24 hours
                timestamp = now - timedelta(hours=23-i)
                timestamps.append(timestamp.strftime('%H:%M'))
                
                # Generate realistic threat score progression
                base_score = 0.3 + (i / 24) * 0.57  # From 0.3 to 0.87
                noise = (hash(str(timestamp)) % 100) / 1000  # Small random variation
                score = min(max(base_score + noise, 0), 1)
                scores.append(round(score, 2))
            
            return {
                'labels': timestamps,
                'datasets': [
                    {
                        'label': 'Threat Score',
                        'data': scores,
                        'borderColor': '#FF6B35',
                        'backgroundColor': 'rgba(255, 107, 53, 0.1)',
                        'fill': True,
                        'tension': 0.4
                    },
                    {
                        'label': 'Baseline',
                        'data': [0.5] * 24,
                        'borderColor': '#424242',
                        'backgroundColor': 'transparent',
                        'borderDash': [5, 5],
                        'fill': False
                    }
                ]
            }, 200
            
        except Exception as e:
            logger.error(f"Threat evolution error: {str(e)}")
            return {'message': 'Failed to get threat evolution'}, 500

# Data ingestion endpoints
class DataIngestionResource(Resource):
    @jwt_required()
    def post(self):
        try:
            data = request.get_json()
            format_type = data.get('format', 'json')
            
            # Ingest data with deep learning enhancement
            normalized_data = data_ingestion_service.ingest_data(data, format_type)
            
            # Process for threat scoring with DL integration
            threat_data = threat_service.process_threat_data(normalized_data)
            
            # Evaluate scenarios
            triggered_scenarios = scenario_service.evaluate_scenarios(threat_data)
            
            # Prepare enhanced response
            response = {
                'threat_data': threat_data,
                'triggered_scenarios': triggered_scenarios,
                'ingestion_id': threat_data['id'],
                'deep_learning_analysis': {
                    'anomaly_detected': threat_data.get('deep_learning_analysis', {}).get('anomaly_detection', {}).get('is_anomaly', False),
                    'predicted_severity': threat_data.get('deep_learning_analysis', {}).get('severity_classification', {}).get('predicted_class', 'unknown'),
                    'quality_score': threat_data.get('metadata', {}).get('quality_score', 0.0),
                    'enhanced_score': threat_data.get('score', 0.0),
                    'base_score': threat_data.get('base_score', 0.0)
                }
            }
            
            return response, 201
            
        except Exception as e:
            logger.error(f"Data ingestion error: {str(e)}")
            return {'message': f'Data ingestion failed: {str(e)}'}, 500

class DataIngestionStatusResource(Resource):
    @jwt_required()
    def get(self):
        try:
            status = data_ingestion_service.get_ingestion_status()
            return status, 200
            
        except Exception as e:
            logger.error(f"Ingestion status error: {str(e)}")
            return {'message': 'Failed to get ingestion status'}, 500

# Scenario endpoints
class ScenariosResource(Resource):
    @jwt_required()
    def get(self):
        try:
            scenarios = scenario_service.get_active_scenarios()
            return {'scenarios': scenarios}, 200
            
        except Exception as e:
            logger.error(f"Scenarios error: {str(e)}")
            return {'message': 'Failed to get scenarios'}, 500
    
    @jwt_required()
    def post(self):
        try:
            data = request.get_json()
            scenario = scenario_service.create_scenario(data)
            return {'scenario': scenario}, 201
            
        except Exception as e:
            logger.error(f"Create scenario error: {str(e)}")
            return {'message': f'Failed to create scenario: {str(e)}'}, 500

class ScenarioResource(Resource):
    @jwt_required()
    def get(self, scenario_id):
        try:
            scenario = scenario_service.get_scenario_by_id(scenario_id)
            if not scenario:
                return {'message': 'Scenario not found'}, 404
            
            return {'scenario': scenario}, 200
            
        except Exception as e:
            logger.error(f"Get scenario error: {str(e)}")
            return {'message': 'Failed to get scenario'}, 500
    
    @jwt_required()
    def put(self, scenario_id):
        try:
            data = request.get_json()
            scenario = scenario_service.update_scenario(scenario_id, data)
            return {'scenario': scenario}, 200
            
        except Exception as e:
            logger.error(f"Update scenario error: {str(e)}")
            return {'message': f'Failed to update scenario: {str(e)}'}, 500
    
    @jwt_required()
    def delete(self, scenario_id):
        try:
            success = scenario_service.delete_scenario(scenario_id)
            if success:
                return {'message': 'Scenario deleted successfully'}, 200
            else:
                return {'message': 'Scenario not found'}, 404
                
        except Exception as e:
            logger.error(f"Delete scenario error: {str(e)}")
            return {'message': f'Failed to delete scenario: {str(e)}'}, 500

# Actions endpoints
class ActionsResource(Resource):
    @jwt_required()
    def get(self):
        try:
            # Get recent actions from Redis
            actions_data = redis_client.lrange('actions', 0, 19)  # Get last 20 actions
            actions = []
            
            for action_data in actions_data:
                action = json.loads(action_data)
                action['timestamp'] = action.get('timestamp', datetime.now().isoformat())
                actions.append(action)
            
            return {'actions': actions}, 200
            
        except Exception as e:
            logger.error(f"Actions error: {str(e)}")
            return {'message': 'Failed to get actions'}, 500

# Alerts endpoints
class AlertsResource(Resource):
    @jwt_required()
    def get(self):
        try:
            alerts_data = redis_client.lrange('alerts', 0, 9)  # Get last 10 alerts
            alerts = []
            
            for alert_data in alerts_data:
                alert = json.loads(alert_data)
                alerts.append(alert)
            
            return {'alerts': alerts}, 200
            
        except Exception as e:
            logger.error(f"Alerts error: {str(e)}")
            return {'message': 'Failed to get alerts'}, 500

# Feedback endpoints
class FeedbackResource(Resource):
    @jwt_required()
    def post(self):
        try:
            data = request.get_json()
            threat_id = data.get('threat_id')
            feedback = data.get('feedback')
            context = data.get('context', {})
            
            threat_service.update_threat_feedback(threat_id, feedback, context)
            
            return {'message': 'Feedback submitted successfully'}, 200
            
        except Exception as e:
            logger.error(f"Feedback error: {str(e)}")
            return {'message': 'Failed to submit feedback'}, 500

# Register API endpoints
api.add_resource(LoginResource, '/api/auth/login')
api.add_resource(UserProfileResource, '/api/auth/user')
api.add_resource(DashboardStatsResource, '/api/dashboard/stats')
api.add_resource(RealtimeThreatsResource, '/api/threats/realtime')
api.add_resource(ThreatEvolutionResource, '/api/threats/evolution')
api.add_resource(DataIngestionResource, '/api/ingestion/data')
api.add_resource(DataIngestionStatusResource, '/api/ingestion/status')
api.add_resource(ScenariosResource, '/api/scenarios')
api.add_resource(ScenarioResource, '/api/scenarios/<string:scenario_id>')
api.add_resource(ActionsResource, '/api/actions')
api.add_resource(AlertsResource, '/api/alerts')
api.add_resource(FeedbackResource, '/api/feedback')

# Health check endpoint
@app.route('/api/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.now().isoformat()}

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return {'message': 'Endpoint not found'}, 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return {'message': 'Internal server error'}, 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
