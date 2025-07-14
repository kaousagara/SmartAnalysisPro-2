from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
import random

class PrescriptionService:
    def __init__(self):
        self.prescriptions = []
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
        """Générer une prescription basée sur une menace"""
        threat_score = threat_data.get('score', 0)
        threat_severity = threat_data.get('severity', 'low')
        threat_type = threat_data.get('name', '').lower()
        
        # Déterminer la priorité basée sur le score de menace
        if threat_score >= 0.9:
            priority = 'critical'
        elif threat_score >= 0.7:
            priority = 'high'
        elif threat_score >= 0.5:
            priority = 'medium'
        else:
            priority = 'low'
        
        # Générer des actions basées sur le type de menace
        actions = self._generate_actions_for_threat(threat_type, threat_severity)
        
        # Déterminer la catégorie principale
        category = self._determine_category(threat_type, threat_severity)
        
        prescription = {
            'id': f"presc_{random.randint(1000, 9999)}",
            'title': f"Réponse automatique - {threat_data.get('name', 'Menace inconnue')}",
            'description': f"Prescription générée automatiquement pour la menace {threat_data.get('name', '')}",
            'priority': priority,
            'category': category,
            'threat_id': threat_data.get('id'),
            'threat_name': threat_data.get('name'),
            'actions': actions,
            'estimated_time': self._estimate_time(actions),
            'resources_needed': self._determine_resources(category, threat_severity),
            'status': 'pending',
            'created_at': datetime.now().isoformat(),
            'confidence_score': min(threat_score + 0.1, 1.0)
        }
        
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