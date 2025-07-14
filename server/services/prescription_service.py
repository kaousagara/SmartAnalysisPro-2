from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
import random
import math

class PrescriptionService:
    def __init__(self):
        self.prescriptions = []
        self.prediction_history = {}  # Suivi des prédictions
        self.entity_graph = {}  # Graphe des entités
        self.collection_requests = []  # Requêtes de collecte générées
        self.initialize_sample_prescriptions()
    
    def initialize_sample_prescriptions(self):
        """Initialiser des prescriptions d'exemple"""
        sample_prescriptions = [
            {
                'id': 'presc_001',
                'title': 'Renforcement de la surveillance réseau',
                'description': 'Augmenter la surveillance des connexions réseau suite à la détection d\'activités suspectes',
                'priority': 'high',
                'category': 'security',
                'threat_id': 'threat_001',
                'threat_name': 'Activité réseau suspecte',
                'actions': [
                    {
                        'id': 'action_001',
                        'description': 'Activer la surveillance temps réel sur tous les ports critiques',
                        'type': 'automatic',
                        'completed': False,
                        'details': 'Surveillance automatique des ports 22, 80, 443, 3389'
                    },
                    {
                        'id': 'action_002',
                        'description': 'Analyser les logs de connexion des 24 dernières heures',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Rechercher des patterns d\'accès anormaux'
                    },
                    {
                        'id': 'action_003',
                        'description': 'Mettre à jour les règles de pare-feu',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Bloquer les IP suspectes identifiées'
                    }
                ],
                'estimated_time': '2-4 heures',
                'resources_needed': ['Équipe réseau', 'Outils de surveillance'],
                'status': 'pending',
                'created_at': datetime.now().isoformat(),
                'confidence_score': 0.85
            },
            {
                'id': 'presc_002',
                'title': 'Investigation approfondie malware',
                'description': 'Enquête complète sur la détection de malware et évaluation de l\'impact',
                'priority': 'critical',
                'category': 'investigation',
                'threat_id': 'threat_002',
                'threat_name': 'Détection de malware',
                'actions': [
                    {
                        'id': 'action_004',
                        'description': 'Isoler les systèmes affectés',
                        'type': 'automatic',
                        'completed': True,
                        'details': 'Isolation réseau automatique activée'
                    },
                    {
                        'id': 'action_005',
                        'description': 'Analyser les échantillons de malware',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Analyse forensique complète du malware'
                    },
                    {
                        'id': 'action_006',
                        'description': 'Identifier les vecteurs d\'infection',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Tracer l\'origine et le mode de propagation'
                    },
                    {
                        'id': 'action_007',
                        'description': 'Évaluer l\'impact sur les données',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Vérifier l\'intégrité des bases de données'
                    }
                ],
                'estimated_time': '6-8 heures',
                'resources_needed': ['Analyste malware', 'Laboratoire forensique'],
                'status': 'in_progress',
                'created_at': (datetime.now() - timedelta(hours=2)).isoformat(),
                'confidence_score': 0.92
            },
            {
                'id': 'presc_003',
                'title': 'Mitigation tentative d\'accès',
                'description': 'Mesures de mitigation pour les tentatives d\'accès non autorisé',
                'priority': 'medium',
                'category': 'mitigation',
                'threat_id': 'threat_003',
                'threat_name': 'Tentative d\'accès non autorisé',
                'actions': [
                    {
                        'id': 'action_008',
                        'description': 'Bloquer les adresses IP suspectes',
                        'type': 'automatic',
                        'completed': True,
                        'details': '15 adresses IP bloquées automatiquement'
                    },
                    {
                        'id': 'action_009',
                        'description': 'Réinitialiser les mots de passe compromis',
                        'type': 'manual',
                        'completed': True,
                        'details': 'Mots de passe réinitialisés pour 8 comptes'
                    },
                    {
                        'id': 'action_010',
                        'description': 'Renforcer l\'authentification multi-facteurs',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Déployer MFA sur tous les comptes administrateur'
                    }
                ],
                'estimated_time': '3-5 heures',
                'resources_needed': ['Équipe sécurité', 'Administrateurs système'],
                'status': 'in_progress',
                'created_at': (datetime.now() - timedelta(hours=6)).isoformat(),
                'confidence_score': 0.78
            },
            {
                'id': 'presc_004',
                'title': 'Plan de réponse incident intrusion',
                'description': 'Activation du plan de réponse pour l\'intrusion système détectée',
                'priority': 'critical',
                'category': 'response',
                'threat_id': 'threat_004',
                'threat_name': 'Intrusion système détectée',
                'actions': [
                    {
                        'id': 'action_011',
                        'description': 'Activer le plan de continuité d\'activité',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Basculer vers les systèmes de backup'
                    },
                    {
                        'id': 'action_012',
                        'description': 'Notifier les équipes de direction',
                        'type': 'automatic',
                        'completed': True,
                        'details': 'Notifications envoyées aux responsables'
                    },
                    {
                        'id': 'action_013',
                        'description': 'Documenter l\'incident',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Créer le rapport d\'incident détaillé'
                    },
                    {
                        'id': 'action_014',
                        'description': 'Coordonner avec les autorités',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Contacter les autorités compétentes si nécessaire'
                    }
                ],
                'estimated_time': '4-6 heures',
                'resources_needed': ['Équipe incident', 'Direction', 'Équipe juridique'],
                'status': 'pending',
                'created_at': (datetime.now() - timedelta(minutes=30)).isoformat(),
                'confidence_score': 0.88
            },
            {
                'id': 'presc_005',
                'title': 'Audit de sécurité préventif',
                'description': 'Audit complet de sécurité suite aux incidents récents',
                'priority': 'medium',
                'category': 'security',
                'threat_id': None,
                'threat_name': None,
                'actions': [
                    {
                        'id': 'action_015',
                        'description': 'Scanner les vulnérabilités système',
                        'type': 'automatic',
                        'completed': False,
                        'details': 'Scan complet de tous les serveurs'
                    },
                    {
                        'id': 'action_016',
                        'description': 'Réviser les politiques de sécurité',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Mettre à jour les procédures de sécurité'
                    },
                    {
                        'id': 'action_017',
                        'description': 'Former les équipes aux nouvelles menaces',
                        'type': 'manual',
                        'completed': False,
                        'details': 'Session de formation sur les dernières menaces'
                    }
                ],
                'estimated_time': '1-2 jours',
                'resources_needed': ['Équipe sécurité', 'Formateurs'],
                'status': 'pending',
                'created_at': (datetime.now() - timedelta(days=1)).isoformat(),
                'confidence_score': 0.70
            }
        ]
        
        self.prescriptions = sample_prescriptions
    
    def get_prescriptions(self) -> List[Dict]:
        """Récupérer toutes les prescriptions"""
        return self.prescriptions
    
    def get_prescription_by_id(self, prescription_id: str) -> Optional[Dict]:
        """Récupérer une prescription par ID"""
        for prescription in self.prescriptions:
            if prescription['id'] == prescription_id:
                return prescription
        return None
    
    def update_prescription_status(self, prescription_id: str, status: str) -> bool:
        """Mettre à jour le statut d'une prescription"""
        for prescription in self.prescriptions:
            if prescription['id'] == prescription_id:
                prescription['status'] = status
                return True
        return False
    
    def execute_action(self, prescription_id: str, action_id: str) -> bool:
        """Exécuter une action d'une prescription"""
        prescription = self.get_prescription_by_id(prescription_id)
        if not prescription:
            return False
        
        for action in prescription['actions']:
            if action['id'] == action_id:
                action['completed'] = True
                return True
        return False
    
    def generate_prescription_from_threat(self, threat_data: Dict) -> Dict:
        """Générer une prescription basée sur une menace avec analyse prédictive"""
        threat_score = threat_data.get('score', 0)
        threat_severity = threat_data.get('severity', 'low')
        threat_type = threat_data.get('name', '').lower()
        threat_id = threat_data.get('id')
        
        # Analyse prédictive - calcul du delta score
        delta_score = self._calculate_delta_score(threat_id, threat_score)
        
        # Analyse du graphe d'entités
        entity_centrality = self._calculate_entity_centrality(threat_data)
        
        # Score de crédibilité basé sur l'historique
        credibility_score = self._calculate_credibility_score(threat_data)
        
        # Déterminer la priorité basée sur le score de menace et le delta
        priority = self._determine_priority_with_delta(threat_score, delta_score)
        
        # Générer des actions basées sur l'analyse prédictive
        actions = self._generate_predictive_actions(threat_data, delta_score, entity_centrality)
        
        # Déterminer la catégorie avec analyse contextuelle
        category = self._determine_category_with_context(threat_type, threat_severity, delta_score)
        
        # Générer requête de collecte si nécessaire
        collection_request = self._generate_collection_request_if_needed(threat_data, credibility_score)
        
        prescription = {
            'id': f"presc_{random.randint(1000, 9999)}",
            'title': f"Analyse prédictive - {threat_data.get('name', 'Menace inconnue')}",
            'description': self._generate_llm_explanation(threat_data, delta_score, entity_centrality),
            'priority': priority,
            'category': category,
            'threat_id': threat_id,
            'threat_name': threat_data.get('name'),
            'actions': actions,
            'estimated_time': self._estimate_time(actions),
            'resources_needed': self._determine_resources(category, threat_severity),
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'confidence_score': min(threat_score + 0.1, 1.0),
            'delta_score': delta_score,
            'entity_centrality': entity_centrality,
            'credibility_score': credibility_score,
            'collection_request': collection_request
        }
        
        # Mettre à jour l'historique des prédictions
        self._update_prediction_history(threat_id, threat_score, prescription['id'])
        
        return prescription
    
    def _generate_actions_for_threat(self, threat_type: str, severity: str) -> List[Dict]:
        """Générer des actions spécifiques au type de menace"""
        actions = []
        
        if 'réseau' in threat_type or 'network' in threat_type:
            actions.extend([
                {
                    'id': f"action_{random.randint(1000, 9999)}",
                    'description': 'Analyser le trafic réseau suspect',
                    'type': 'automatic',
                    'completed': False,
                    'details': 'Analyse automatique du trafic réseau'
                },
                {
                    'id': f"action_{random.randint(1000, 9999)}",
                    'description': 'Bloquer les connexions suspectes',
                    'type': 'manual',
                    'completed': False,
                    'details': 'Révision manuelle et blocage des connexions'
                }
            ])
        
        if 'malware' in threat_type:
            actions.extend([
                {
                    'id': f"action_{random.randint(1000, 9999)}",
                    'description': 'Isoler les systèmes infectés',
                    'type': 'automatic',
                    'completed': False,
                    'details': 'Isolation automatique des systèmes compromis'
                },
                {
                    'id': f"action_{random.randint(1000, 9999)}",
                    'description': 'Analyser les échantillons de malware',
                    'type': 'manual',
                    'completed': False,
                    'details': 'Analyse forensique du malware'
                }
            ])
        
        if 'accès' in threat_type or 'access' in threat_type:
            actions.extend([
                {
                    'id': f"action_{random.randint(1000, 9999)}",
                    'description': 'Réinitialiser les mots de passe compromis',
                    'type': 'manual',
                    'completed': False,
                    'details': 'Réinitialisation des mots de passe affectés'
                },
                {
                    'id': f"action_{random.randint(1000, 9999)}",
                    'description': 'Renforcer l\'authentification',
                    'type': 'manual',
                    'completed': False,
                    'details': 'Activation de l\'authentification multi-facteurs'
                }
            ])
        
        # Actions génériques pour tous les types de menaces
        if severity in ['high', 'critical']:
            actions.append({
                'id': f"action_{random.randint(1000, 9999)}",
                'description': 'Notifier les équipes de sécurité',
                'type': 'automatic',
                'completed': False,
                'details': 'Notification automatique des équipes'
            })
        
        return actions
    
    def _determine_category(self, threat_type: str, severity: str) -> str:
        """Déterminer la catégorie principale de la prescription"""
        if 'intrusion' in threat_type or severity == 'critical':
            return 'response'
        elif 'malware' in threat_type:
            return 'investigation'
        elif 'accès' in threat_type:
            return 'mitigation'
        else:
            return 'security'
    
    def _estimate_time(self, actions: List[Dict]) -> str:
        """Estimer le temps nécessaire basé sur les actions"""
        manual_actions = len([a for a in actions if a['type'] == 'manual'])
        auto_actions = len([a for a in actions if a['type'] == 'automatic'])
        
        estimated_hours = (manual_actions * 1.5) + (auto_actions * 0.5)
        
        if estimated_hours < 2:
            return '1-2 heures'
        elif estimated_hours < 4:
            return '2-4 heures'
        elif estimated_hours < 8:
            return '4-8 heures'
        else:
            return '1-2 jours'
    
    def _determine_resources(self, category: str, severity: str) -> List[str]:
        """Déterminer les ressources nécessaires"""
        resources = ['Équipe sécurité']
        
        if category == 'investigation':
            resources.append('Analyste forensique')
        elif category == 'response':
            resources.extend(['Direction', 'Équipe incident'])
        elif category == 'mitigation':
            resources.append('Administrateurs système')
        
        if severity in ['high', 'critical']:
            resources.append('Équipe d\'urgence')
        
        return resources
    
    def get_prescription_statistics(self) -> Dict:
        """Obtenir les statistiques des prescriptions"""
        total = len(self.prescriptions)
        if total == 0:
            return {
                'total': 0,
                'by_status': {},
                'by_priority': {},
                'by_category': {}
            }
        
        by_status = {}
        by_priority = {}
        by_category = {}
        
        for prescription in self.prescriptions:
            status = prescription['status']
            priority = prescription['priority']
            category = prescription['category']
            
            by_status[status] = by_status.get(status, 0) + 1
            by_priority[priority] = by_priority.get(priority, 0) + 1
            by_category[category] = by_category.get(category, 0) + 1
        
        return {
            'total': total,
            'by_status': by_status,
            'by_priority': by_priority,
            'by_category': by_category
        }
    
    def _calculate_delta_score(self, threat_id: str, current_score: float) -> float:
        """Calculer la variation du score de menace dans le temps"""
        if threat_id not in self.prediction_history:
            self.prediction_history[threat_id] = []
        
        history = self.prediction_history[threat_id]
        
        if len(history) == 0:
            return 0.0
        
        # Calculer la variation par rapport au dernier score
        last_score = history[-1]['score']
        delta = current_score - last_score
        
        return delta
    
    def _calculate_entity_centrality(self, threat_data: Dict) -> float:
        """Calculer la centralité des entités dans le graphe relationnel"""
        # Simulation d'analyse de centralité
        entities = threat_data.get('entities', [])
        if not entities:
            return 0.5
        
        # Calculer une centralité basée sur le nombre de connexions
        total_connections = sum(len(entity.get('connections', [])) for entity in entities)
        centrality = min(total_connections / 10.0, 1.0)  # Normaliser
        
        return centrality
    
    def _calculate_credibility_score(self, threat_data: Dict) -> float:
        """Calculer le score de crédibilité basé sur l'historique de la source"""
        source_id = threat_data.get('source_id', 'unknown')
        
        # Simulation d'historique de crédibilité
        credibility_history = {
            'source_001': 0.9,
            'source_002': 0.7,
            'source_003': 0.8,
            'unknown': 0.5
        }
        
        base_credibility = credibility_history.get(source_id, 0.5)
        
        # Ajuster basé sur la cohérence avec d'autres documents
        coherence_factor = threat_data.get('coherence_score', 0.5)
        
        return min(base_credibility * (1 + coherence_factor), 1.0)
    
    def _determine_priority_with_delta(self, score: float, delta_score: float) -> str:
        """Déterminer la priorité en tenant compte du delta score"""
        base_priority = 'low'
        
        if score >= 0.9:
            base_priority = 'critical'
        elif score >= 0.7:
            base_priority = 'high'
        elif score >= 0.5:
            base_priority = 'medium'
        
        # Augmenter la priorité si renforcement significatif
        if delta_score > 0.2:
            priority_levels = ['low', 'medium', 'high', 'critical']
            current_index = priority_levels.index(base_priority)
            if current_index < len(priority_levels) - 1:
                return priority_levels[current_index + 1]
        
        return base_priority
    
    def _generate_predictive_actions(self, threat_data: Dict, delta_score: float, entity_centrality: float) -> List[Dict]:
        """Générer des actions basées sur l'analyse prédictive"""
        actions = []
        threat_type = threat_data.get('name', '').lower()
        
        # Actions de renforcement si prédiction crédible
        if delta_score > 0.1 and entity_centrality > 0.6:
            actions.extend([
                {
                    'id': f"action_{random.randint(1000, 9999)}",
                    'description': 'Activer la surveillance SIGINT renforcée',
                    'type': 'automatic',
                    'completed': False,
                    'details': 'Surveillance intensifiée suite au renforcement de la prédiction'
                },
                {
                    'id': f"action_{random.randint(1000, 9999)}",
                    'description': 'Demander recoupement inter-agence',
                    'type': 'manual',
                    'completed': False,
                    'details': 'Validation croisée avec sources externes'
                }
            ])
        
        # Actions d'affaiblissement si incohérences détectées
        elif delta_score < -0.1:
            actions.extend([
                {
                    'id': f"action_{random.randint(1000, 9999)}",
                    'description': 'Baisser la pondération de la source',
                    'type': 'automatic',
                    'completed': False,
                    'details': 'Réduction automatique de la confiance'
                },
                {
                    'id': f"action_{random.randint(1000, 9999)}",
                    'description': 'Demander confirmation terrain',
                    'type': 'manual',
                    'completed': False,
                    'details': 'Validation humaine nécessaire'
                }
            ])
        
        # Actions spécifiques au type de menace
        if 'coordination' in threat_type or 'opération' in threat_type:
            actions.append({
                'id': f"action_{random.randint(1000, 9999)}",
                'description': 'Mobiliser observateur terrain',
                'type': 'manual',
                'completed': False,
                'details': 'Déploiement HUMINT pour validation'
            })
        
        # Actions génériques d'analyse
        actions.append({
            'id': f"action_{random.randint(1000, 9999)}",
            'description': 'Analyser l\'évolution du graphe d\'entités',
            'type': 'automatic',
            'completed': False,
            'details': 'Suivi automatique des connexions'
        })
        
        return actions
    
    def _determine_category_with_context(self, threat_type: str, severity: str, delta_score: float) -> str:
        """Déterminer la catégorie avec analyse contextuelle"""
        if delta_score > 0.2:  # Renforcement significatif
            return 'response'
        elif delta_score < -0.1:  # Affaiblissement
            return 'investigation'
        elif 'coordination' in threat_type:
            return 'security'
        else:
            return 'mitigation'
    
    def _generate_collection_request_if_needed(self, threat_data: Dict, credibility_score: float) -> Optional[Dict]:
        """Générer une requête de collecte si l'information est incomplète"""
        score = threat_data.get('score', 0)
        
        # Conditions de génération
        if score > 0.7 and credibility_score < 0.6:
            request = {
                'id': f"collect_{random.randint(1000, 9999)}",
                'objective': f"Vérifier la crédibilité de la menace {threat_data.get('name', '')}",
                'collection_type': 'HUMINT',
                'urgency': 'high' if score > 0.8 else 'medium',
                'created_at': datetime.now().isoformat(),
                'status': 'pending'
            }
            
            self.collection_requests.append(request)
            return request
        
        return None
    
    def _generate_llm_explanation(self, threat_data: Dict, delta_score: float, entity_centrality: float) -> str:
        """Générer une explication contextuelle avec simulation LLM"""
        name = threat_data.get('name', 'Menace inconnue')
        score = threat_data.get('score', 0)
        
        if delta_score > 0.1:
            trend = "renforcement"
            action = "mobiliser"
        elif delta_score < -0.1:
            trend = "affaiblissement"
            action = "valider"
        else:
            trend = "stabilité"
            action = "surveiller"
        
        explanation = f"Analyse prédictive de '{name}' (score: {score:.2f}). "
        explanation += f"Tendance: {trend} (Δ{delta_score:+.2f}). "
        explanation += f"Centralité des entités: {entity_centrality:.2f}. "
        explanation += f"Recommandation: {action} la surveillance et intensifier la collecte."
        
        return explanation
    
    def _update_prediction_history(self, threat_id: str, score: float, prescription_id: str):
        """Mettre à jour l'historique des prédictions"""
        if threat_id not in self.prediction_history:
            self.prediction_history[threat_id] = []
        
        entry = {
            'timestamp': datetime.now().isoformat(),
            'score': score,
            'prescription_id': prescription_id
        }
        
        self.prediction_history[threat_id].append(entry)
        
        # Garder seulement les 10 dernières entrées
        if len(self.prediction_history[threat_id]) > 10:
            self.prediction_history[threat_id] = self.prediction_history[threat_id][-10:]
    
    def validate_prediction(self, threat_id: str, actual_outcome: bool) -> Dict:
        """Validation humaine d'une prédiction pour l'auto-apprentissage"""
        if threat_id not in self.prediction_history:
            return {'error': 'Prédiction non trouvée'}
        
        history = self.prediction_history[threat_id]
        if not history:
            return {'error': 'Historique vide'}
        
        # Mettre à jour avec le résultat réel
        latest_entry = history[-1]
        latest_entry['actual_outcome'] = actual_outcome
        latest_entry['validated_at'] = datetime.now().isoformat()
        
        # Calculer la précision
        predicted_positive = latest_entry['score'] > 0.7
        accuracy = predicted_positive == actual_outcome
        
        # Ajuster le modèle (simulation)
        adjustment = 0.1 if accuracy else -0.05
        
        return {
            'threat_id': threat_id,
            'predicted_score': latest_entry['score'],
            'actual_outcome': actual_outcome,
            'accuracy': accuracy,
            'model_adjustment': adjustment,
            'validated_at': latest_entry['validated_at']
        }
    
    def get_prescription_collection_requests(self) -> List[Dict]:
        """Récupérer les requêtes de collecte générées par les prescriptions"""
        return self.collection_requests
    
    def get_prediction_trends(self) -> Dict:
        """Obtenir les tendances de prédiction"""
        trends = {}
        
        for threat_id, history in self.prediction_history.items():
            if len(history) < 2:
                continue
            
            scores = [entry['score'] for entry in history]
            
            # Calculer la tendance
            if len(scores) >= 2:
                recent_trend = scores[-1] - scores[-2]
                overall_trend = scores[-1] - scores[0] if len(scores) > 1 else 0
                
                trends[threat_id] = {
                    'recent_trend': recent_trend,
                    'overall_trend': overall_trend,
                    'current_score': scores[-1],
                    'volatility': self._calculate_volatility(scores)
                }
        
        return trends
    
    def _calculate_volatility(self, scores: List[float]) -> float:
        """Calculer la volatilité des scores"""
        if len(scores) < 2:
            return 0.0
        
        mean = sum(scores) / len(scores)
        variance = sum((score - mean) ** 2 for score in scores) / len(scores)
        return math.sqrt(variance)