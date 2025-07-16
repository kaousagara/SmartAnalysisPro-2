import json
import time
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from threading import Lock

class CacheManager:
    """Gestionnaire de cache pour optimiser les performances"""
    
    def __init__(self):
        self.cache: Dict[str, Dict] = {}
        self.cache_lock = Lock()
        self.default_ttl = 300  # 5 minutes
        
    def get(self, key: str) -> Optional[Any]:
        """Récupérer une valeur du cache"""
        with self.cache_lock:
            if key not in self.cache:
                return None
            
            entry = self.cache[key]
            if time.time() > entry['expires_at']:
                del self.cache[key]
                return None
            
            return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Stocker une valeur dans le cache"""
        if ttl is None:
            ttl = self.default_ttl
            
        with self.cache_lock:
            self.cache[key] = {
                'value': value,
                'created_at': time.time(),
                'expires_at': time.time() + ttl
            }
    
    def delete(self, key: str) -> None:
        """Supprimer une clé du cache"""
        with self.cache_lock:
            if key in self.cache:
                del self.cache[key]
    
    def clear(self) -> None:
        """Vider le cache"""
        with self.cache_lock:
            self.cache.clear()
    
    def invalidate_pattern(self, pattern: str) -> None:
        """Invalider toutes les clés qui correspondent à un pattern"""
        with self.cache_lock:
            keys_to_delete = [key for key in self.cache.keys() if pattern in key]
            for key in keys_to_delete:
                del self.cache[key]
    
    def cleanup_expired(self) -> None:
        """Nettoyer les entrées expirées"""
        current_time = time.time()
        with self.cache_lock:
            expired_keys = [
                key for key, entry in self.cache.items()
                if current_time > entry['expires_at']
            ]
            for key in expired_keys:
                del self.cache[key]
    
    def get_stats(self) -> Dict[str, Any]:
        """Obtenir les statistiques du cache"""
        with self.cache_lock:
            total_entries = len(self.cache)
            current_time = time.time()
            expired_entries = sum(
                1 for entry in self.cache.values()
                if current_time > entry['expires_at']
            )
            
            return {
                'total_entries': total_entries,
                'expired_entries': expired_entries,
                'valid_entries': total_entries - expired_entries,
                'memory_usage': len(str(self.cache))
            }

# Instance globale du cache
cache_manager = CacheManager()