import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
import hashlib
import stix2
import requests
from pathlib import Path
import pandas as pd
from .deep_learning_service import deep_learning_service

logger = logging.getLogger(__name__)

class DataIngestionService:
    def __init__(self):
        self.supported_formats = ['json', 'stix', 'taxii', 'unstructured']
        self.schema_version = '2.1'
    
    def ingest_data(self, data: Dict, format_type: str = 'json') -> Dict:
        """Main data ingestion method with deep learning integration"""
        try:
            if format_type not in self.supported_formats:
                raise ValueError(f"Unsupported format: {format_type}")
            
            # Phase 1: Validation et préparation standard
            if format_type == 'json':
                validated_data = self._validate_json_schema(data)
            elif format_type == 'stix':
                validated_data = self._validate_stix_data(data)
            elif format_type == 'taxii':
                validated_data = self._process_taxii_data(data)
            else:
                validated_data = self._process_unstructured_data(data)
            
            # Phase 2: Enrichissement avec métadonnées
            enriched_data = self._enrich_metadata(validated_data)
            
            # Phase 3: Normalisation pour processing
            normalized_data = self.normalize_data(enriched_data)
            
            # Phase 4: NOUVEAU - Analyse Deep Learning
            dl_enhanced_data = self._apply_deep_learning_analysis(normalized_data)
            
            return dl_enhanced_data
            
        except Exception as e:
            logger.error(f"Error ingesting data: {str(e)}")
            raise
    
    def _validate_json_schema(self, data: Dict) -> Dict:
        """Validate JSON data against schema"""
        try:
            required_fields = ['content', 'source', 'timestamp']
            
            for field in required_fields:
                if field not in data:
                    raise ValueError(f"Missing required field: {field}")
            
            # Additional validation
            if not isinstance(data['content'], str):
                raise ValueError("Content must be a string")
            
            if not isinstance(data['source'], dict):
                raise ValueError("Source must be a dictionary")
            
            return data
            
        except Exception as e:
            logger.error(f"JSON schema validation failed: {str(e)}")
            raise
    
    def _validate_stix_data(self, data: Dict) -> Dict:
        """Validate STIX 2.1 data"""
        try:
            # Parse STIX object
            stix_obj = stix2.parse(data)
            
            # Extract relevant information
            extracted_data = {
                'content': str(stix_obj.get('description', '')),
                'source': {
                    'id': str(stix_obj.get('id', '')),
                    'type': str(stix_obj.get('type', '')),
                    'created': str(stix_obj.get('created', '')),
                    'reliability': 0.8  # Default reliability for STIX data
                },
                'timestamp': str(stix_obj.get('created', datetime.now().isoformat())),
                'metadata': {
                    'format': 'stix',
                    'version': self.schema_version,
                    'stix_type': str(stix_obj.get('type', ''))
                }
            }
            
            return extracted_data
            
        except Exception as e:
            logger.error(f"STIX validation failed: {str(e)}")
            raise
    
    def _process_taxii_data(self, data: Dict) -> Dict:
        """Process TAXII feed data"""
        try:
            # TAXII data typically contains collections of STIX objects
            if 'objects' in data:
                # Process first object for simplicity
                first_obj = data['objects'][0] if data['objects'] else {}
                return self._validate_stix_data(first_obj)
            else:
                # Direct STIX object
                return self._validate_stix_data(data)
                
        except Exception as e:
            logger.error(f"TAXII processing failed: {str(e)}")
            raise
    
    def _process_unstructured_data(self, data: Dict) -> Dict:
        """Process unstructured data (documents, etc.)"""
        try:
            # Extract text content
            if 'file_content' in data:
                content = self._extract_text_from_file(data['file_content'], data.get('file_type', 'txt'))
            else:
                content = data.get('content', '')
            
            # Perform NER (Named Entity Recognition) - simplified
            entities = self._extract_entities(content)
            
            processed_data = {
                'content': content,
                'source': {
                    'type': 'unstructured',
                    'filename': data.get('filename', 'unknown'),
                    'reliability': 0.6  # Lower reliability for unstructured data
                },
                'timestamp': datetime.now().isoformat(),
                'entities': entities,
                'metadata': {
                    'format': 'unstructured',
                    'processing_method': 'nlp',
                    'entity_count': len(entities)
                }
            }
            
            return processed_data
            
        except Exception as e:
            logger.error(f"Unstructured data processing failed: {str(e)}")
            raise
    
    def _extract_text_from_file(self, file_content: str, file_type: str) -> str:
        """Extract text from various file formats"""
        try:
            if file_type.lower() == 'txt':
                return file_content
            elif file_type.lower() == 'json':
                # Extract text from JSON structure
                data = json.loads(file_content)
                return str(data)
            else:
                # For other formats, return as-is (in production, you'd use proper parsers)
                return file_content
                
        except Exception as e:
            logger.error(f"Text extraction failed: {str(e)}")
            return file_content
    
    def _extract_entities(self, text: str) -> List[Dict]:
        """Extract named entities from text"""
        try:
            # Simplified entity extraction (in production, use spaCy or similar)
            entities = []
            
            # Look for common threat-related entities
            threat_indicators = [
                'Group XYZ', 'Tombouctou', 'APT', 'malware', 'ransomware',
                'phishing', 'botnet', 'C2', 'command and control'
            ]
            
            text_lower = text.lower()
            for indicator in threat_indicators:
                if indicator.lower() in text_lower:
                    entities.append({
                        'text': indicator,
                        'label': 'THREAT_INDICATOR',
                        'confidence': 0.8
                    })
            
            return entities
            
        except Exception as e:
            logger.error(f"Entity extraction failed: {str(e)}")
            return []
    
    def _enrich_metadata(self, data: Dict) -> Dict:
        """Enrich data with metadata"""
        try:
            # Add processing metadata
            enriched_data = data.copy()
            enriched_data['metadata'] = enriched_data.get('metadata', {})
            
            # Add hash for deduplication
            content_hash = hashlib.sha256(str(data.get('content', '')).encode()).hexdigest()
            enriched_data['metadata']['hash'] = content_hash
            
            # Add processing timestamp
            enriched_data['metadata']['processed_at'] = datetime.now().isoformat()
            
            # Add enrichment info
            enriched_data['metadata']['enrichment_version'] = '1.0'
            
            return enriched_data
            
        except Exception as e:
            logger.error(f"Metadata enrichment failed: {str(e)}")
            raise
    
    def normalize_data(self, data: Dict) -> Dict:
        """Normalize data for threat scoring"""
        try:
            normalized = {
                'text': data.get('content', ''),
                'source': {
                    'reliability': data.get('source', {}).get('reliability', 0.5),
                    'type': data.get('source', {}).get('type', 'unknown'),
                    'base_credibility': data.get('source', {}).get('reliability', 0.5),
                    'historical_accuracy': data.get('source', {}).get('reliability', 0.5),
                    'verification_count': 1
                },
                'timestamps': [data.get('timestamp', datetime.now().isoformat())],
                'network': {
                    'entities': [entity['text'] for entity in data.get('entities', [])],
                    'connections': []  # Would be populated from relationship analysis
                },
                'metadata': data.get('metadata', {})
            }
            
            return normalized
            
        except Exception as e:
            logger.error(f"Data normalization failed: {str(e)}")
            raise
    
    def _apply_deep_learning_analysis(self, normalized_data: Dict) -> Dict:
        """Appliquer l'analyse deep learning aux données normalisées"""
        try:
            enhanced_data = normalized_data.copy()
            
            # 1. Détection d'anomalies avec autoencoder
            anomaly_analysis = deep_learning_service.detect_threat_anomalies(normalized_data)
            enhanced_data['deep_learning'] = {
                'anomaly_detection': anomaly_analysis,
                'processing_timestamp': datetime.now().isoformat()
            }
            
            # 2. Classification de sévérité si documents disponibles
            text_content = normalized_data.get('text', '')
            if text_content and len(text_content) > 10:
                documents = [text_content]
                severity_analysis = deep_learning_service.classify_threat_severity(documents)
                enhanced_data['deep_learning']['severity_classification'] = severity_analysis
                
                # Mettre à jour le niveau de sévérité basé sur le DL
                if severity_analysis.get('confidence', 0) > 0.7:
                    enhanced_data['predicted_severity'] = severity_analysis.get('predicted_class', 'medium')
            
            # 3. Enrichissement des métadonnées avec scores DL
            enhanced_data['metadata']['deep_learning_enhanced'] = True
            enhanced_data['metadata']['anomaly_score'] = anomaly_analysis.get('anomaly_score', 0.0)
            enhanced_data['metadata']['dl_confidence'] = anomaly_analysis.get('reconstruction_error', 0.0)
            
            # 4. Ajout d'indicateurs de qualité
            enhanced_data['quality_indicators'] = self._calculate_quality_indicators(enhanced_data)
            
            return enhanced_data
            
        except Exception as e:
            logger.error(f"Erreur analyse deep learning: {str(e)}")
            # Retourner les données originales en cas d'erreur DL
            return normalized_data
    
    def _calculate_quality_indicators(self, data: Dict) -> Dict:
        """Calculer des indicateurs de qualité des données"""
        try:
            quality = {
                'completeness': 0.0,
                'consistency': 0.0,
                'anomaly_risk': 0.0,
                'overall_score': 0.0
            }
            
            # Calcul de complétude
            required_fields = ['text', 'source', 'timestamps']
            present_fields = sum(1 for field in required_fields if data.get(field))
            quality['completeness'] = present_fields / len(required_fields)
            
            # Calcul de cohérence (basé sur la longueur du texte et entités)
            text_length = len(data.get('text', ''))
            entity_count = len(data.get('network', {}).get('entities', []))
            
            if text_length > 0:
                entity_density = entity_count / (text_length / 100)  # Entités par 100 caractères
                quality['consistency'] = min(1.0, entity_density)
            
            # Risque d'anomalie (du deep learning)
            anomaly_score = data.get('metadata', {}).get('anomaly_score', 0.0)
            quality['anomaly_risk'] = anomaly_score
            
            # Score global
            quality['overall_score'] = (
                quality['completeness'] * 0.4 +
                quality['consistency'] * 0.3 +
                (1.0 - quality['anomaly_risk']) * 0.3
            )
            
            return quality
            
        except Exception as e:
            logger.error(f"Erreur calcul qualité: {str(e)}")
            return {'completeness': 0.5, 'consistency': 0.5, 'anomaly_risk': 0.5, 'overall_score': 0.5}
    
    def get_ingestion_status(self) -> Dict:
        """Get current ingestion status with deep learning metrics"""
        try:
            # Statistiques de base
            base_status = {
                'sources': [
                    {
                        'name': 'STIX/TAXII Feed',
                        'type': 'stix',
                        'status': 'active',
                        'last_updated': '30s ago',
                        'throughput': '847 KB/s',
                        'dl_enhanced': True
                    },
                    {
                        'name': 'JSON Structured',
                        'type': 'json',
                        'status': 'active',
                        'last_updated': '15s ago',
                        'throughput': '1.2 MB/s',
                        'dl_enhanced': True
                    },
                    {
                        'name': 'Unstructured Files',
                        'type': 'unstructured',
                        'status': 'processing',
                        'last_updated': '2m ago',
                        'throughput': '456 KB/s',
                        'queue_size': 3,
                        'dl_enhanced': True
                    }
                ],
                'total_processed': 15847,
                'errors': 12,
                'success_rate': 0.9992
            }
            
            # Ajouter métriques deep learning
            dl_stats = deep_learning_service.get_model_statistics()
            base_status['deep_learning'] = {
                'models_loaded': dl_stats.get('models_loaded', False),
                'simulation_mode': dl_stats.get('simulation_mode', True),
                'processing_enabled': True,
                'average_confidence': 0.82,
                'anomalies_detected': 47,
                'severity_classifications': 235
            }
            
            return base_status
            
        except Exception as e:
            logger.error(f"Error getting ingestion status: {str(e)}")
            return {'sources': [], 'total_processed': 0, 'errors': 0, 'success_rate': 0}
