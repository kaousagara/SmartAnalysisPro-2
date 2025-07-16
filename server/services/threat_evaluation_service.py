"""
Service de réévaluation automatique des menaces, prédictions et prescriptions
Version 2.3.0 - Système de réévaluation basé sur clustering
"""

import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from services.document_clustering_service import DocumentClusteringService
from services.prescription_service import PrescriptionService
from optimized_database import optimized_db
from cache_manager import cache_manager
import logging

logger = logging.getLogger(__name__)

class ThreatEvaluationService:
    """Service pour la réévaluation automatique des menaces basée sur le clustering"""
    
    def __init__(self):
        self.clustering_service = DocumentClusteringService()
        self.prescription_service = PrescriptionService()
        
    def evaluate_new_document(self, document: Dict) -> Dict:
        """
        Évalue un nouveau document et réévalue les menaces/prescriptions du cluster
        
        Args:
            document: Document nouvellement inséré
            
        Returns:
            Dict: Résultat de l'évaluation avec menaces, prédictions, prescriptions
        """
        try:
            # 1. Obtenir tous les documents de la base pour le clustering
            all_documents = optimized_db.get_all_documents_cached()
            
            # 2. Effectuer le clustering avec le nouveau document
            clustering_result = self.clustering_service.cluster_documents_by_similarity(all_documents)
            
            if 'error' in clustering_result:
                return {'error': f'Erreur clustering: {clustering_result["error"]}'}
            
            # 3. Identifier le cluster du nouveau document
            document_cluster = self._find_document_cluster(document, clustering_result)
            
            if not document_cluster:
                return {'error': 'Impossible de déterminer le cluster du document'}
            
            # 4. Récupérer tous les documents du même cluster
            cluster_documents = self._get_cluster_documents(document_cluster, all_documents)
            
            # 5. Réévaluer les menaces pour ce cluster
            threat_evaluation = self._evaluate_cluster_threats(cluster_documents, document)
            
            # 6. Réévaluer les prédictions pour ce cluster
            prediction_evaluation = self._evaluate_cluster_predictions(cluster_documents, document)
            
            # 7. Réévaluer les prescriptions pour ce cluster
            prescription_evaluation = self._evaluate_cluster_prescriptions(cluster_documents, document)
            
            # 8. Invalider les caches pertinents
            self._invalidate_related_caches()
            
            return {
                'success': True,
                'document_id': document.get('id'),
                'cluster_id': document_cluster['id'],
                'cluster_size': len(cluster_documents),
                'threats': threat_evaluation,
                'predictions': prediction_evaluation,
                'prescriptions': prescription_evaluation,
                'processing_time': time.time() - time.time(),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erreur lors de l'évaluation du document: {e}")
            return {'error': str(e)}
    
    def _find_document_cluster(self, document: Dict, clustering_result: Dict) -> Optional[Dict]:
        """Trouve le cluster auquel appartient le document"""
        try:
            clusters = clustering_result.get('clusters', [])
            document_content = document.get('content', '').lower()
            
            # Recherche par similarité de contenu
            for cluster in clusters:
                cluster_docs = cluster.get('documents', [])
                for doc in cluster_docs:
                    if doc.get('content', '').lower() == document_content:
                        return cluster
                    
                # Recherche par similarité thématique
                cluster_theme = cluster.get('theme', '').lower()
                if cluster_theme and cluster_theme in document_content:
                    return cluster
            
            # Si pas trouvé, retourner le premier cluster ou créer un nouveau
            if clusters:
                return clusters[0]
            
            return None
            
        except Exception as e:
            logger.error(f"Erreur lors de la recherche du cluster: {e}")
            return None
    
    def _get_cluster_documents(self, cluster: Dict, all_documents: List[Dict]) -> List[Dict]:
        """Récupère tous les documents d'un cluster"""
        try:
            cluster_docs = cluster.get('documents', [])
            doc_ids = [doc.get('id') for doc in cluster_docs if doc.get('id')]
            
            # Filtrer les documents de la base par ID
            cluster_documents = [
                doc for doc in all_documents 
                if doc.get('id') in doc_ids
            ]
            
            return cluster_documents
            
        except Exception as e:
            logger.error(f"Erreur lors de la récupération des documents du cluster: {e}")
            return []
    
    def _evaluate_cluster_threats(self, cluster_documents: List[Dict], new_document: Dict) -> Dict:
        """Évalue les menaces pour un cluster de documents"""
        try:
            threat_results = {
                'updated_threats': [],
                'new_threats': [],
                'total_processed': 0
            }
            
            # Analyser chaque document du cluster
            for doc in cluster_documents:
                doc_id = doc.get('id')
                
                # Calculer le score de menace basé sur le cluster
                threat_score = self._calculate_cluster_threat_score(doc, cluster_documents)
                
                # Vérifier si une menace existe déjà pour ce document
                existing_threat = self._get_existing_threat(doc_id)
                
                if existing_threat:
                    # Réévaluer la menace existante
                    updated_threat = self._update_threat(existing_threat, threat_score, cluster_documents)
                    threat_results['updated_threats'].append(updated_threat)
                else:
                    # Créer une nouvelle menace
                    new_threat = self._create_new_threat(doc, threat_score, cluster_documents)
                    threat_results['new_threats'].append(new_threat)
                
                threat_results['total_processed'] += 1
            
            return threat_results
            
        except Exception as e:
            logger.error(f"Erreur lors de l'évaluation des menaces: {e}")
            return {'error': str(e)}
    
    def _evaluate_cluster_predictions(self, cluster_documents: List[Dict], new_document: Dict) -> Dict:
        """Évalue les prédictions pour un cluster de documents"""
        try:
            prediction_results = {
                'updated_predictions': [],
                'new_predictions': [],
                'total_processed': 0
            }
            
            # Analyser les tendances du cluster
            cluster_trends = self._analyze_cluster_trends(cluster_documents)
            
            # Générer ou mettre à jour les prédictions
            for trend in cluster_trends:
                existing_prediction = self._get_existing_prediction(trend['pattern'])
                
                if existing_prediction:
                    # Réévaluer la prédiction existante
                    updated_prediction = self._update_prediction(existing_prediction, trend, cluster_documents)
                    prediction_results['updated_predictions'].append(updated_prediction)
                else:
                    # Créer une nouvelle prédiction
                    new_prediction = self._create_new_prediction(trend, cluster_documents)
                    prediction_results['new_predictions'].append(new_prediction)
                
                prediction_results['total_processed'] += 1
            
            return prediction_results
            
        except Exception as e:
            logger.error(f"Erreur lors de l'évaluation des prédictions: {e}")
            return {'error': str(e)}
    
    def _evaluate_cluster_prescriptions(self, cluster_documents: List[Dict], new_document: Dict) -> Dict:
        """Évalue les prescriptions pour un cluster de documents"""
        try:
            prescription_results = {
                'updated_prescriptions': [],
                'new_prescriptions': [],
                'total_processed': 0
            }
            
            # Analyser les besoins en prescriptions du cluster
            cluster_needs = self._analyze_cluster_prescription_needs(cluster_documents)
            
            # Générer ou mettre à jour les prescriptions
            for need in cluster_needs:
                existing_prescription = self._get_existing_prescription(need['type'])
                
                if existing_prescription:
                    # Réévaluer la prescription existante
                    updated_prescription = self._update_prescription(existing_prescription, need, cluster_documents)
                    prescription_results['updated_prescriptions'].append(updated_prescription)
                else:
                    # Créer une nouvelle prescription
                    new_prescription = self._create_new_prescription(need, cluster_documents)
                    prescription_results['new_prescriptions'].append(new_prescription)
                
                prescription_results['total_processed'] += 1
            
            return prescription_results
            
        except Exception as e:
            logger.error(f"Erreur lors de l'évaluation des prescriptions: {e}")
            return {'error': str(e)}
    
    def _calculate_cluster_threat_score(self, document: Dict, cluster_documents: List[Dict]) -> float:
        """Calcule le score de menace basé sur le contexte du cluster"""
        try:
            base_score = document.get('threat_score', 0.5)
            
            # Facteurs d'augmentation basés sur le cluster
            cluster_factor = len(cluster_documents) * 0.1  # Plus de documents = plus de risque
            
            # Analyse des mots-clés critiques dans le cluster
            critical_keywords = ['urgent', 'critique', 'menace', 'danger', 'alerte']
            keyword_factor = 0
            
            for doc in cluster_documents:
                content = doc.get('content', '').lower()
                keyword_count = sum(1 for keyword in critical_keywords if keyword in content)
                keyword_factor += keyword_count * 0.05
            
            # Score final ajusté
            adjusted_score = min(1.0, base_score + cluster_factor + keyword_factor)
            
            return adjusted_score
            
        except Exception as e:
            logger.error(f"Erreur calcul score menace: {e}")
            return 0.5
    
    def _get_existing_threat(self, document_id: str) -> Optional[Dict]:
        """Récupère une menace existante pour un document"""
        try:
            threat = optimized_db.execute_query(
                "SELECT * FROM threats WHERE metadata->>'document_id' = %s",
                (str(document_id),), fetch_one=True
            )
            return threat
        except Exception as e:
            logger.error(f"Erreur récupération menace: {e}")
            return None
    
    def _update_threat(self, existing_threat: Dict, new_score: float, cluster_documents: List[Dict]) -> Dict:
        """Met à jour une menace existante"""
        try:
            threat_id = existing_threat['id']
            
            # Calculer les changements
            old_score = existing_threat.get('score', 0)
            score_change = new_score - old_score
            
            # Déterminer la nouvelle sévérité
            if new_score >= 0.8:
                severity = 'critical'
            elif new_score >= 0.6:
                severity = 'high'
            elif new_score >= 0.4:
                severity = 'medium'
            else:
                severity = 'low'
            
            # Mettre à jour en base
            optimized_db.execute_query("""
                UPDATE threats 
                SET score = %s, severity = %s, 
                    metadata = jsonb_set(metadata, '{cluster_size}', %s),
                    updated_at = NOW()
                WHERE id = %s
            """, (new_score, severity, json.dumps(len(cluster_documents)), threat_id))
            
            return {
                'id': threat_id,
                'old_score': old_score,
                'new_score': new_score,
                'score_change': score_change,
                'severity': severity,
                'cluster_size': len(cluster_documents),
                'action': 'updated'
            }
            
        except Exception as e:
            logger.error(f"Erreur mise à jour menace: {e}")
            return {'error': str(e)}
    
    def _create_new_threat(self, document: Dict, threat_score: float, cluster_documents: List[Dict]) -> Dict:
        """Crée une nouvelle menace"""
        try:
            # Déterminer la sévérité
            if threat_score >= 0.8:
                severity = 'critical'
            elif threat_score >= 0.6:
                severity = 'high'
            elif threat_score >= 0.4:
                severity = 'medium'
            else:
                severity = 'low'
            
            # Créer la menace
            threat_data = {
                'name': f"Menace détectée - {document.get('name', 'Document')}",
                'description': f"Menace identifiée dans le cluster de {len(cluster_documents)} documents",
                'score': threat_score,
                'severity': severity,
                'status': 'active',
                'metadata': {
                    'document_id': document.get('id'),
                    'cluster_size': len(cluster_documents),
                    'source': 'cluster_analysis',
                    'created_by': 'threat_evaluation_service'
                }
            }
            
            # Insérer en base
            threat_id = optimized_db.execute_query("""
                INSERT INTO threats (name, description, score, severity, status, metadata, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, NOW())
                RETURNING id
            """, (
                threat_data['name'],
                threat_data['description'],
                threat_data['score'],
                threat_data['severity'],
                threat_data['status'],
                json.dumps(threat_data['metadata'])
            ), fetch_one=True)
            
            return {
                'id': threat_id['id'] if threat_id else None,
                'score': threat_score,
                'severity': severity,
                'cluster_size': len(cluster_documents),
                'action': 'created'
            }
            
        except Exception as e:
            logger.error(f"Erreur création menace: {e}")
            return {'error': str(e)}
    
    def _analyze_cluster_trends(self, cluster_documents: List[Dict]) -> List[Dict]:
        """Analyse les tendances dans un cluster de documents"""
        try:
            trends = []
            
            # Analyser les mots-clés fréquents
            keyword_frequency = {}
            for doc in cluster_documents:
                content = doc.get('content', '').lower()
                words = content.split()
                for word in words:
                    if len(word) > 3:  # Ignorer les mots trop courts
                        keyword_frequency[word] = keyword_frequency.get(word, 0) + 1
            
            # Identifier les tendances significatives
            for keyword, frequency in keyword_frequency.items():
                if frequency >= 2:  # Mot apparaît dans au moins 2 documents
                    trends.append({
                        'pattern': keyword,
                        'frequency': frequency,
                        'confidence': min(1.0, frequency / len(cluster_documents)),
                        'type': 'keyword_trend'
                    })
            
            return trends[:5]  # Limiter aux 5 tendances principales
            
        except Exception as e:
            logger.error(f"Erreur analyse tendances: {e}")
            return []
    
    def _get_existing_prediction(self, pattern: str) -> Optional[Dict]:
        """Récupère une prédiction existante pour un pattern"""
        try:
            prediction = optimized_db.execute_query(
                "SELECT * FROM predictions WHERE pattern = %s",
                (pattern,), fetch_one=True
            )
            return prediction
        except Exception as e:
            logger.error(f"Erreur récupération prédiction: {e}")
            return None
    
    def _update_prediction(self, existing_prediction: Dict, trend: Dict, cluster_documents: List[Dict]) -> Dict:
        """Met à jour une prédiction existante"""
        try:
            prediction_id = existing_prediction['id']
            new_confidence = trend['confidence']
            
            # Mettre à jour en base
            optimized_db.execute_query("""
                UPDATE predictions 
                SET confidence = %s, frequency = %s, updated_at = NOW()
                WHERE id = %s
            """, (new_confidence, trend['frequency'], prediction_id))
            
            return {
                'id': prediction_id,
                'pattern': trend['pattern'],
                'confidence': new_confidence,
                'frequency': trend['frequency'],
                'action': 'updated'
            }
            
        except Exception as e:
            logger.error(f"Erreur mise à jour prédiction: {e}")
            return {'error': str(e)}
    
    def _create_new_prediction(self, trend: Dict, cluster_documents: List[Dict]) -> Dict:
        """Crée une nouvelle prédiction"""
        try:
            # Créer la prédiction
            prediction_data = {
                'pattern': trend['pattern'],
                'confidence': trend['confidence'],
                'frequency': trend['frequency'],
                'type': trend['type'],
                'cluster_size': len(cluster_documents)
            }
            
            # Insérer en base
            prediction_id = optimized_db.execute_query("""
                INSERT INTO predictions (pattern, confidence, frequency, type, cluster_size, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                RETURNING id
            """, (
                prediction_data['pattern'],
                prediction_data['confidence'],
                prediction_data['frequency'],
                prediction_data['type'],
                prediction_data['cluster_size']
            ), fetch_one=True)
            
            return {
                'id': prediction_id['id'] if prediction_id else None,
                'pattern': trend['pattern'],
                'confidence': trend['confidence'],
                'frequency': trend['frequency'],
                'action': 'created'
            }
            
        except Exception as e:
            logger.error(f"Erreur création prédiction: {e}")
            return {'error': str(e)}
    
    def _analyze_cluster_prescription_needs(self, cluster_documents: List[Dict]) -> List[Dict]:
        """Analyse les besoins en prescriptions pour un cluster"""
        try:
            needs = []
            
            # Analyser les types de documents et leurs besoins
            doc_types = {}
            for doc in cluster_documents:
                doc_type = doc.get('type', 'unknown')
                doc_types[doc_type] = doc_types.get(doc_type, 0) + 1
            
            # Générer des besoins en prescriptions
            for doc_type, count in doc_types.items():
                if count >= 2:  # Au moins 2 documents du même type
                    needs.append({
                        'type': f'security_review_{doc_type}',
                        'priority': 'medium' if count < 5 else 'high',
                        'description': f'Révision de sécurité pour {count} documents de type {doc_type}',
                        'document_count': count
                    })
            
            return needs
            
        except Exception as e:
            logger.error(f"Erreur analyse besoins prescriptions: {e}")
            return []
    
    def _get_existing_prescription(self, prescription_type: str) -> Optional[Dict]:
        """Récupère une prescription existante"""
        try:
            prescription = optimized_db.execute_query(
                "SELECT * FROM prescriptions WHERE type = %s",
                (prescription_type,), fetch_one=True
            )
            return prescription
        except Exception as e:
            logger.error(f"Erreur récupération prescription: {e}")
            return None
    
    def _update_prescription(self, existing_prescription: Dict, need: Dict, cluster_documents: List[Dict]) -> Dict:
        """Met à jour une prescription existante"""
        try:
            prescription_id = existing_prescription['id']
            
            # Mettre à jour en base
            optimized_db.execute_query("""
                UPDATE prescriptions 
                SET priority = %s, description = %s, updated_at = NOW()
                WHERE id = %s
            """, (need['priority'], need['description'], prescription_id))
            
            return {
                'id': prescription_id,
                'type': need['type'],
                'priority': need['priority'],
                'description': need['description'],
                'action': 'updated'
            }
            
        except Exception as e:
            logger.error(f"Erreur mise à jour prescription: {e}")
            return {'error': str(e)}
    
    def _create_new_prescription(self, need: Dict, cluster_documents: List[Dict]) -> Dict:
        """Crée une nouvelle prescription"""
        try:
            # Créer la prescription
            prescription_data = {
                'type': need['type'],
                'priority': need['priority'],
                'description': need['description'],
                'status': 'pending',
                'cluster_size': len(cluster_documents)
            }
            
            # Insérer en base
            prescription_id = optimized_db.execute_query("""
                INSERT INTO prescriptions (type, priority, description, status, cluster_size, created_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                RETURNING id
            """, (
                prescription_data['type'],
                prescription_data['priority'],
                prescription_data['description'],
                prescription_data['status'],
                prescription_data['cluster_size']
            ), fetch_one=True)
            
            return {
                'id': prescription_id['id'] if prescription_id else None,
                'type': need['type'],
                'priority': need['priority'],
                'description': need['description'],
                'action': 'created'
            }
            
        except Exception as e:
            logger.error(f"Erreur création prescription: {e}")
            return {'error': str(e)}
    
    def _invalidate_related_caches(self):
        """Invalide les caches liés aux évaluations"""
        try:
            cache_patterns = [
                'threats*',
                'predictions*',
                'prescriptions*',
                'dashboard*',
                'clustering*'
            ]
            
            for pattern in cache_patterns:
                cache_manager.invalidate_pattern(pattern)
                
        except Exception as e:
            logger.error(f"Erreur invalidation cache: {e}")