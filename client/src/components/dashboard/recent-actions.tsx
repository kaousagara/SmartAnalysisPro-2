import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { actionApi } from '@/lib/api';
import { Satellite, Eye, Network, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function RecentActions() {
  const { data: actionsData, isLoading } = useQuery({
    queryKey: ['/api/actions'],
    queryFn: actionApi.getActions,
    refetchInterval: 10000,
  });

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'sigint':
        return <Satellite className="w-4 h-4" />;
      case 'humint':
        return <Eye className="w-4 h-4" />;
      case 'network_monitoring':
        return <Network className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case 'SIGINT_COLLECTION':
        return 'bg-blue-500 bg-opacity-20 text-blue-400';
      case 'THREAT_ANALYSIS':
        return 'bg-orange-500 bg-opacity-20 text-orange-400';
      case 'NETWORK_MONITORING':
        return 'bg-green-500 bg-opacity-20 text-green-400';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  const getActionTitle = (type: string) => {
    switch (type) {
      case 'sigint':
        return 'SIGINT Collection Activated';
      case 'humint':
        return 'HUMINT Asset Tasked';
      case 'network_monitoring':
        return 'Network Monitoring Initiated';
      default:
        return 'Action Executed';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1':
        return 'bg-error bg-opacity-20 text-error';
      case 'P2':
        return 'bg-warning bg-opacity-20 text-warning';
      case 'P3':
        return 'bg-primary bg-opacity-20 text-primary';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Actions Récentes & Prescriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-4 p-4 bg-slate-700 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-slate-600 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-600 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-600 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const actions = actionsData?.actions || [];
  const recentActions = actions.slice(0, 10); // Show last 10 actions

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Actions Récentes & Prescriptions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Aucune action récente</p>
            </div>
          ) : (
            recentActions.map((action) => (
              <div
                key={action.id}
                className="flex items-start space-x-4 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(action.type)}`}>
                  {getActionIcon(action.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">
                      {getActionTitle(action.type)}
                    </h4>
                    <span className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {action.description}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(action.priority)}`}>
                      {action.priority}
                    </span>
                    <span className="text-xs text-gray-400">
                      {action.metadata?.automated ? 'Automated response' : 'Manual action'}
                      {action.metadata?.trigger_score && 
                        ` to threat score ${action.metadata.trigger_score}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
