import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { ingestionApi } from '@/lib/api';
import { RefreshCw, Activity } from 'lucide-react';

export function DataIngestionStatus() {
  const { data: statusData, isLoading, refetch } = useQuery({
    queryKey: ['/api/ingestion/status'],
    queryFn: ingestionApi.getStatus,
    refetchInterval: 15000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-400';
      case 'degraded':
        return 'bg-orange-400';
      case 'error':
        return 'bg-red-400';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'processing':
        return 'Processing';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">État de l'Ingestion des Données</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-slate-700 rounded-lg animate-pulse">
                <div className="h-4 bg-slate-600 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-600 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sources = statusData?.sources || [];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">État de l'Ingestion des Données</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sources.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Aucune source de données configurée
            </div>
          ) : (
            sources.map((source, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(source.status)}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{source.name}</p>
                    <p className="text-xs text-gray-400">
                      {source.status === 'processing' && source.queue_size
                        ? `File d'attente: ${source.queue_size} éléments`
                        : `Dernière mise à jour: ${source.last_updated}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">{source.throughput}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
