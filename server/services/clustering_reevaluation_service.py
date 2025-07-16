
from typing import Dict, List, Optional, Set
import logging
from datetime import datetime
import json

logger = logging.getLogger(__name__)

class ClusteringReevaluationService:
    def __init__(self):
        self.threat_service = None
        self.prescription_service = None
        self.clustering_service = None
        self.database = None
        
    def _initialize_services(self):
        """Initialiser les services de manière lazy"""
        if not self.threat_service:
            from .threat_service import ThreatService
            self.threat_service = ThreatService()
        
        if not self.prescription_service:
            from .prescription_service import PrescriptionService
            self.prescription_service = PrescriptionService()
            
        if not self.clustering_service:
            from .document_clustering_service import DocumentClusteringService
            self.clustering_service = DocumentClusteringService()
            
        if not self.database:
            from ..optimized_database import OptimizedDatabase
            self.database = OptimizedDatabase()
    
    def process_new_document_insertion(self, new_document: Dict) -> Dict:
        """Traiter l'insertion d'un nouveau document et réévaluer les éléments concernés"""
        try:
            self._initialize_services()
            
            # 1. Récupérer tous les documents existants
            existing_documents = self.database.get_all_documents_cached()
            
            # 2. Ajouter le nouveau document pour l'analyse
            all_documents = existing_documents + [new_document]
            
            # 3. Effectuer le clustering complet
            clustering_result = self.clustering_service.cluster_documents_by_similarity(all_documents)
            
            # 4. Identifier le cluster du nouveau document
            affected_cluster = self._find_document_cluster(new_document, clustering_result)
            
            if not affected_cluster:
                logger.info("Nouveau document forme un cluster isolé")
                return self._process_isolated_document(new_document)
            
            # 5. Réévaluer les menaces, prédictions et prescriptions du cluster
            reevaluation_result = self._reevaluate_cluster_elements(affected_cluster, new_document)
            
            return {
                'status': 'success',
                'cluster_id': affected_cluster.get('id'),
                'cluster_size': affected_cluster.get('size', 0),
                'reevaluation_result': reevaluation_result,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erreur lors du traitement de réévaluation: {str(e)}")
            return {'status': 'error', 'message': str(e)}
    
    def _find_document_cluster(self, document: Dict, clustering_result: Dict) -> Optional[Dict]:
        """Trouver le cluster contenant le document spécifié"""
        try:
            document_hash = document.get('metadata', {}).get('hash')
            if not document_hash:
                return None
            
            for cluster in clustering_result.get('clusters', []):
                for cluster_doc in cluster.get('documents', []):
                    if cluster_doc.get('metadata', {}).get('hash') == document_hash:
                        return cluster
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur recherche cluster: {str(e)}")
            return None
    
    def _process_isolated_document(self, document: Dict) -> Dict:
        """Traiter un document qui forme un cluster isolé"""
        try:
            # Générer une nouvelle menace pour ce document
            threat_data = self.threat_service.process_threat_data(document)
            
            # Générer une prescription basée sur cette menace
            prescription = self.prescription_service.generate_prescription_from_threat(threat_data)
            
            # Stocker en base de données
            self.database.store_threat(threat_data)
            self.database.store_prescription(prescription)
            
            return {
                'type': 'new_creation',
                'threat_created': threat_data.get('id'),
                'prescription_created': prescription.get('id'),
                'message': 'Nouveaux éléments créés pour document isolé'
            }
            
        except Exception as e:
            logger.error(f"Erreur traitement document isolé: {str(e)}")
            return {'type': 'error', 'message': str(e)}
    
    def _reevaluate_cluster_elements(self, cluster: Dict, new_document: Dict) -> Dict:
        """Réévaluer tous les éléments d'un cluster affecté"""
        try:
            cluster_documents = cluster.get('documents', [])
            
            # Récupérer les menaces existantes pour ce cluster
            existing_threats = self._get_existing_threats_for_cluster(cluster_documents)
            
            # Récupérer les prescriptions existantes pour ce cluster
            existing_prescriptions = self._get_existing_prescriptions_for_cluster(cluster_documents)
            
            # Réévaluer ou créer les menaces
            threat_results = self._reevaluate_threats(cluster_documents, existing_threats, new_document)
            
            # Réévaluer ou créer les prescriptions
            prescription_results = self._reevaluate_prescriptions(cluster_documents, existing_prescriptions, threat_results, new_document)
            
            return {
                'threats': threat_results,
                'prescriptions': prescription_results,
                'cluster_size': len(cluster_documents),
                'reevaluation_timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erreur réévaluation cluster: {str(e)}")
            return {'error': str(e)}
    
    def _get_existing_threats_for_cluster(self, cluster_documents: List[Dict]) -> List[Dict]:
        """Récupérer les menaces existantes pour les documents du cluster"""
        try:
            existing_threats = []
            document_hashes = [doc.get('metadata', {}).get('hash') for doc in cluster_documents]
            
            # Récupérer les menaces associées à ces documents
            all_threats = self.database.get_all_threats()
            
            for threat in all_threats:
                threat_document_hash = threat.get('raw_data', {}).get('metadata', {}).get('hash')
                if threat_document_hash in document_hashes:
                    existing_threats.append(threat)
            
            return existing_threats
            
        except Exception as e:
            logger.error(f"Erreur récupération menaces existantes: {str(e)}")
            return []
    
    def _get_existing_prescriptions_for_cluster(self, cluster_documents: List[Dict]) -> List[Dict]:
        """Récupérer les prescriptions existantes pour les documents du cluster"""
        try:
            existing_prescriptions = []
            document_hashes = [doc.get('metadata', {}).get('hash') for doc in cluster_documents]
            
            # Récupérer toutes les prescriptions
            all_prescriptions = self.prescription_service.get_prescriptions()
            
            for prescription in all_prescriptions:
                # Vérifier si la prescription est liée à un document du cluster
                if self._is_prescription_related_to_cluster(prescription, document_hashes):
                    existing_prescriptions.append(prescription)
            
            return existing_prescriptions
            
        except Exception as e:
            logger.error(f"Erreur récupération prescriptions existantes: {str(e)}")
            return []
    
    def _is_prescription_related_to_cluster(self, prescription: Dict, document_hashes: List[str]) -> bool:
        """Vérifier si une prescription est liée aux documents du cluster"""
        try:
            # Vérifier via l'ID de menace
            threat_id = prescription.get('threat_id')
            if threat_id:
                # Récupérer la menace associée
                all_threats = self.database.get_all_threats()
                for threat in all_threats:
                    if threat.get('id') == threat_id:
                        threat_hash = threat.get('raw_data', {}).get('metadata', {}).get('hash')
                        return threat_hash in document_hashes
            
            # Vérifier via l'analyse de similarité si disponible
            similarity_analysis = prescription.get('similarity_analysis', {})
            if similarity_analysis:
                similar_threats = similarity_analysis.get('similar_threats', [])
                for similar_threat in similar_threats:
                    threat_hash = similar_threat.get('metadata', {}).get('hash')
                    if threat_hash in document_hashes:
                        return True
            
            return False
            
        except Exception as e:
            logger.error(f"Erreur vérification relation prescription-cluster: {str(e)}")
            return False
    
    def _reevaluate_threats(self, cluster_documents: List[Dict], existing_threats: List[Dict], new_document: Dict) -> Dict:
        """Réévaluer les menaces du cluster"""
        try:
            results = {
                'updated': [],
                'created': [],
                'errors': []
            }
            
            # Créer un mapping des documents par hash
            document_by_hash = {
                doc.get('metadata', {}).get('hash'): doc 
                for doc in cluster_documents 
                if doc.get('metadata', {}).get('hash')
            }
            
            # Réévaluer les menaces existantes
            for threat in existing_threats:
                try:
                    original_hash = threat.get('raw_data', {}).get('metadata', {}).get('hash')
                    if original_hash in document_by_hash:
                        # Recalculer avec le contexte du cluster complet
                        updated_threat = self._recalculate_threat_with_cluster_context(
                            threat, cluster_documents, new_document
                        )
                        
                        # Mettre à jour en base
                        self.database.update_threat(updated_threat)
                        results['updated'].append({
                            'threat_id': updated_threat.get('id'),
                            'old_score': threat.get('score'),
                            'new_score': updated_threat.get('score'),
                            'delta': updated_threat.get('score', 0) - threat.get('score', 0)
                        })
                        
                except Exception as e:
                    results['errors'].append({
                        'threat_id': threat.get('id'),
                        'error': str(e)
                    })
            
            # Créer de nouvelles menaces pour les documents non couverts
            covered_hashes = {threat.get('raw_data', {}).get('metadata', {}).get('hash') for threat in existing_threats}
            
            for document in cluster_documents:
                doc_hash = document.get('metadata', {}).get('hash')
                if doc_hash and doc_hash not in covered_hashes:
                    try:
                        new_threat = self.threat_service.process_threat_data(document)
                        self.database.store_threat(new_threat)
                        results['created'].append(new_threat.get('id'))
                    except Exception as e:
                        results['errors'].append({
                            'document_hash': doc_hash,
                            'error': str(e)
                        })
            
            return results
            
        except Exception as e:
            logger.error(f"Erreur réévaluation menaces: {str(e)}")
            return {'error': str(e)}
    
    def _recalculate_threat_with_cluster_context(self, original_threat: Dict, cluster_documents: List[Dict], new_document: Dict) -> Dict:
        """Recalculer une menace avec le contexte complet du cluster"""
        try:
            # Récupérer le document original
            original_document = original_threat.get('raw_data', {})
            
            # Enrichir avec le contexte du cluster
            enriched_context = {
                'cluster_size': len(cluster_documents),
                'cluster_documents': cluster_documents,
                'new_document_impact': new_document,
                'similar_documents_count': len(cluster_documents) - 1
            }
            
            # Recalculer le score de base
            base_score = self.threat_service._calculate_simple_score(original_document)
            
            # Appliquer le facteur de cluster
            cluster_factor = min(1.0 + (len(cluster_documents) - 1) * 0.1, 1.5)  # Max 50% d'augmentation
            adjusted_score = min(base_score * cluster_factor, 1.0)
            
            # Mettre à jour la menace
            updated_threat = original_threat.copy()
            updated_threat['score'] = adjusted_score
            updated_threat['cluster_context'] = enriched_context
            updated_threat['last_reevaluation'] = datetime.now().isoformat()
            updated_threat['reevaluation_reason'] = 'cluster_document_addition'
            
            return updated_threat
            
        except Exception as e:
            logger.error(f"Erreur recalcul menace avec contexte: {str(e)}")
            return original_threat
    
    def _reevaluate_prescriptions(self, cluster_documents: List[Dict], existing_prescriptions: List[Dict], 
                                threat_results: Dict, new_document: Dict) -> Dict:
        """Réévaluer les prescriptions du cluster"""
        try:
            results = {
                'updated': [],
                'created': [],
                'errors': []
            }
            
            # Réévaluer les prescriptions existantes
            for prescription in existing_prescriptions:
                try:
                    updated_prescription = self._update_prescription_with_cluster_context(
                        prescription, cluster_documents, threat_results, new_document
                    )
                    
                    # Mettre à jour en base
                    self.prescription_service.prescriptions = [
                        updated_prescription if p.get('id') == prescription.get('id') else p
                        for p in self.prescription_service.prescriptions
                    ]
                    
                    results['updated'].append({
                        'prescription_id': updated_prescription.get('id'),
                        'actions_added': len(updated_prescription.get('actions', [])) - len(prescription.get('actions', [])),
                        'priority_changed': updated_prescription.get('priority') != prescription.get('priority')
                    })
                    
                except Exception as e:
                    results['errors'].append({
                        'prescription_id': prescription.get('id'),
                        'error': str(e)
                    })
            
            # Créer de nouvelles prescriptions pour les nouvelles menaces
            for created_threat_id in threat_results.get('created', []):
                try:
                    # Récupérer la menace créée
                    threat_data = self.database.get_threat_by_id(created_threat_id)
                    if threat_data:
                        new_prescription = self.prescription_service.generate_prescription_from_threat(threat_data)
                        results['created'].append(new_prescription.get('id'))
                        
                except Exception as e:
                    results['errors'].append({
                        'threat_id': created_threat_id,
                        'error': str(e)
                    })
            
            return results
            
        except Exception as e:
            logger.error(f"Erreur réévaluation prescriptions: {str(e)}")
            return {'error': str(e)}
    
    def _update_prescription_with_cluster_context(self, prescription: Dict, cluster_documents: List[Dict], 
                                                threat_results: Dict, new_document: Dict) -> Dict:
        """Mettre à jour une prescription avec le contexte du cluster"""
        try:
            updated_prescription = prescription.copy()
            
            # Ajouter des actions spécifiques au contexte cluster
            cluster_actions = [
                {
                    'id': f"cluster_action_{datetime.now().timestamp()}",
                    'description': f'Analyser la corrélation avec {len(cluster_documents)} documents similaires',
                    'type': 'manual',
                    'completed': False,
                    'details': f'Nouveau document ajouté au cluster - réévaluation nécessaire',
                    'priority': 'medium',
                    'cluster_context': True
                }
            ]
            
            # Augmenter la priorité si le cluster est important
            if len(cluster_documents) >= 5:
                if updated_prescription.get('priority') == 'medium':
                    updated_prescription['priority'] = 'high'
                elif updated_prescription.get('priority') == 'low':
                    updated_prescription['priority'] = 'medium'
                    
                cluster_actions.append({
                    'id': f"urgent_cluster_action_{datetime.now().timestamp()}",
                    'description': f'Escalader l\'analyse - cluster de {len(cluster_documents)} documents détecté',
                    'type': 'manual',
                    'completed': False,
                    'details': 'Cluster important nécessitant attention prioritaire',
                    'priority': 'high',
                    'cluster_context': True
                })
            
            # Ajouter les nouvelles actions
            existing_actions = updated_prescription.get('actions', [])
            updated_prescription['actions'] = existing_actions + cluster_actions
            
            # Mettre à jour les métadonnées
            updated_prescription['cluster_reevaluation'] = {
                'timestamp': datetime.now().isoformat(),
                'cluster_size': len(cluster_documents),
                'reason': 'new_document_addition',
                'threat_updates': len(threat_results.get('updated', [])),
                'new_threats': len(threat_results.get('created', []))
            }
            
            return updated_prescription
            
        except Exception as e:
            logger.error(f"Erreur mise à jour prescription avec contexte: {str(e)}")
            return prescription
