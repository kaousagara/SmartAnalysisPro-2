"""
Service de génération automatique de requêtes de collecte
Génère des requêtes structurées lorsque le système détecte des informations manquantes
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
import logging

logger = logging.getLogger(__name__)

@dataclass
class CollectionRequest:
    """Représente une requête de collecte de renseignement"""
    id: str
    zone: str
    objectif: str
    origine: str
    urgence: str
    date: str
    type_requete: str
    scenario_id: Optional[str] = None
    threat_id: Optional[str] = None
    prediction_id: Optional[str] = None
    prediction_confidence: Optional[float] = None
    prediction_hypothesis: Optional[str] = None
    validation_result: Optional[str] = None  # "confirm", "refute", "inconclusive"
    collected_evidence: Optional[str] = None
    status: str = "pending"
    created_at: str = None
    expires_at: str = None
    confidence_threshold: float = 0.4
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now().isoformat()
        if self.expires_at is None:
            # Expiration automatique après 7 jours
            self.expires_at = (datetime.now() + timedelta(days=7)).isoformat()

class CollectionRequestService:
    def __init__(self):
        self.requests: Dict[str, CollectionRequest] = {}
        self.scenario_requests: Dict[str, str] = {}  # scenario_id -> request_id
        self.threat_requests: Dict[str, str] = {}    # threat_id -> request_id
        self.prediction_requests: Dict[str, str] = {}  # prediction_id -> request_id
        self.max_requests_per_scenario = 1
        self.min_confidence_threshold = 0.4
        
    def generate_collection_request(self, trigger_data: Dict) -> Optional[CollectionRequest]:
        """
        Génère une requête de collecte basée sur les données de déclenchement
        
        Args:
            trigger_data: Données contenant les informations sur le déclenchement
            - type: "scenario_uncertain" | "prescription_incomplete" | "information_gap"
            - scenario_id: ID du scénario (optionnel)
            - threat_id: ID de la menace (optionnel)
            - confidence: Score de confiance
            - zone: Zone géographique
            - missing_info: Type d'information manquante
        """
        try:
            # Vérifications de sécurité anti-boucle
            if not self._should_generate_request(trigger_data):
                return None
                
            # Génération de la requête
            request = self._create_request_from_trigger(trigger_data)
            
            # Enregistrement avec protection anti-boucle
            self._register_request(request)
            
            logger.info(f"Requête de collecte générée: {request.id} pour zone {request.zone}")
            return request
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de requête: {str(e)}")
            return None
    
    def _should_generate_request(self, trigger_data: Dict) -> bool:
        """Vérifie si une requête doit être générée (sécurité anti-boucle)"""
        
        # Vérification du seuil de confiance
        confidence = trigger_data.get('confidence', 0.0)
        if confidence < self.min_confidence_threshold:
            logger.debug(f"Confiance trop faible ({confidence}) pour générer une requête")
            return False
            
        # Vérification max 1 requête par scénario actif
        scenario_id = trigger_data.get('scenario_id')
        if scenario_id and scenario_id in self.scenario_requests:
            existing_request_id = self.scenario_requests[scenario_id]
            if existing_request_id in self.requests:
                logger.debug(f"Requête existante pour scénario {scenario_id}")
                return False
                
        # Vérification max 1 requête par menace
        threat_id = trigger_data.get('threat_id')
        if threat_id and threat_id in self.threat_requests:
            existing_request_id = self.threat_requests[threat_id]
            if existing_request_id in self.requests:
                logger.debug(f"Requête existante pour menace {threat_id}")
                return False
                
        return True
    
    def generate_prediction_validation_request(self, prediction_data: Dict) -> Optional[CollectionRequest]:
        """
        Génère une requête de collecte pour valider une prédiction
        
        Args:
            prediction_data: Données de la prédiction
            - prediction_id: ID de la prédiction
            - threat_id: ID de la menace
            - confidence: Score de confiance de la prédiction
            - hypothesis: Hypothèse à valider
            - zone: Zone géographique
            - threat_type: Type de menace
        """
        try:
            # Vérifier qu'il n'y a pas déjà une requête pour cette prédiction
            prediction_id = prediction_data.get('prediction_id')
            if prediction_id and prediction_id in self.prediction_requests:
                existing_request_id = self.prediction_requests[prediction_id]
                if existing_request_id in self.requests:
                    logger.debug(f"Requête existante pour prédiction {prediction_id}")
                    return None
            
            # Créer une requête spécifique pour validation de prédiction
            request = self._create_prediction_validation_request(prediction_data)
            
            # Enregistrer la requête
            self._register_prediction_request(request)
            
            logger.info(f"Requête de validation de prédiction générée: {request.id} pour prédiction {prediction_id}")
            return request
            
        except Exception as e:
            logger.error(f"Erreur lors de la génération de requête de validation: {str(e)}")
            return None
    
    def _create_prediction_validation_request(self, prediction_data: Dict) -> CollectionRequest:
        """Crée une requête de validation de prédiction"""
        request_id = f"CR-PRED-{str(uuid.uuid4())[:8]}"
        
        prediction_id = prediction_data.get('prediction_id', '')
        hypothesis = prediction_data.get('hypothesis', '')
        confidence = prediction_data.get('confidence', 0.0)
        threat_type = prediction_data.get('threat_type', 'inconnu')
        zone = prediction_data.get('zone', 'Zone non spécifiée')
        
        # Générer l'objectif de validation
        objectif = f"Valider la prédiction: {hypothesis}"
        
        # Déterminer le type de collecte nécessaire
        if threat_type in ['cyber', 'cyberattaque', 'intrusion']:
            type_requete = "SIGINT ciblé"
        elif threat_type in ['terrorisme', 'groupe armé']:
            type_requete = "HUMINT"
        else:
            type_requete = "HUMINT ou SIGINT ciblé"
        
        # Déterminer l'urgence basée sur la confiance
        if confidence >= 0.8:
            urgence = "Critique"
        elif confidence >= 0.6:
            urgence = "Haute"
        elif confidence >= 0.4:
            urgence = "Moyenne"
        else:
            urgence = "Faible"
        
        return CollectionRequest(
            id=request_id,
            zone=zone,
            objectif=objectif,
            origine=f"Validation de prédiction {prediction_id} (confiance: {confidence:.2f})",
            urgence=urgence,
            date=datetime.now().strftime('%Y-%m-%d'),
            type_requete=type_requete,
            prediction_id=prediction_id,
            prediction_confidence=confidence,
            prediction_hypothesis=hypothesis,
            threat_id=prediction_data.get('threat_id'),
            scenario_id=prediction_data.get('scenario_id')
        )
    
    def _register_prediction_request(self, request: CollectionRequest):
        """Enregistre une requête de validation de prédiction"""
        self.requests[request.id] = request
        
        if request.prediction_id:
            self.prediction_requests[request.prediction_id] = request.id
        
        # Nettoyer les requêtes expirées
        self.cleanup_expired_requests()
    
    def validate_prediction_with_evidence(self, request_id: str, evidence: str, result: str) -> bool:
        """
        Valide une prédiction avec les preuves collectées
        
        Args:
            request_id: ID de la requête
            evidence: Preuves collectées
            result: Résultat de la validation ("confirm", "refute", "inconclusive")
        """
        try:
            if request_id not in self.requests:
                return False
            
            request = self.requests[request_id]
            request.collected_evidence = evidence
            request.validation_result = result
            request.status = "completed"
            
            # Retourner le résultat de validation à l'historique des prédictions
            if request.prediction_id:
                self._update_prediction_history(request.prediction_id, result, evidence)
            
            logger.info(f"Prédiction {request.prediction_id} validée avec résultat: {result}")
            return True
            
        except Exception as e:
            logger.error(f"Erreur lors de la validation de prédiction: {str(e)}")
            return False
    
    def _update_prediction_history(self, prediction_id: str, result: str, evidence: str):
        """Met à jour l'historique des prédictions avec le résultat de validation"""
        # Cette méthode serait appelée par le service de prescriptions
        # pour mettre à jour l'historique des prédictions
        logger.info(f"Mise à jour de l'historique de prédiction {prediction_id}: {result}")
    
    def get_prediction_validation_requests(self) -> List[Dict]:
        """Récupère toutes les requêtes de validation de prédiction"""
        validation_requests = []
        
        for request in self.requests.values():
            if request.prediction_id:
                validation_requests.append({
                    **asdict(request),
                    'type': 'prediction_validation'
                })
        
        return validation_requests
    
    def _create_request_from_trigger(self, trigger_data: Dict) -> CollectionRequest:
        """Crée une requête à partir des données de déclenchement"""
        
        request_id = str(uuid.uuid4())
        trigger_type = trigger_data.get('type', 'information_gap')
        
        # Détermination de la zone
        zone = trigger_data.get('zone', 'Zone non spécifiée')
        if not zone or zone == 'Zone non spécifiée':
            zone = self._extract_zone_from_context(trigger_data)
            
        # Génération de l'objectif basé sur le type de déclenchement
        objectif = self._generate_objective(trigger_type, trigger_data)
        
        # Détermination de l'origine
        origine = self._determine_origin(trigger_type, trigger_data)
        
        # Détermination de l'urgence
        urgence = self._determine_urgency(trigger_data)
        
        # Détermination du type de requête
        type_requete = self._determine_request_type(trigger_data)
        
        return CollectionRequest(
            id=request_id,
            zone=zone,
            objectif=objectif,
            origine=origine,
            urgence=urgence,
            date=datetime.now().strftime('%Y-%m-%d'),
            type_requete=type_requete,
            scenario_id=trigger_data.get('scenario_id'),
            threat_id=trigger_data.get('threat_id')
        )
    
    def _extract_zone_from_context(self, trigger_data: Dict) -> str:
        """Extrait la zone géographique du contexte"""
        
        # Zones prédéfinies pour l'exemple malien
        zones_mali = ["Gao", "Tombouctou", "Kidal", "Ménaka", "Mopti", "Ségou", "Sikasso", "Koulikoro", "Kayes", "Bamako"]
        
        # Recherche dans le contexte
        context = trigger_data.get('context', {})
        threat_name = context.get('threat_name', '')
        scenario_name = context.get('scenario_name', '')
        
        # Recherche de mentions de zones
        combined_text = f"{threat_name} {scenario_name}".lower()
        for zone in zones_mali:
            if zone.lower() in combined_text:
                return zone
                
        # Zone par défaut basée sur le type de menace
        threat_type = trigger_data.get('threat_type', '').lower()
        if 'cyber' in threat_type:
            return "Bamako"
        elif 'terrorisme' in threat_type or 'groupe armé' in threat_type:
            return "Gao"
        else:
            return "Zone Nord"
    
    def _generate_objective(self, trigger_type: str, trigger_data: Dict) -> str:
        """Génère l'objectif de la requête"""
        
        missing_info = trigger_data.get('missing_info', 'information générale')
        threat_type = trigger_data.get('threat_type', 'menace')
        
        objectives = {
            'scenario_uncertain': f"Clarifier les conditions du scénario concernant {missing_info}",
            'prescription_incomplete': f"Obtenir des informations complémentaires pour finaliser la prescription sur {threat_type}",
            'information_gap': f"Combler le manque d'information critique sur {missing_info}",
            'threat_validation': f"Valider la présence de {threat_type} dans la zone",
            'network_analysis': f"Analyser les connexions réseau liées à {missing_info}"
        }
        
        return objectives.get(trigger_type, f"Collecter des informations sur {missing_info}")
    
    def _determine_origin(self, trigger_type: str, trigger_data: Dict) -> str:
        """Détermine l'origine de la requête"""
        
        origins = {
            'scenario_uncertain': "Scénario avec conditions incertaines",
            'prescription_incomplete': "Prescription nécessitant des informations complémentaires",
            'information_gap': "Manque d'information critique détecté",
            'threat_validation': "Validation de menace requise",
            'network_analysis': "Analyse réseau incomplète"
        }
        
        base_origin = origins.get(trigger_type, "Système d'analyse automatique")
        
        # Ajout de contexte si disponible
        gap_count = trigger_data.get('gap_count', 0)
        if gap_count > 0:
            base_origin += f" ({gap_count} documents consécutifs)"
            
        return base_origin
    
    def _determine_urgency(self, trigger_data: Dict) -> str:
        """Détermine le niveau d'urgence"""
        
        confidence = trigger_data.get('confidence', 0.0)
        threat_level = trigger_data.get('threat_level', 'medium')
        
        if confidence > 0.8 or threat_level == 'critical':
            return "Critique"
        elif confidence > 0.6 or threat_level == 'high':
            return "Haute"
        elif confidence > 0.4 or threat_level == 'medium':
            return "Moyenne"
        else:
            return "Faible"
    
    def _determine_request_type(self, trigger_data: Dict) -> str:
        """Détermine le type de requête de collecte"""
        
        threat_type = trigger_data.get('threat_type', '').lower()
        missing_info = trigger_data.get('missing_info', '').lower()
        
        if 'cyber' in threat_type or 'réseau' in missing_info:
            return "SIGINT ciblé"
        elif 'groupe armé' in threat_type or 'terrorisme' in threat_type:
            return "HUMINT ou SIGINT ciblé"
        elif 'communication' in missing_info:
            return "SIGINT"
        elif 'mouvement' in missing_info or 'présence' in missing_info:
            return "HUMINT"
        else:
            return "HUMINT ou SIGINT"
    
    def _register_request(self, request: CollectionRequest):
        """Enregistre la requête avec protection anti-boucle"""
        
        self.requests[request.id] = request
        
        # Enregistrement des associations pour éviter les doublons
        if request.scenario_id:
            self.scenario_requests[request.scenario_id] = request.id
            
        if request.threat_id:
            self.threat_requests[request.threat_id] = request.id
    
    def mark_request_fulfilled(self, request_id: str, fulfillment_info: Dict = None):
        """Marque une requête comme satisfaite et la supprime"""
        
        if request_id not in self.requests:
            return False
            
        request = self.requests[request_id]
        
        # Nettoyage des associations
        if request.scenario_id and request.scenario_id in self.scenario_requests:
            del self.scenario_requests[request.scenario_id]
            
        if request.threat_id and request.threat_id in self.threat_requests:
            del self.threat_requests[request.threat_id]
            
        # Suppression de la requête
        del self.requests[request_id]
        
        logger.info(f"Requête {request_id} marquée comme satisfaite et supprimée")
        return True
    
    def cleanup_expired_requests(self):
        """Nettoie les requêtes expirées"""
        
        current_time = datetime.now()
        expired_requests = []
        
        for request_id, request in self.requests.items():
            if datetime.fromisoformat(request.expires_at) < current_time:
                expired_requests.append(request_id)
                
        for request_id in expired_requests:
            self.mark_request_fulfilled(request_id)
            
        if expired_requests:
            logger.info(f"Nettoyage de {len(expired_requests)} requêtes expirées")
    
    def get_all_requests(self) -> List[Dict]:
        """Retourne toutes les requêtes actives"""
        
        self.cleanup_expired_requests()
        return [asdict(request) for request in self.requests.values()]
    
    def get_request_by_id(self, request_id: str) -> Optional[Dict]:
        """Retourne une requête spécifique"""
        
        request = self.requests.get(request_id)
        return asdict(request) if request else None
    
    def get_requests_by_zone(self, zone: str) -> List[Dict]:
        """Retourne les requêtes pour une zone spécifique"""
        
        self.cleanup_expired_requests()
        matching_requests = [
            asdict(request) for request in self.requests.values()
            if request.zone == zone
        ]
        return matching_requests
    
    def get_requests_by_urgency(self, urgency: str) -> List[Dict]:
        """Retourne les requêtes par niveau d'urgence"""
        
        self.cleanup_expired_requests()
        matching_requests = [
            asdict(request) for request in self.requests.values()
            if request.urgence == urgency
        ]
        return matching_requests

# Instance globale du service
collection_service = CollectionRequestService()