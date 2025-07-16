from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
import random
import math

class PrescriptionService:
    def __init__(self):
        # Suppression de toutes les données codées en dur
        self.prescriptions = []
        self.prediction_history = {}  # Suivi des prédictions
        self.entity_graph = {}  # Graphe des entités
        self.collection_requests = []  # Requêtes de collecte générées
        # Pas d'initialisation de données d'exemple
    
    def initialize_sample_prescriptions(self):
        """Initialiser des prescriptions d'exemple"""
        # Suppression des données codées en dur
        # Les prescriptions seront générées dynamiquement selon les besoins
        pass
    
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
        
        for action in prescription.get('actions', []):
            if action['id'] == action_id:
                action['completed'] = True
                return True
        return False
    
    def generate_prescription_from_threat(self, threat_data: Dict) -> Dict:
        """Générer une prescription à partir d'une menace"""
        # Génération dynamique basée sur les données de menace
        threat_id = threat_data.get('id', 'unknown')
        threat_type = threat_data.get('type', 'unknown')
        threat_score = threat_data.get('score', 0.5)
        
        # Calcul du score de delta (renforcement ou affaiblissement)
        delta_score = self._calculate_delta_score(threat_id, threat_score)
        
        # Analyse de la centralité des entités
        entity_centrality = self._calculate_entity_centrality(threat_data)
        
        # Score de crédibilité de la source
        credibility_score = self._calculate_credibility_score(threat_data)
        
        # Déterminer la priorité avec le score et le delta
        priority = self._determine_priority_with_delta(threat_score, delta_score)
        
        # Générer des actions basées sur l'analyse prédictive
        actions = self._generate_predictive_actions(threat_data, delta_score, entity_centrality)
        
        # Déterminer la catégorie avec analyse contextuelle
        category = self._determine_category_with_context(threat_type, threat_score, delta_score)
        
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
            'resources_needed': self._determine_resources(category, threat_score),
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
    
    def _calculate_delta_score(self, threat_id: str, current_score: float) -> float:
        """Calculer le score de delta (renforcement ou affaiblissement de la menace)"""
        if threat_id not in self.prediction_history:
            return 0.0
        
        history = self.prediction_history[threat_id]
        if len(history) < 2:
            return 0.0
        
        # Calculer la tendance récente
        recent_scores = [entry['score'] for entry in history[-3:]]
        return current_score - sum(recent_scores) / len(recent_scores)
    
    def _calculate_entity_centrality(self, threat_data: Dict) -> float:
        """Calculer la centralité des entités impliquées"""
        entities = threat_data.get('entities', [])
        if not entities:
            return 0.5
        
        # Simuler l'analyse de centralité
        total_centrality = 0
        for entity in entities:
            # Dans un vrai système, cela interrogerait le graphe d'entités
            centrality = random.uniform(0.3, 0.9)
            total_centrality += centrality
        
        return min(total_centrality / len(entities), 1.0)
    
    def _calculate_credibility_score(self, threat_data: Dict) -> float:
        """Calculer le score de crédibilité de la source"""
        source = threat_data.get('source', {})
        reliability = source.get('reliability', 0.5)
        confidence = source.get('confidence', 0.5)
        
        # Pondération de la crédibilité
        return (reliability * 0.6) + (confidence * 0.4)
    
    def _determine_priority_with_delta(self, threat_score: float, delta_score: float) -> str:
        """Déterminer la priorité en tenant compte du delta"""
        adjusted_score = threat_score + (delta_score * 0.3)
        
        if adjusted_score >= 0.8:
            return 'critical'
        elif adjusted_score >= 0.6:
            return 'high'
        elif adjusted_score >= 0.4:
            return 'medium'
        else:
            return 'low'
    
    def _generate_predictive_actions(self, threat_data: Dict, delta_score: float, entity_centrality: float) -> List[Dict]:
        """Générer des actions basées sur l'analyse prédictive"""
        actions = []
        threat_type = threat_data.get('type', 'unknown')
        
        # Actions basées sur le type de menace
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
        
        # Actions basées sur le delta score
        if delta_score > 0.1:  # Menace en augmentation
            actions.append({
                'id': f"action_{random.randint(1000, 9999)}",
                'description': 'Augmenter la surveillance en raison de l\'escalade',
                'type': 'automatic',
                'completed': False,
                'details': 'Surveillance renforcée automatique'
            })
        
        # Actions basées sur la centralité des entités
        if entity_centrality > 0.7:
            actions.append({
                'id': f"action_{random.randint(1000, 9999)}",
                'description': 'Analyser les connexions des entités centrales',
                'type': 'manual',
                'completed': False,
                'details': 'Enquête sur les entités hautement connectées'
            })
        
        return actions
    
    def _determine_category_with_context(self, threat_type: str, threat_score: float, delta_score: float) -> str:
        """Déterminer la catégorie avec analyse contextuelle"""
        if threat_score >= 0.8:
            return 'response'
        elif delta_score > 0.15:
            return 'investigation'
        elif 'surveillance' in threat_type.lower():
            return 'monitoring'
        else:
            return 'security'
    
    def _generate_collection_request_if_needed(self, threat_data: Dict, credibility_score: float) -> Optional[Dict]:
        """Générer une requête de collecte si nécessaire"""
        if credibility_score < 0.6:
            return {
                'id': f"collection_{random.randint(1000, 9999)}",
                'objective': f"Valider les informations concernant {threat_data.get('name', 'menace inconnue')}",
                'collection_type': 'HUMINT',
                'urgency': 'medium',
                'created_at': datetime.now().isoformat()
            }
        return None
    
    def _generate_llm_explanation(self, threat_data: Dict, delta_score: float, entity_centrality: float) -> str:
        """Générer une explication avec analyse LLM"""
        base_description = f"Analyse de la menace {threat_data.get('name', 'inconnue')}"
        
        if delta_score > 0.1:
            base_description += " - Escalade détectée"
        elif delta_score < -0.1:
            base_description += " - Diminution observée"
        
        if entity_centrality > 0.7:
            base_description += " - Entités hautement connectées impliquées"
        
        return base_description
    
    def _estimate_time(self, actions: List[Dict]) -> str:
        """Estimer le temps nécessaire"""
        total_actions = len(actions)
        if total_actions <= 2:
            return "1-2 heures"
        elif total_actions <= 4:
            return "2-4 heures"
        else:
            return "4-8 heures"
    
    def _determine_resources(self, category: str, threat_score: float) -> List[str]:
        """Déterminer les ressources nécessaires"""
        resources = []
        
        if category == 'security':
            resources.append('Équipe sécurité')
        elif category == 'investigation':
            resources.extend(['Équipe investigation', 'Outils forensiques'])
        elif category == 'monitoring':
            resources.append('Équipe surveillance')
        elif category == 'response':
            resources.extend(['Équipe réponse incident', 'Direction'])
        
        if threat_score > 0.7:
            resources.append('Ressources prioritaires')
        
        return resources
    
    def _update_prediction_history(self, threat_id: str, score: float, prescription_id: str):
        """Mettre à jour l'historique des prédictions"""
        if threat_id not in self.prediction_history:
            self.prediction_history[threat_id] = []
        
        self.prediction_history[threat_id].append({
            'score': score,
            'timestamp': datetime.now().isoformat(),
            'prescription_id': prescription_id
        })
        
        # Garder seulement les 10 dernières entrées
        self.prediction_history[threat_id] = self.prediction_history[threat_id][-10:]
    
    def get_prescription_statistics(self) -> Dict:
        """Récupérer les statistiques des prescriptions"""
        if not self.prescriptions:
            return {
                'total': 0,
                'by_status': {},
                'by_priority': {},
                'by_category': {},
                'completion_rate': 0
            }
        
        stats = {
            'total': len(self.prescriptions),
            'by_status': {},
            'by_priority': {},
            'by_category': {},
            'completion_rate': 0
        }
        
        for prescription in self.prescriptions:
            # Statistiques par statut
            status = prescription.get('status', 'unknown')
            stats['by_status'][status] = stats['by_status'].get(status, 0) + 1
            
            # Statistiques par priorité
            priority = prescription.get('priority', 'unknown')
            stats['by_priority'][priority] = stats['by_priority'].get(priority, 0) + 1
            
            # Statistiques par catégorie
            category = prescription.get('category', 'unknown')
            stats['by_category'][category] = stats['by_category'].get(category, 0) + 1
        
        # Taux de completion
        completed = stats['by_status'].get('completed', 0)
        stats['completion_rate'] = completed / stats['total'] if stats['total'] > 0 else 0
        
        return stats
    
    def validate_prediction(self, threat_id: str, actual_outcome: bool) -> Dict:
        """Valider une prédiction pour l'auto-apprentissage"""
        if threat_id not in self.prediction_history:
            return {'error': 'Aucun historique de prédiction trouvé pour cette menace'}
        
        history = self.prediction_history[threat_id]
        if not history:
            return {'error': 'Historique de prédiction vide'}
        
        latest_prediction = history[-1]
        predicted_score = latest_prediction['score']
        
        # Calculer la précision de la prédiction
        accuracy = 1.0 if actual_outcome else max(0.0, 1.0 - predicted_score)
        
        # Mettre à jour le modèle d'apprentissage (simulé)
        validation_result = {
            'threat_id': threat_id,
            'predicted_score': predicted_score,
            'actual_outcome': actual_outcome,
            'accuracy': accuracy,
            'model_updated': True,
            'timestamp': datetime.now().isoformat()
        }
        
        # Ajouter aux données d'apprentissage
        history.append({
            'validation': validation_result,
            'timestamp': datetime.now().isoformat()
        })
        
        return validation_result