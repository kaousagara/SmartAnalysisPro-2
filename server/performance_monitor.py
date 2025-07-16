import time
import threading
import psutil
import json
from datetime import datetime
from typing import Dict, List
from cache_manager import cache_manager

class PerformanceMonitor:
    """Moniteur de performance pour le système"""
    
    def __init__(self):
        self.metrics = {
            'response_times': [],
            'memory_usage': [],
            'cpu_usage': [],
            'database_queries': [],
            'cache_hits': 0,
            'cache_misses': 0
        }
        self.monitoring = False
        self.monitor_thread = None
        
    def start_monitoring(self):
        """Démarrer le monitoring"""
        self.monitoring = True
        self.monitor_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
        
    def stop_monitoring(self):
        """Arrêter le monitoring"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join()
            
    def _monitor_loop(self):
        """Boucle de monitoring"""
        while self.monitoring:
            try:
                # Collecter les métriques système
                memory_percent = psutil.virtual_memory().percent
                cpu_percent = psutil.cpu_percent(interval=1)
                
                # Ajouter aux métriques
                timestamp = datetime.now().isoformat()
                self.metrics['memory_usage'].append({
                    'timestamp': timestamp,
                    'value': memory_percent
                })
                
                self.metrics['cpu_usage'].append({
                    'timestamp': timestamp,
                    'value': cpu_percent
                })
                
                # Maintenir seulement les 100 dernières valeurs
                if len(self.metrics['memory_usage']) > 100:
                    self.metrics['memory_usage'].pop(0)
                if len(self.metrics['cpu_usage']) > 100:
                    self.metrics['cpu_usage'].pop(0)
                
                time.sleep(5)  # Collecter toutes les 5 secondes
                
            except Exception as e:
                print(f"Erreur lors du monitoring: {e}")
                time.sleep(10)
                
    def record_response_time(self, endpoint: str, duration: float):
        """Enregistrer le temps de réponse d'un endpoint"""
        self.metrics['response_times'].append({
            'endpoint': endpoint,
            'duration': duration,
            'timestamp': datetime.now().isoformat()
        })
        
        # Maintenir seulement les 1000 dernières valeurs
        if len(self.metrics['response_times']) > 1000:
            self.metrics['response_times'].pop(0)
            
    def record_database_query(self, query: str, duration: float, success: bool):
        """Enregistrer une requête de base de données"""
        self.metrics['database_queries'].append({
            'query': query[:100],  # Premiers 100 caractères
            'duration': duration,
            'success': success,
            'timestamp': datetime.now().isoformat()
        })
        
        # Maintenir seulement les 500 dernières valeurs
        if len(self.metrics['database_queries']) > 500:
            self.metrics['database_queries'].pop(0)
            
    def record_cache_hit(self):
        """Enregistrer un hit de cache"""
        self.metrics['cache_hits'] += 1
        
    def record_cache_miss(self):
        """Enregistrer un miss de cache"""
        self.metrics['cache_misses'] += 1
        
    def get_performance_summary(self) -> Dict:
        """Obtenir un résumé des performances"""
        try:
            # Calculer les moyennes
            avg_response_time = 0
            if self.metrics['response_times']:
                avg_response_time = sum(r['duration'] for r in self.metrics['response_times']) / len(self.metrics['response_times'])
            
            avg_memory = 0
            if self.metrics['memory_usage']:
                avg_memory = sum(m['value'] for m in self.metrics['memory_usage']) / len(self.metrics['memory_usage'])
            
            avg_cpu = 0
            if self.metrics['cpu_usage']:
                avg_cpu = sum(c['value'] for c in self.metrics['cpu_usage']) / len(self.metrics['cpu_usage'])
            
            # Calculer le taux de hit du cache
            total_cache_requests = self.metrics['cache_hits'] + self.metrics['cache_misses']
            cache_hit_rate = (self.metrics['cache_hits'] / total_cache_requests * 100) if total_cache_requests > 0 else 0
            
            # Endpoints les plus lents
            slowest_endpoints = []
            if self.metrics['response_times']:
                endpoint_times = {}
                for rt in self.metrics['response_times']:
                    endpoint = rt['endpoint']
                    if endpoint not in endpoint_times:
                        endpoint_times[endpoint] = []
                    endpoint_times[endpoint].append(rt['duration'])
                
                for endpoint, times in endpoint_times.items():
                    avg_time = sum(times) / len(times)
                    slowest_endpoints.append({
                        'endpoint': endpoint,
                        'avg_time': avg_time,
                        'call_count': len(times)
                    })
                
                slowest_endpoints.sort(key=lambda x: x['avg_time'], reverse=True)
                slowest_endpoints = slowest_endpoints[:10]
            
            return {
                'response_times': {
                    'average': round(avg_response_time, 2),
                    'count': len(self.metrics['response_times']),
                    'slowest_endpoints': slowest_endpoints
                },
                'system_resources': {
                    'memory_usage': round(avg_memory, 2),
                    'cpu_usage': round(avg_cpu, 2),
                    'current_memory': psutil.virtual_memory().percent,
                    'current_cpu': psutil.cpu_percent()
                },
                'cache_performance': {
                    'hit_rate': round(cache_hit_rate, 2),
                    'total_hits': self.metrics['cache_hits'],
                    'total_misses': self.metrics['cache_misses'],
                    'total_requests': total_cache_requests
                },
                'database_queries': {
                    'total_queries': len(self.metrics['database_queries']),
                    'avg_duration': round(sum(q['duration'] for q in self.metrics['database_queries']) / len(self.metrics['database_queries']), 2) if self.metrics['database_queries'] else 0,
                    'success_rate': round(sum(1 for q in self.metrics['database_queries'] if q['success']) / len(self.metrics['database_queries']) * 100, 2) if self.metrics['database_queries'] else 100
                },
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
            
    def get_real_time_metrics(self) -> Dict:
        """Obtenir les métriques en temps réel"""
        try:
            return {
                'memory_usage': psutil.virtual_memory().percent,
                'cpu_usage': psutil.cpu_percent(),
                'disk_usage': psutil.disk_usage('/').percent,
                'network_io': dict(psutil.net_io_counters()._asdict()),
                'active_connections': len(psutil.net_connections()),
                'timestamp': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
            
    def export_metrics(self, filename: str = None):
        """Exporter les métriques vers un fichier JSON"""
        if filename is None:
            filename = f"performance_metrics_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            with open(filename, 'w') as f:
                json.dump({
                    'metrics': self.metrics,
                    'summary': self.get_performance_summary(),
                    'exported_at': datetime.now().isoformat()
                }, f, indent=2)
            
            return filename
            
        except Exception as e:
            print(f"Erreur lors de l'export: {e}")
            return None

# Instance globale du moniteur
performance_monitor = PerformanceMonitor()

# Decorator pour mesurer les performances
def measure_performance(endpoint_name: str):
    """Decorator pour mesurer les performances d'un endpoint"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                success = True
                return result
            except Exception as e:
                success = False
                raise
            finally:
                duration = time.time() - start_time
                performance_monitor.record_response_time(endpoint_name, duration)
                
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator