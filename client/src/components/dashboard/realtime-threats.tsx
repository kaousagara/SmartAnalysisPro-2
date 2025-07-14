import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function RealtimeThreats() {
  const { data: threatsData, isLoading } = useQuery({
    queryKey: ['/api/threats/realtime'],
    queryFn: () => dashboardApi.getRealtimeThreats(10),
    refetchInterval: 5000,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 bg-opacity-20 text-red-400 border-red-500';
      case 'high':
        return 'bg-orange-500 bg-opacity-20 text-orange-400 border-orange-500';
      case 'medium':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.75) return 'text-red-400';
    if (score >= 0.60) return 'text-orange-400';
    if (score >= 0.40) return 'text-yellow-400';
    return 'text-gray-400';
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Menaces en Temps Réel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-6 bg-slate-700 rounded w-1/4 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const threats = threatsData?.threats || [];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Menaces en Temps Réel</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">En Direct</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {threats.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Aucune menace active détectée
            </div>
          ) : (
            threats.map((threat) => (
              <div
                key={threat.id}
                className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {threat.name || threat.id}
                  </span>
                  <Badge
                    variant="outline"
                    className={`text-xs ${getSeverityColor(threat.severity)}`}
                  >
                    {threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1)}
                  </Badge>
                </div>
                <div className={`text-2xl font-bold mb-2 ${getScoreColor(threat.score)}`}>
                  {threat.score.toFixed(2)}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(threat.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
