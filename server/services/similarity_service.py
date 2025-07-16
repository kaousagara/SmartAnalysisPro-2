
from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
import json
import numpy as np
from collections import defaultdict
import logging

logger = logging.getLogger(__name__)

class SimilarityService:
    """Service pour regrouper les messages par similarité thématique et contextuelle"""
    
    def __init__(self):
        self.similarity_threshold = 0.7
        self.time_window_hours = 24
        self.message_clusters = {}
        self.theme_weights = {
            'sécurité': 1.0,
            'militaire': 0.9,
            'politique': 0.8,
            'économie': 0.7,
            'social': 0.6
        }
    
    def group_messages_by_similarity(self, messages: List[Dict]) -> Dict:
        """Regrouper les messages par similarité thématique et contextuelle"""
        try:
            if not messages:
                return {'clusters': [], 'total_messages': 0}
            
            # Filtrer les messages récents
            recent_messages = self._filter_recent_messages(messages)
            
            # Calculer les scores de similarité
            similarity_matrix = self._calculate_similarity_matrix(recent_messages)
            
            # Créer les clusters
            clusters = self._create_clusters(recent_messages, similarity_matrix)
            
            # Enrichir les clusters avec des métriques
            enriched_clusters = self._enrich_clusters(clusters)
            
            return {
                'clusters': enriched_clusters,
                'total_messages': len(recent_messages),
                'clustering_method': 'thematic_contextual',
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Erreur regroupement similarité: {str(e)}")
            return {'clusters': [], 'error': str(e)}
    
    def _filter_recent_messages(self, messages: List[Dict]) -> List[Dict]:
        """Filtrer les messages récents dans la fenêtre temporelle"""
        cutoff_time = datetime.now() - timedelta(hours=self.time_window_hours)
        recent_messages = []
        
        for msg in messages:
            msg_time = datetime.fromisoformat(msg.get('timestamp', datetime.now().isoformat()).replace('Z', '+00:00'))
            if msg_time >= cutoff_time:
                recent_messages.append(msg)
        
        return recent_messages
    
    def _calculate_similarity_matrix(self, messages: List[Dict]) -> np.ndarray:
        """Calculer la matrice de similarité entre messages"""
        n = len(messages)
        similarity_matrix = np.zeros((n, n))
        
        for i in range(n):
            for j in range(i, n):
                if i == j:
                    similarity_matrix[i][j] = 1.0
                else:
                    similarity = self._calculate_message_similarity(messages[i], messages[j])
                    similarity_matrix[i][j] = similarity
                    similarity_matrix[j][i] = similarity
        
        return similarity_matrix
    
    def _calculate_message_similarity(self, msg1: Dict, msg2: Dict) -> float:
        """Calculer la similarité entre deux messages"""
        # Similarité thématique
        theme_sim = self._calculate_theme_similarity(msg1, msg2)
        
        # Similarité géographique
        geo_sim = self._calculate_geographic_similarity(msg1, msg2)
        
        # Similarité temporelle
        temporal_sim = self._calculate_temporal_similarity(msg1, msg2)
        
        # Similarité des entités
        entity_sim = self._calculate_entity_similarity(msg1, msg2)
        
        # Similarité du contenu
        content_sim = self._calculate_content_similarity(msg1, msg2)
        
        # Score de similarité pondéré
        similarity_score = (
            theme_sim * 0.3 +
            geo_sim * 0.2 +
            temporal_sim * 0.15 +
            entity_sim * 0.2 +
            content_sim * 0.15
        )
        
        return similarity_score
    
    def _calculate_theme_similarity(self, msg1: Dict, msg2: Dict) -> float:
        """Calculer la similarité thématique"""
        theme1 = msg1.get('metadata', {}).get('theme_name', 'general')
        theme2 = msg2.get('metadata', {}).get('theme_name', 'general')
        
        if theme1 == theme2:
            return 1.0
        
        # Thèmes compatibles (ex: sécurité et militaire)
        compatible_themes = {
            'sécurité': ['militaire', 'politique'],
            'militaire': ['sécurité', 'politique'],
            'politique': ['sécurité', 'militaire', 'économie'],
            'économie': ['politique', 'social'],
            'social': ['économie', 'politique']
        }
        
        if theme1 in compatible_themes and theme2 in compatible_themes[theme1]:
            return 0.6
        
        return 0.1
    
    def _calculate_geographic_similarity(self, msg1: Dict, msg2: Dict) -> float:
        """Calculer la similarité géographique"""
        loc1 = msg1.get('metadata', {}).get('location', '')
        loc2 = msg2.get('metadata', {}).get('location', '')
        
        if not loc1 or not loc2:
            return 0.5  # Neutre si pas de géolocalisation
        
        # Comparaison simple de chaînes pour les lieux
        if loc1.lower() == loc2.lower():
            return 1.0
        
        # Vérifier si c'est la même région/zone
        common_locations = self._find_common_location_keywords(loc1, loc2)
        if common_locations:
            return 0.7
        
        return 0.2
    
    def _calculate_temporal_similarity(self, msg1: Dict, msg2: Dict) -> float:
        """Calculer la similarité temporelle"""
        try:
            time1 = datetime.fromisoformat(msg1.get('timestamp', '').replace('Z', '+00:00'))
            time2 = datetime.fromisoformat(msg2.get('timestamp', '').replace('Z', '+00:00'))
            
            time_diff = abs((time1 - time2).total_seconds()) / 3600  # En heures
            
            if time_diff <= 1:
                return 1.0
            elif time_diff <= 6:
                return 0.8
            elif time_diff <= 24:
                return 0.5
            else:
                return 0.2
                
        except Exception:
            return 0.5
    
    def _calculate_entity_similarity(self, msg1: Dict, msg2: Dict) -> float:
        """Calculer la similarité des entités"""
        entities1 = set(ent.get('name', '').lower() for ent in msg1.get('entities', []))
        entities2 = set(ent.get('name', '').lower() for ent in msg2.get('entities', []))
        
        if not entities1 or not entities2:
            return 0.3
        
        intersection = entities1.intersection(entities2)
        union = entities1.union(entities2)
        
        if not union:
            return 0.3
        
        jaccard_similarity = len(intersection) / len(union)
        return jaccard_similarity
    
    def _calculate_content_similarity(self, msg1: Dict, msg2: Dict) -> float:
        """Calculer la similarité du contenu textuel"""
        content1 = msg1.get('content', '').lower()
        content2 = msg2.get('content', '').lower()
        
        if not content1 or not content2:
            return 0.3
        
        # Mots-clés communs
        words1 = set(content1.split())
        words2 = set(content2.split())
        
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        
        if not union:
            return 0.3
        
        return len(intersection) / len(union)
    
    def _find_common_location_keywords(self, loc1: str, loc2: str) -> List[str]:
        """Trouver les mots-clés géographiques communs"""
        common_keywords = []
        keywords1 = loc1.lower().split()
        keywords2 = loc2.lower().split()
        
        for keyword in keywords1:
            if keyword in keywords2 and len(keyword) > 3:
                common_keywords.append(keyword)
        
        return common_keywords
    
    def _create_clusters(self, messages: List[Dict], similarity_matrix: np.ndarray) -> List[Dict]:
        """Créer des clusters basés sur la matrice de similarité"""
        n = len(messages)
        visited = [False] * n
        clusters = []
        
        for i in range(n):
            if not visited[i]:
                cluster = self._build_cluster(i, messages, similarity_matrix, visited)
                if cluster['messages']:
                    clusters.append(cluster)
        
        return clusters
    
    def _build_cluster(self, start_idx: int, messages: List[Dict], 
                      similarity_matrix: np.ndarray, visited: List[bool]) -> Dict:
        """Construire un cluster à partir d'un message de départ"""
        cluster_messages = []
        queue = [start_idx]
        visited[start_idx] = True
        
        while queue:
            current_idx = queue.pop(0)
            cluster_messages.append(messages[current_idx])
            
            # Trouver les messages similaires
            for j in range(len(messages)):
                if not visited[j] and similarity_matrix[current_idx][j] >= self.similarity_threshold:
                    visited[j] = True
                    queue.append(j)
        
        return {
            'id': f"cluster_{start_idx}_{len(cluster_messages)}",
            'messages': cluster_messages,
            'size': len(cluster_messages),
            'created_at': datetime.now().isoformat()
        }
    
    def _enrich_clusters(self, clusters: List[Dict]) -> List[Dict]:
        """Enrichir les clusters avec des métriques d'analyse"""
        enriched_clusters = []
        
        for cluster in clusters:
            messages = cluster['messages']
            
            # Analyse thématique du cluster
            theme_analysis = self._analyze_cluster_themes(messages)
            
            # Score de menace agrégé
            threat_score = self._calculate_cluster_threat_score(messages)
            
            # Évolution temporelle
            temporal_evolution = self._analyze_temporal_evolution(messages)
            
            # Entités principales
            key_entities = self._extract_key_entities(messages)
            
            enriched_cluster = {
                **cluster,
                'theme_analysis': theme_analysis,
                'aggregated_threat_score': threat_score,
                'temporal_evolution': temporal_evolution,
                'key_entities': key_entities,
                'priority': self._calculate_cluster_priority(threat_score, len(messages)),
                'analysis_timestamp': datetime.now().isoformat()
            }
            
            enriched_clusters.append(enriched_cluster)
        
        # Trier par priorité décroissante
        enriched_clusters.sort(key=lambda x: x['priority'], reverse=True)
        
        return enriched_clusters
    
    def _analyze_cluster_themes(self, messages: List[Dict]) -> Dict:
        """Analyser les thèmes dominants dans un cluster"""
        theme_counts = defaultdict(int)
        theme_confidences = defaultdict(list)
        
        for msg in messages:
            theme = msg.get('metadata', {}).get('theme_name', 'general')
            confidence = msg.get('metadata', {}).get('theme_confidence', 0.5)
            
            theme_counts[theme] += 1
            theme_confidences[theme].append(confidence)
        
        # Calculer les scores thématiques
        theme_scores = {}
        for theme, count in theme_counts.items():
            avg_confidence = np.mean(theme_confidences[theme])
            weight = self.theme_weights.get(theme, 0.5)
            theme_scores[theme] = count * avg_confidence * weight
        
        dominant_theme = max(theme_scores, key=theme_scores.get) if theme_scores else 'general'
        
        return {
            'dominant_theme': dominant_theme,
            'theme_distribution': dict(theme_counts),
            'theme_scores': theme_scores,
            'diversity_score': len(theme_counts) / len(messages) if messages else 0
        }
    
    def _calculate_cluster_threat_score(self, messages: List[Dict]) -> float:
        """Calculer le score de menace agrégé du cluster"""
        scores = [msg.get('score', 0.5) for msg in messages]
        
        if not scores:
            return 0.5
        
        # Score pondéré : moyenne + bonus pour la taille du cluster
        avg_score = np.mean(scores)
        max_score = max(scores)
        size_bonus = min(len(messages) / 10, 0.2)  # Bonus max de 0.2
        
        aggregated_score = (avg_score * 0.7 + max_score * 0.3) + size_bonus
        return min(aggregated_score, 1.0)
    
    def _analyze_temporal_evolution(self, messages: List[Dict]) -> Dict:
        """Analyser l'évolution temporelle du cluster"""
        if len(messages) < 2:
            return {'trend': 'stable', 'velocity': 0}
        
        # Trier par timestamp
        sorted_messages = sorted(messages, key=lambda x: x.get('timestamp', ''))
        
        # Calculer la tendance des scores
        scores = [msg.get('score', 0.5) for msg in sorted_messages]
        
        if len(scores) > 1:
            trend_slope = (scores[-1] - scores[0]) / len(scores)
            
            if trend_slope > 0.1:
                trend = 'increasing'
            elif trend_slope < -0.1:
                trend = 'decreasing'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
            trend_slope = 0
        
        # Calculer la vélocité (messages par heure)
        try:
            first_time = datetime.fromisoformat(sorted_messages[0]['timestamp'].replace('Z', '+00:00'))
            last_time = datetime.fromisoformat(sorted_messages[-1]['timestamp'].replace('Z', '+00:00'))
            time_span = (last_time - first_time).total_seconds() / 3600  # en heures
            
            velocity = len(messages) / max(time_span, 1)
        except Exception:
            velocity = 0
        
        return {
            'trend': trend,
            'velocity': velocity,
            'score_evolution': scores,
            'trend_slope': trend_slope
        }
    
    def _extract_key_entities(self, messages: List[Dict]) -> List[Dict]:
        """Extraire les entités clés du cluster"""
        entity_counts = defaultdict(int)
        entity_info = {}
        
        for msg in messages:
            for entity in msg.get('entities', []):
                name = entity.get('name', '').lower()
                if name:
                    entity_counts[name] += 1
                    if name not in entity_info:
                        entity_info[name] = entity
        
        # Trier par fréquence
        sorted_entities = sorted(entity_counts.items(), key=lambda x: x[1], reverse=True)
        
        key_entities = []
        for name, count in sorted_entities[:10]:  # Top 10
            entity_data = entity_info[name].copy()
            entity_data['frequency'] = count
            entity_data['importance'] = count / len(messages)
            key_entities.append(entity_data)
        
        return key_entities
    
    def _calculate_cluster_priority(self, threat_score: float, cluster_size: int) -> float:
        """Calculer la priorité du cluster"""
        # Priorité basée sur le score de menace et la taille du cluster
        size_factor = min(cluster_size / 5, 2.0)  # Facteur de taille (max 2.0)
        priority = threat_score * size_factor
        
        return min(priority, 10.0)  # Priorité max de 10

# Instance globale du service
similarity_service = SimilarityService()
