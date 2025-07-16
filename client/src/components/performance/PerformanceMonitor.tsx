import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Cpu,
  HardDrive
} from 'lucide-react';
import { useOptimizedApi, getCacheStats, clearAllCache } from '@/hooks/useOptimizedApi';

interface PerformanceMetrics {
  response_times: {
    average: number;
    count: number;
    slowest_endpoints: Array<{
      endpoint: string;
      avg_time: number;
      call_count: number;
    }>;
  };
  system_resources: {
    memory_usage: number;
    cpu_usage: number;
    current_memory: number;
    current_cpu: number;
  };
  cache_performance: {
    hit_rate: number;
    total_hits: number;
    total_misses: number;
    total_requests: number;
  };
  database_queries: {
    total_queries: number;
    avg_duration: number;
    success_rate: number;
  };
}

const PerformanceMonitor: React.FC = () => {
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [clientCacheStats, setClientCacheStats] = useState(getCacheStats());

  const { 
    data: performanceData, 
    loading, 
    error, 
    refetch 
  } = useOptimizedApi<{ performance: PerformanceMetrics }>('/api/system/performance', {
    refetchInterval: autoRefresh ? refreshInterval : 0,
    cacheTime: 30000, // 30 seconds
    staleTime: 10000   // 10 seconds
  });

  // Update client cache stats
  useEffect(() => {
    const interval = setInterval(() => {
      setClientCacheStats(getCacheStats());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    clearAllCache();
    setClientCacheStats(getCacheStats());
    refetch();
  };

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'default';
    if (value <= thresholds.warning) return 'secondary';
    return 'destructive';
  };

  if (loading && !performanceData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Moniteur de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Chargement des métriques...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Moniteur de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Erreur lors du chargement des métriques: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const metrics = performanceData?.performance;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-5 h-5 mr-2" />
              Moniteur de Performance
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Pause' : 'Reprendre'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCache}
              >
                Vider Cache
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={loading}
              >
                {loading ? 'Actualisation...' : 'Actualiser'}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Response Time */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Temps de Réponse</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {metrics?.response_times?.average || 0}ms
              </div>
              <div className="text-sm text-gray-600">
                {metrics?.response_times?.count || 0} requêtes
              </div>
            </div>

            {/* System Resources */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="w-5 h-5 text-green-600" />
                <span className="font-medium">Ressources Système</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>CPU:</span>
                  <span className={getStatusColor(metrics?.system_resources?.current_cpu || 0, { good: 50, warning: 80 })}>
                    {metrics?.system_resources?.current_cpu || 0}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Mémoire:</span>
                  <span className={getStatusColor(metrics?.system_resources?.current_memory || 0, { good: 70, warning: 90 })}>
                    {metrics?.system_resources?.current_memory || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Cache Performance */}
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-5 h-5 text-purple-600" />
                <span className="font-medium">Cache</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Client:</span>
                  <span className="text-purple-600">{clientCacheStats.hitRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Serveur:</span>
                  <span className="text-purple-600">{metrics?.cache_performance?.hit_rate || 0}%</span>
                </div>
              </div>
            </div>

            {/* Database Queries */}
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-5 h-5 text-orange-600" />
                <span className="font-medium">Base de données</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Requêtes:</span>
                  <span className="text-orange-600">{metrics?.database_queries?.total_queries || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Succès:</span>
                  <span className="text-orange-600">{metrics?.database_queries?.success_rate || 100}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Endpoints les plus lents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics?.response_times?.slowest_endpoints?.slice(0, 5).map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{endpoint.endpoint}</div>
                    <div className="text-xs text-gray-500">{endpoint.call_count} appels</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusBadge(endpoint.avg_time, { good: 100, warning: 500 })}>
                      {endpoint.avg_time.toFixed(0)}ms
                    </Badge>
                  </div>
                </div>
              ))}
              {(!metrics?.response_times?.slowest_endpoints || metrics.response_times.slowest_endpoints.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="w-5 h-5 mr-2" />
              Utilisation des ressources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">CPU</span>
                  <span className="text-sm">{metrics?.system_resources?.current_cpu || 0}%</span>
                </div>
                <Progress value={metrics?.system_resources?.current_cpu || 0} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Mémoire</span>
                  <span className="text-sm">{metrics?.system_resources?.current_memory || 0}%</span>
                </div>
                <Progress value={metrics?.system_resources?.current_memory || 0} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">CPU Moyen</div>
                  <div className="text-xl font-bold">{metrics?.system_resources?.cpu_usage || 0}%</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-600">Mémoire Moyenne</div>
                  <div className="text-xl font-bold">{metrics?.system_resources?.memory_usage || 0}%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Statistiques du Cache
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Cache Client</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Entrées valides:</span>
                  <span className="font-medium">{clientCacheStats.validEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Entrées expirées:</span>
                  <span className="font-medium">{clientCacheStats.expiredEntries}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taille totale:</span>
                  <span className="font-medium">{clientCacheStats.totalSize} KB</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de hit:</span>
                  <span className="font-medium">{clientCacheStats.hitRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Cache Serveur</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Hits totaux:</span>
                  <span className="font-medium">{metrics?.cache_performance?.total_hits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Misses totaux:</span>
                  <span className="font-medium">{metrics?.cache_performance?.total_misses || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Requêtes totales:</span>
                  <span className="font-medium">{metrics?.cache_performance?.total_requests || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taux de hit:</span>
                  <span className="font-medium">{metrics?.cache_performance?.hit_rate || 0}%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;