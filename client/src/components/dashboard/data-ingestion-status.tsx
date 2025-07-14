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
      case 'active':
        return 'bg-success';
      case 'processing':
        return 'bg-warning';
      case 'error':
        return 'bg-error';
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
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-white">Data Ingestion Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-dark-elevated rounded-lg animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const sources = statusData?.sources || [];

  return (
    <Card className="bg-dark-surface border-dark-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Data Ingestion Status</CardTitle>
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
              No data sources configured
            </div>
          ) : (
            sources.map((source, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-dark-elevated rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(source.status)}`} />
                  <div>
                    <p className="text-sm font-medium text-white">{source.name}</p>
                    <p className="text-xs text-gray-400">
                      {source.status === 'processing' && source.queue_size
                        ? `Processing queue: ${source.queue_size} items`
                        : `Last updated: ${source.last_updated}`}
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
