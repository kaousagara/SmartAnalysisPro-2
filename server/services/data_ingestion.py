import json
import logging
from typing import Dict, List, Optional
from datetime import datetime
import hashlib
import stix2
import requests
from pathlib import Path
import pandas as pd

logger = logging.getLogger(__name__)

class DataIngestionService:
    def __init__(self):
        self.supported_formats = ['json', 'stix', 'taxii', 'unstructured']
        self.schema_version = '2.1'
    
    def ingest_data(self, data: Dict, format_type: str = 'json') -> Dict:
        """Main data ingestion method"""
        try:
            if format_type not in self.supported_formats:
                raise ValueError(f"Unsupported format: {format_type}")
            
            # Validate schema
            if format_type == 'json':
                validated_data = self._validate_json_schema(data)
            elif format_type == 'stix':
                validated_data = self._validate_stix_data(data)
            elif format_type == 'taxii':
                validated_data = self._process_taxii_data(data)
            else:
                validated_data = self._process_unstructured_data(data)
            
            # Enrich with metadata
            enriched_data = self._enrich_metadata(validated_data)
            
            # Normalize for processing
            normalized_data = self.normalize_data(enriched_data)
            
            return normalized_data
            
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
    
    def get_ingestion_status(self) -> Dict:
        """Get current ingestion status"""
        try:
            # Mock data for demonstration (in production, get from monitoring system)
            return {
                'sources': [
                    {
                        'name': 'STIX/TAXII Feed',
                        'type': 'stix',
                        'status': 'active',
                        'last_updated': '30s ago',
                        'throughput': '847 KB/s'
                    },
                    {
                        'name': 'JSON Structured',
                        'type': 'json',
                        'status': 'active',
                        'last_updated': '15s ago',
                        'throughput': '1.2 MB/s'
                    },
                    {
                        'name': 'Unstructured Files',
                        'type': 'unstructured',
                        'status': 'processing',
                        'last_updated': '2m ago',
                        'throughput': '456 KB/s',
                        'queue_size': 3
                    }
                ],
                'total_processed': 15847,
                'errors': 12,
                'success_rate': 0.9992
            }
            
        except Exception as e:
            logger.error(f"Error getting ingestion status: {str(e)}")
            return {'sources': [], 'total_processed': 0, 'errors': 0, 'success_rate': 0}
