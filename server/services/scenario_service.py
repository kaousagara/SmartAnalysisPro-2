import json
import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import redis
from ..config import Config

logger = logging.getLogger(__name__)

class ScenarioService:
    def __init__(self):
        self.redis_client = redis.from_url(Config.REDIS_URL)
        self.scenarios = {}
        self.initialize_default_scenarios()
    
    def initialize_default_scenarios(self):
        """Initialize default scenarios from the document"""
        try:
            default_scenarios = [
                {
                    'id': 'ATT-2024-MALI',
                    'name': 'ATT-2024-MALI',
                    'description': 'Coordination patterns detected in Tombouctou region',
                    'conditions': [
                        {'type': 'score_threshold', 'value': 0.75},
                        {'type': 'entity_present', 'entities': ['Group XYZ', 'Tombouctou']},
                        {'type': 'keywords', 'keywords': ['attaque', 'coordination']}
                    ],
                    'actions': [
                        {'type': 'trigger_collection', 'collection_type': 'SIGINT', 'priority': 1}
                    ],
                    'validity_window': 'P7D',  # 7 days
                    'status': 'active',
                    'priority': 1,
                    'conditions_met': 3,
                    'total_conditions': 3,
                    'last_triggered': datetime.now().isoformat()
                },
                {
                    'id': 'CYBER-INTRUSION-07',
                    'name': 'CYBER-INTRUSION-07',
                    'description': 'Suspicious network activity from known IPs',
                    'conditions': [
                        {'type': 'score_threshold', 'value': 0.60},
                        {'type': 'network_activity', 'threshold': 0.8},
                        {'type': 'ip_reputation', 'status': 'suspicious'}
                    ],
                    'actions': [
                        {'type': 'network_monitoring', 'priority': 2},
                        {'type': 'ip_investigation', 'priority': 2}
                    ],
                    'validity_window': 'P1D',  # 1 day
                    'status': 'partial',
                    'priority': 2,
                    'conditions_met': 2,
                    'total_conditions': 3,
                    'last_triggered': None
                }
            ]
            
            for scenario in default_scenarios:
                self.scenarios[scenario['id']] = scenario
            
            logger.info(f"Initialized {len(default_scenarios)} default scenarios")
            
        except Exception as e:
            logger.error(f"Error initializing default scenarios: {str(e)}")
    
    def evaluate_scenarios(self, threat_data: Dict) -> List[Dict]:
        """Evaluate all scenarios against threat data"""
        try:
            triggered_scenarios = []
            
            for scenario_id, scenario in self.scenarios.items():
                if scenario['status'] == 'inactive':
                    continue
                
                evaluation = self._evaluate_scenario(scenario, threat_data)
                
                if evaluation['triggered']:
                    triggered_scenarios.append({
                        'scenario': scenario,
                        'evaluation': evaluation
                    })
                    
                    # Execute scenario actions
                    self._execute_scenario_actions(scenario, threat_data)
                    
                    # Update scenario status
                    self._update_scenario_status(scenario_id, evaluation)
            
            return triggered_scenarios
            
        except Exception as e:
            logger.error(f"Error evaluating scenarios: {str(e)}")
            return []
    
    def _evaluate_scenario(self, scenario: Dict, threat_data: Dict) -> Dict:
        """Evaluate a single scenario against threat data"""
        try:
            conditions = scenario['conditions']
            conditions_met = 0
            evaluation_details = []
            
            for condition in conditions:
                met = self._evaluate_condition(condition, threat_data)
                if met:
                    conditions_met += 1
                
                evaluation_details.append({
                    'condition': condition,
                    'met': met,
                    'details': self._get_condition_details(condition, threat_data)
                })
            
            total_conditions = len(conditions)
            
            # Determine if scenario is triggered
            triggered = conditions_met == total_conditions
            
            # Update scenario status
            if triggered:
                status = 'active'
            elif conditions_met >= total_conditions * 0.5:  # At least 50% conditions met
                status = 'partial'
            else:
                status = 'inactive'
            
            return {
                'triggered': triggered,
                'status': status,
                'conditions_met': conditions_met,
                'total_conditions': total_conditions,
                'evaluation_details': evaluation_details,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error evaluating scenario: {str(e)}")
            return {'triggered': False, 'status': 'error', 'conditions_met': 0, 'total_conditions': 0}
    
    def _evaluate_condition(self, condition: Dict, threat_data: Dict) -> bool:
        """Evaluate a single condition"""
        try:
            condition_type = condition['type']
            
            if condition_type == 'score_threshold':
                return threat_data.get('score', 0) >= condition['value']
            
            elif condition_type == 'entity_present':
                threat_entities = [entity['text'] for entity in threat_data.get('entities', [])]
                required_entities = condition['entities']
                return any(entity in threat_entities for entity in required_entities)
            
            elif condition_type == 'keywords':
                content = threat_data.get('text', '').lower()
                keywords = condition['keywords']
                return any(keyword.lower() in content for keyword in keywords)
            
            elif condition_type == 'network_activity':
                network_density = threat_data.get('network', {}).get('density', 0)
                return network_density >= condition['threshold']
            
            elif condition_type == 'ip_reputation':
                # Mock IP reputation check
                return threat_data.get('source', {}).get('ip_reputation') == condition['status']
            
            else:
                logger.warning(f"Unknown condition type: {condition_type}")
                return False
                
        except Exception as e:
            logger.error(f"Error evaluating condition: {str(e)}")
            return False
    
    def _get_condition_details(self, condition: Dict, threat_data: Dict) -> Dict:
        """Get detailed information about condition evaluation"""
        try:
            condition_type = condition['type']
            
            if condition_type == 'score_threshold':
                return {
                    'current_score': threat_data.get('score', 0),
                    'threshold': condition['value'],
                    'met': threat_data.get('score', 0) >= condition['value']
                }
            
            elif condition_type == 'entity_present':
                threat_entities = [entity['text'] for entity in threat_data.get('entities', [])]
                return {
                    'required_entities': condition['entities'],
                    'found_entities': threat_entities,
                    'matches': [e for e in condition['entities'] if e in threat_entities]
                }
            
            elif condition_type == 'keywords':
                content = threat_data.get('text', '').lower()
                keywords = condition['keywords']
                return {
                    'required_keywords': keywords,
                    'found_keywords': [k for k in keywords if k.lower() in content]
                }
            
            else:
                return {'type': condition_type, 'details': 'No details available'}
                
        except Exception as e:
            logger.error(f"Error getting condition details: {str(e)}")
            return {'error': str(e)}
    
    def _execute_scenario_actions(self, scenario: Dict, threat_data: Dict):
        """Execute actions when scenario is triggered"""
        try:
            actions = scenario['actions']
            
            for action in actions:
                self._execute_action(action, scenario, threat_data)
            
            logger.info(f"Executed {len(actions)} actions for scenario {scenario['id']}")
            
        except Exception as e:
            logger.error(f"Error executing scenario actions: {str(e)}")
    
    def _execute_action(self, action: Dict, scenario: Dict, threat_data: Dict):
        """Execute a single action"""
        try:
            action_type = action['type']
            
            if action_type == 'trigger_collection':
                self._trigger_collection(action, scenario, threat_data)
            
            elif action_type == 'network_monitoring':
                self._trigger_network_monitoring(action, scenario, threat_data)
            
            elif action_type == 'ip_investigation':
                self._trigger_ip_investigation(action, scenario, threat_data)
            
            else:
                logger.warning(f"Unknown action type: {action_type}")
            
        except Exception as e:
            logger.error(f"Error executing action: {str(e)}")
    
    def _trigger_collection(self, action: Dict, scenario: Dict, threat_data: Dict):
        """Trigger intelligence collection"""
        try:
            collection_action = {
                'type': 'sigint' if action.get('collection_type') == 'SIGINT' else 'humint',
                'description': f"Collection activated for scenario {scenario['id']}",
                'priority': f"P{action.get('priority', 2)}",
                'status': 'pending',
                'related_threat_id': threat_data.get('id'),
                'related_scenario_id': scenario['id'],
                'metadata': {
                    'collection_type': action.get('collection_type', 'SIGINT'),
                    'automated': True,
                    'trigger_score': threat_data.get('score', 0)
                }
            }
            
            # Store action in Redis
            self.redis_client.lpush('actions', json.dumps(collection_action))
            
            logger.info(f"Triggered collection for scenario {scenario['id']}")
            
        except Exception as e:
            logger.error(f"Error triggering collection: {str(e)}")
    
    def _trigger_network_monitoring(self, action: Dict, scenario: Dict, threat_data: Dict):
        """Trigger network monitoring"""
        try:
            monitoring_action = {
                'type': 'network_monitoring',
                'description': f"Network monitoring for scenario {scenario['id']}",
                'priority': f"P{action.get('priority', 2)}",
                'status': 'pending',
                'related_threat_id': threat_data.get('id'),
                'related_scenario_id': scenario['id'],
                'metadata': {
                    'monitoring_type': 'network',
                    'automated': True
                }
            }
            
            # Store action in Redis
            self.redis_client.lpush('actions', json.dumps(monitoring_action))
            
            logger.info(f"Triggered network monitoring for scenario {scenario['id']}")
            
        except Exception as e:
            logger.error(f"Error triggering network monitoring: {str(e)}")
    
    def _trigger_ip_investigation(self, action: Dict, scenario: Dict, threat_data: Dict):
        """Trigger IP investigation"""
        try:
            investigation_action = {
                'type': 'ip_investigation',
                'description': f"IP investigation for scenario {scenario['id']}",
                'priority': f"P{action.get('priority', 2)}",
                'status': 'pending',
                'related_threat_id': threat_data.get('id'),
                'related_scenario_id': scenario['id'],
                'metadata': {
                    'investigation_type': 'ip',
                    'automated': True
                }
            }
            
            # Store action in Redis
            self.redis_client.lpush('actions', json.dumps(investigation_action))
            
            logger.info(f"Triggered IP investigation for scenario {scenario['id']}")
            
        except Exception as e:
            logger.error(f"Error triggering IP investigation: {str(e)}")
    
    def _update_scenario_status(self, scenario_id: str, evaluation: Dict):
        """Update scenario status based on evaluation"""
        try:
            if scenario_id in self.scenarios:
                scenario = self.scenarios[scenario_id]
                scenario['status'] = evaluation['status']
                scenario['conditions_met'] = evaluation['conditions_met']
                scenario['last_evaluated'] = evaluation['timestamp']
                
                if evaluation['triggered']:
                    scenario['last_triggered'] = evaluation['timestamp']
            
        except Exception as e:
            logger.error(f"Error updating scenario status: {str(e)}")
    
    def get_active_scenarios(self) -> List[Dict]:
        """Get all active scenarios"""
        try:
            active_scenarios = []
            
            for scenario in self.scenarios.values():
                if scenario['status'] in ['active', 'partial']:
                    active_scenarios.append(scenario)
            
            return active_scenarios
            
        except Exception as e:
            logger.error(f"Error getting active scenarios: {str(e)}")
            return []
    
    def get_scenario_by_id(self, scenario_id: str) -> Optional[Dict]:
        """Get scenario by ID"""
        try:
            return self.scenarios.get(scenario_id)
            
        except Exception as e:
            logger.error(f"Error getting scenario by ID: {str(e)}")
            return None
    
    def create_scenario(self, scenario_data: Dict) -> Dict:
        """Create a new scenario"""
        try:
            scenario_id = scenario_data.get('id') or f"scenario_{datetime.now().timestamp()}"
            
            scenario = {
                'id': scenario_id,
                'name': scenario_data['name'],
                'description': scenario_data.get('description', ''),
                'conditions': scenario_data['conditions'],
                'actions': scenario_data['actions'],
                'validity_window': scenario_data.get('validity_window', 'P1D'),
                'status': 'inactive',
                'priority': scenario_data.get('priority', 2),
                'conditions_met': 0,
                'total_conditions': len(scenario_data['conditions']),
                'created_at': datetime.now().isoformat(),
                'last_triggered': None
            }
            
            self.scenarios[scenario_id] = scenario
            
            logger.info(f"Created new scenario: {scenario_id}")
            
            return scenario
            
        except Exception as e:
            logger.error(f"Error creating scenario: {str(e)}")
            raise
    
    def update_scenario(self, scenario_id: str, updates: Dict) -> Dict:
        """Update an existing scenario"""
        try:
            if scenario_id not in self.scenarios:
                raise ValueError(f"Scenario {scenario_id} not found")
            
            scenario = self.scenarios[scenario_id]
            
            # Update allowed fields
            allowed_fields = ['name', 'description', 'conditions', 'actions', 'validity_window', 'priority', 'status']
            
            for field in allowed_fields:
                if field in updates:
                    scenario[field] = updates[field]
            
            scenario['updated_at'] = datetime.now().isoformat()
            
            # Recalculate total conditions if conditions were updated
            if 'conditions' in updates:
                scenario['total_conditions'] = len(updates['conditions'])
            
            logger.info(f"Updated scenario: {scenario_id}")
            
            return scenario
            
        except Exception as e:
            logger.error(f"Error updating scenario: {str(e)}")
            raise
    
    def delete_scenario(self, scenario_id: str) -> bool:
        """Delete a scenario"""
        try:
            if scenario_id in self.scenarios:
                del self.scenarios[scenario_id]
                logger.info(f"Deleted scenario: {scenario_id}")
                return True
            else:
                logger.warning(f"Scenario {scenario_id} not found for deletion")
                return False
                
        except Exception as e:
            logger.error(f"Error deleting scenario: {str(e)}")
            raise
