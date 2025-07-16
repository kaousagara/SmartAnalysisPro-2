from typing import Dict, List, Optional, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans, DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import PCA
import json
from datetime import datetime
import hashlib
import re
import time
from threading import Lock
from functools import lru_cache

class DocumentClusteringService:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words=None,  # Sera configuré selon la langue
            ngram_range=(1, 3),
            min_df=2,
            max_df=0.8
        )
        self.clusters = {}
        self.document_vectors = {}
        self.cluster_models = {}
        self.similarity_threshold = 0.7
        self.min_cluster_size = 2
        self.cache_lock = Lock()
        self.vectorizer_cache = {}
        self.cluster_cache = {}
        
    @lru_cache(maxsize=1000)
    def preprocess_text(self, text: str) -> str:
        """Prétraitement du texte pour l'analyse avec cache"""
        # Nettoyer le texte
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Supprimer les mots très courts
        words = [word for word in text.split() if len(word) > 2]
        
        return ' '.join(words)
    
    def extract_semantic_features(self, documents: List[Dict]) -> Dict:
        """Extraire les caractéristiques sémantiques des documents"""
        features = {
            'texts': [],
            'metadata': [],
            'temporal_info': [],
            'entity_info': []
        }
        
        for doc in documents:
            # Texte principal
            content = doc.get('content', '')
            if isinstance(content, dict):
                content = content.get('text', '')
            
            preprocessed_text = self.preprocess_text(content)
            features['texts'].append(preprocessed_text)
            
            # Métadonnées
            metadata = {
                'source': doc.get('source', ''),
                'type': doc.get('type', ''),
                'classification': doc.get('classification', ''),
                'threat_score': doc.get('threat_score', 0.0)
            }
            features['metadata'].append(metadata)
            
            # Information temporelle
            temporal = {
                'created_at': doc.get('created_at', ''),
                'processed_at': doc.get('processed_at', ''),
                'time_period': self._extract_time_period(doc.get('created_at', ''))
            }
            features['temporal_info'].append(temporal)
            
            # Information sur les entités
            entities = doc.get('entities', [])
            entity_info = {
                'persons': [e.get('text', '') for e in entities if e.get('type') == 'PERSON'],
                'organizations': [e.get('text', '') for e in entities if e.get('type') == 'ORGANIZATION'],
                'locations': [e.get('text', '') for e in entities if e.get('type') == 'LOCATION'],
                'entity_count': len(entities)
            }
            features['entity_info'].append(entity_info)
        
        return features
    
    def _extract_time_period(self, timestamp: str) -> str:
        """Extraire la période temporelle d'un timestamp"""
        try:
            if timestamp:
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                return f"{dt.year}-{dt.month:02d}"
        except:
            pass
        return "unknown"
    
    def calculate_document_similarity(self, doc1: Dict, doc2: Dict) -> float:
        """Calculer la similarité entre deux documents"""
        # Similarité textuelle
        text1 = self.preprocess_text(doc1.get('content', ''))
        text2 = self.preprocess_text(doc2.get('content', ''))
        
        if not text1 or not text2:
            return 0.0
        
        # Vectorisation TF-IDF
        vectors = self.vectorizer.fit_transform([text1, text2])
        text_similarity = cosine_similarity(vectors[0:1], vectors[1:2])[0][0]
        
        # Similarité des entités
        entities1 = set(e.get('text', '').lower() for e in doc1.get('entities', []))
        entities2 = set(e.get('text', '').lower() for e in doc2.get('entities', []))
        
        if entities1 and entities2:
            entity_similarity = len(entities1.intersection(entities2)) / len(entities1.union(entities2))
        else:
            entity_similarity = 0.0
        
        # Similarité temporelle
        time1 = self._extract_time_period(doc1.get('created_at', ''))
        time2 = self._extract_time_period(doc2.get('created_at', ''))
        temporal_similarity = 1.0 if time1 == time2 and time1 != "unknown" else 0.0
        
        # Similarité des métadonnées
        source_sim = 1.0 if doc1.get('source') == doc2.get('source') else 0.0
        type_sim = 1.0 if doc1.get('type') == doc2.get('type') else 0.0
        
        # Score combiné avec pondération
        combined_similarity = (
            text_similarity * 0.4 +
            entity_similarity * 0.3 +
            temporal_similarity * 0.15 +
            source_sim * 0.1 +
            type_sim * 0.05
        )
        
        return combined_similarity
    
    def cluster_documents_by_similarity(self, documents: List[Dict]) -> Dict:
        """Regrouper les documents par similarité"""
        if len(documents) < 2:
            return {'clusters': [], 'summary': {'total_documents': len(documents), 'clusters_found': 0}}
        
        # Extraire les caractéristiques
        features = self.extract_semantic_features(documents)
        
        # Créer la matrice de similarité
        n_docs = len(documents)
        similarity_matrix = np.zeros((n_docs, n_docs))
        
        for i in range(n_docs):
            for j in range(i + 1, n_docs):
                sim = self.calculate_document_similarity(documents[i], documents[j])
                similarity_matrix[i][j] = sim
                similarity_matrix[j][i] = sim
        
        # Clustering hiérarchique basé sur la similarité
        clusters = self._hierarchical_clustering(documents, similarity_matrix)
        
        # Analyser les clusters
        cluster_analysis = self._analyze_clusters(clusters, features)
        
        return {
            'clusters': clusters,
            'similarity_matrix': similarity_matrix.tolist(),
            'analysis': cluster_analysis,
            'summary': {
                'total_documents': len(documents),
                'clusters_found': len(clusters),
                'avg_cluster_size': sum(len(cluster['documents']) for cluster in clusters) / len(clusters) if clusters else 0
            }
        }
    
    def _hierarchical_clustering(self, documents: List[Dict], similarity_matrix: np.ndarray) -> List[Dict]:
        """Clustering hiérarchique des documents"""
        n_docs = len(documents)
        clusters = []
        used_docs = set()
        
        # Trouver les groupes de documents similaires
        for i in range(n_docs):
            if i in used_docs:
                continue
                
            cluster_docs = [i]
            used_docs.add(i)
            
            # Trouver tous les documents similaires
            for j in range(n_docs):
                if j != i and j not in used_docs and similarity_matrix[i][j] >= self.similarity_threshold:
                    cluster_docs.append(j)
                    used_docs.add(j)
            
            # Créer le cluster si suffisamment de documents
            if len(cluster_docs) >= self.min_cluster_size:
                cluster = {
                    'id': f"cluster_{len(clusters) + 1}",
                    'documents': [documents[idx] for idx in cluster_docs],
                    'document_indices': cluster_docs,
                    'size': len(cluster_docs),
                    'avg_similarity': np.mean([similarity_matrix[cluster_docs[i]][cluster_docs[j]] 
                                             for i in range(len(cluster_docs)) 
                                             for j in range(i + 1, len(cluster_docs))]) if len(cluster_docs) > 1 else 0.0
                }
                clusters.append(cluster)
        
        return clusters
    
    def _analyze_clusters(self, clusters: List[Dict], features: Dict) -> Dict:
        """Analyser les caractéristiques des clusters"""
        analysis = {
            'cluster_themes': [],
            'temporal_patterns': {},
            'entity_patterns': {},
            'source_distribution': {}
        }
        
        for cluster in clusters:
            cluster_id = cluster['id']
            doc_indices = cluster['document_indices']
            
            # Analyser les thèmes
            cluster_texts = [features['texts'][i] for i in doc_indices]
            theme_analysis = self._extract_cluster_themes(cluster_texts)
            
            # Analyser les patterns temporels
            temporal_data = [features['temporal_info'][i] for i in doc_indices]
            temporal_pattern = self._analyze_temporal_patterns(temporal_data)
            
            # Analyser les entités
            entity_data = [features['entity_info'][i] for i in doc_indices]
            entity_pattern = self._analyze_entity_patterns(entity_data)
            
            # Analyser la distribution des sources
            metadata = [features['metadata'][i] for i in doc_indices]
            source_dist = self._analyze_source_distribution(metadata)
            
            analysis['cluster_themes'].append({
                'cluster_id': cluster_id,
                'themes': theme_analysis,
                'confidence': theme_analysis.get('confidence', 0.0)
            })
            
            analysis['temporal_patterns'][cluster_id] = temporal_pattern
            analysis['entity_patterns'][cluster_id] = entity_pattern
            analysis['source_distribution'][cluster_id] = source_dist
        
        return analysis
    
    def _extract_cluster_themes(self, texts: List[str]) -> Dict:
        """Extraire les thèmes principaux d'un cluster"""
        if not texts:
            return {'keywords': [], 'confidence': 0.0}
        
        # Combiner tous les textes du cluster
        combined_text = ' '.join(texts)
        
        # Extraire les mots-clés les plus fréquents
        try:
            vectorizer = TfidfVectorizer(max_features=20, stop_words=None)
            tfidf_matrix = vectorizer.fit_transform([combined_text])
            feature_names = vectorizer.get_feature_names_out()
            scores = tfidf_matrix.toarray()[0]
            
            # Trier par score TF-IDF
            keyword_scores = list(zip(feature_names, scores))
            keyword_scores.sort(key=lambda x: x[1], reverse=True)
            
            keywords = [{'word': word, 'score': float(score)} for word, score in keyword_scores[:10]]
            confidence = np.mean([score for _, score in keyword_scores[:5]]) if keyword_scores else 0.0
            
            return {
                'keywords': keywords,
                'confidence': confidence,
                'theme_summary': self._generate_theme_summary(keywords)
            }
        except:
            return {'keywords': [], 'confidence': 0.0}
    
    def _generate_theme_summary(self, keywords: List[Dict]) -> str:
        """Générer un résumé thématique basé sur les mots-clés"""
        if not keywords:
            return "Thème non identifié"
        
        top_words = [kw['word'] for kw in keywords[:5]]
        return f"Thème principal: {', '.join(top_words)}"
    
    def _analyze_temporal_patterns(self, temporal_data: List[Dict]) -> Dict:
        """Analyser les patterns temporels d'un cluster"""
        periods = [data['time_period'] for data in temporal_data if data['time_period'] != 'unknown']
        
        if not periods:
            return {'pattern': 'unknown', 'periods': []}
        
        from collections import Counter
        period_counts = Counter(periods)
        
        return {
            'pattern': 'concentrated' if len(period_counts) <= 2 else 'distributed',
            'periods': dict(period_counts),
            'dominant_period': period_counts.most_common(1)[0][0] if period_counts else None
        }
    
    def _analyze_entity_patterns(self, entity_data: List[Dict]) -> Dict:
        """Analyser les patterns d'entités d'un cluster"""
        all_persons = []
        all_orgs = []
        all_locations = []
        
        for data in entity_data:
            all_persons.extend(data['persons'])
            all_orgs.extend(data['organizations'])
            all_locations.extend(data['locations'])
        
        from collections import Counter
        
        return {
            'common_persons': dict(Counter(all_persons).most_common(5)),
            'common_organizations': dict(Counter(all_orgs).most_common(5)),
            'common_locations': dict(Counter(all_locations).most_common(5)),
            'entity_diversity': len(set(all_persons + all_orgs + all_locations))
        }
    
    def _analyze_source_distribution(self, metadata: List[Dict]) -> Dict:
        """Analyser la distribution des sources d'un cluster"""
        sources = [data['source'] for data in metadata if data['source']]
        types = [data['type'] for data in metadata if data['type']]
        
        from collections import Counter
        
        return {
            'sources': dict(Counter(sources)),
            'types': dict(Counter(types)),
            'avg_threat_score': np.mean([data['threat_score'] for data in metadata if data['threat_score']])
        }
    
    def generate_cluster_insights(self, clustering_result: Dict) -> Dict:
        """Générer des insights sur les clusters pour l'analyse prédictive"""
        insights = {
            'patterns': [],
            'recommendations': [],
            'risk_assessment': {},
            'predictive_indicators': []
        }
        
        clusters = clustering_result.get('clusters', [])
        analysis = clustering_result.get('analysis', {})
        
        for cluster in clusters:
            cluster_id = cluster['id']
            cluster_size = cluster['size']
            
            # Analyser les patterns
            pattern_analysis = self._analyze_cluster_patterns(cluster, analysis)
            insights['patterns'].append(pattern_analysis)
            
            # Générer des recommandations
            recommendations = self._generate_cluster_recommendations(cluster, analysis)
            insights['recommendations'].extend(recommendations)
            
            # Évaluer les risques
            risk_assessment = self._assess_cluster_risk(cluster, analysis)
            insights['risk_assessment'][cluster_id] = risk_assessment
            
            # Identifier les indicateurs prédictifs
            predictive_indicators = self._identify_predictive_indicators(cluster, analysis)
            insights['predictive_indicators'].extend(predictive_indicators)
        
        return insights
    
    def _analyze_cluster_patterns(self, cluster: Dict, analysis: Dict) -> Dict:
        """Analyser les patterns d'un cluster"""
        cluster_id = cluster['id']
        
        # Récupérer les analyses spécifiques
        temporal_pattern = analysis.get('temporal_patterns', {}).get(cluster_id, {})
        entity_pattern = analysis.get('entity_patterns', {}).get(cluster_id, {})
        source_dist = analysis.get('source_distribution', {}).get(cluster_id, {})
        
        return {
            'cluster_id': cluster_id,
            'size': cluster['size'],
            'temporal_concentration': temporal_pattern.get('pattern') == 'concentrated',
            'dominant_entities': list(entity_pattern.get('common_persons', {}).keys())[:3],
            'source_diversity': len(source_dist.get('sources', {})),
            'avg_threat_level': source_dist.get('avg_threat_score', 0.0)
        }
    
    def _generate_cluster_recommendations(self, cluster: Dict, analysis: Dict) -> List[Dict]:
        """Générer des recommandations basées sur un cluster"""
        recommendations = []
        cluster_id = cluster['id']
        
        # Recommandations basées sur la taille du cluster
        if cluster['size'] >= 5:
            recommendations.append({
                'type': 'investigation',
                'priority': 'high',
                'description': f"Cluster {cluster_id} contient {cluster['size']} documents similaires - Investigation approfondie recommandée",
                'actions': ['Analyser la source commune', 'Vérifier les connexions entre les entités', 'Évaluer l\'escalade potentielle']
            })
        
        # Recommandations basées sur les entités
        entity_pattern = analysis.get('entity_patterns', {}).get(cluster_id, {})
        if entity_pattern.get('entity_diversity', 0) > 10:
            recommendations.append({
                'type': 'monitoring',
                'priority': 'medium',
                'description': f"Cluster {cluster_id} implique de nombreuses entités - Surveillance étendue recommandée",
                'actions': ['Cartographier le réseau d\'entités', 'Surveiller les nouvelles connexions', 'Identifier les acteurs clés']
            })
        
        return recommendations
    
    def _assess_cluster_risk(self, cluster: Dict, analysis: Dict) -> Dict:
        """Évaluer le risque d'un cluster"""
        cluster_id = cluster['id']
        source_dist = analysis.get('source_distribution', {}).get(cluster_id, {})
        
        avg_threat_score = source_dist.get('avg_threat_score', 0.0)
        cluster_size = cluster['size']
        
        # Calculer le score de risque
        risk_score = (avg_threat_score * 0.6) + (min(cluster_size / 10, 1.0) * 0.4)
        
        risk_level = 'low'
        if risk_score >= 0.7:
            risk_level = 'high'
        elif risk_score >= 0.5:
            risk_level = 'medium'
        
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'factors': {
                'avg_threat_score': avg_threat_score,
                'cluster_size': cluster_size,
                'concentration': cluster['avg_similarity']
            }
        }
    
    def _identify_predictive_indicators(self, cluster: Dict, analysis: Dict) -> List[Dict]:
        """Identifier les indicateurs prédictifs d'un cluster"""
        indicators = []
        cluster_id = cluster['id']
        
        # Indicateurs basés sur la temporalité
        temporal_pattern = analysis.get('temporal_patterns', {}).get(cluster_id, {})
        if temporal_pattern.get('pattern') == 'concentrated':
            indicators.append({
                'type': 'temporal_concentration',
                'cluster_id': cluster_id,
                'description': 'Concentration temporelle des documents - Possible coordonnation',
                'confidence': 0.8
            })
        
        # Indicateurs basés sur les entités
        entity_pattern = analysis.get('entity_patterns', {}).get(cluster_id, {})
        common_persons = entity_pattern.get('common_persons', {})
        if common_persons:
            most_common_person = max(common_persons.keys(), key=lambda x: common_persons[x])
            if common_persons[most_common_person] >= 3:
                indicators.append({
                    'type': 'entity_recurrence',
                    'cluster_id': cluster_id,
                    'description': f'Récurrence de l\'entité {most_common_person} - Possible acteur central',
                    'confidence': 0.7
                })
        
        return indicators
    
    def integrate_with_prescriptive_analysis(self, clustering_result: Dict, threat_data: List[Dict]) -> Dict:
        """Intégrer le clustering avec l'analyse prescriptive"""
        insights = self.generate_cluster_insights(clustering_result)
        
        # Générer des prescriptions basées sur les clusters
        prescriptions = []
        
        for cluster in clustering_result.get('clusters', []):
            cluster_id = cluster['id']
            risk_assessment = insights['risk_assessment'].get(cluster_id, {})
            
            if risk_assessment.get('risk_level') in ['high', 'medium']:
                prescription = {
                    'id': f"cluster_prescription_{cluster_id}",
                    'title': f"Analyse du cluster {cluster_id}",
                    'description': f"Traitement d'un cluster de {cluster['size']} documents similaires avec niveau de risque {risk_assessment.get('risk_level')}",
                    'priority': 'high' if risk_assessment.get('risk_level') == 'high' else 'medium',
                    'category': 'investigation',
                    'cluster_id': cluster_id,
                    'actions': self._generate_cluster_actions(cluster, insights),
                    'risk_score': risk_assessment.get('risk_score', 0.0),
                    'created_at': datetime.now().isoformat()
                }
                prescriptions.append(prescription)
        
        return {
            'clustering_insights': insights,
            'generated_prescriptions': prescriptions,
            'integration_summary': {
                'clusters_analyzed': len(clustering_result.get('clusters', [])),
                'prescriptions_generated': len(prescriptions),
                'high_risk_clusters': len([c for c in clustering_result.get('clusters', []) 
                                         if insights['risk_assessment'].get(c['id'], {}).get('risk_level') == 'high'])
            }
        }
    
    def _generate_cluster_actions(self, cluster: Dict, insights: Dict) -> List[Dict]:
        """Générer des actions spécifiques pour un cluster"""
        actions = []
        cluster_id = cluster['id']
        
        # Action d'analyse approfondie
        actions.append({
            'id': f"analyze_{cluster_id}",
            'description': f"Analyser en profondeur les {cluster['size']} documents du cluster {cluster_id}",
            'type': 'manual',
            'completed': False,
            'priority': 'high'
        })
        
        # Action de surveillance
        actions.append({
            'id': f"monitor_{cluster_id}",
            'description': f"Mettre en place une surveillance pour les entités identifiées dans le cluster {cluster_id}",
            'type': 'automatic',
            'completed': False,
            'priority': 'medium'
        })
        
        # Action de corrélation
        actions.append({
            'id': f"correlate_{cluster_id}",
            'description': f"Rechercher des corrélations avec d'autres sources pour le cluster {cluster_id}",
            'type': 'manual',
            'completed': False,
            'priority': 'medium'
        })
        
        return actions