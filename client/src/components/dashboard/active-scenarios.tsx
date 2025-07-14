import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { scenarioApi } from '@/lib/api';
import { Plus, AlertTriangle, Clock, CheckCircle } from 'lucide-react';

export function ActiveScenarios() {
  const { data: scenariosData, isLoading } = useQuery({
    queryKey: ['/api/scenarios'],
    queryFn: scenarioApi.getScenarios,
    refetchInterval: 15000,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-500 bg-opacity-20 text-red-400';
      case 'partial':
        return 'bg-orange-500 bg-opacity-20 text-orange-400';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <AlertTriangle className="w-4 h-4" />;
      case 'partial':
        return <Clock className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '🔴 Active';
      case 'partial':
        return '⚠️ Partial';
      default:
        return '⚫ Inactive';
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Scénarios Actifs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-600 rounded w-3/4 mb-2" />
                <div className="h-3 bg-slate-600 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-600 rounded w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const scenarios = scenariosData?.scenarios || [];
  const activeScenarios = scenarios.filter(s => s.status === 'active' || s.status === 'partial');

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Scénarios Actifs</CardTitle>
          <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nouveau Scénario
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activeScenarios.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">Aucun scénario actif</p>
            </div>
          ) : (
            activeScenarios.map((scenario) => (
              <div
                key={scenario.id}
                className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {scenario.name}
                  </span>
                  <Badge className={`${getStatusColor(scenario.status)} text-xs`}>
                    {getStatusIcon(scenario.status)}
                    <span className="ml-1">{getStatusText(scenario.status)}</span>
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {scenario.description}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-400">
                  <span>Score: {scenario.conditions_met > 0 ? '0.87' : '0.00'}</span>
                  <span>•</span>
                  <span>
                    {scenario.conditions_met}/{scenario.total_conditions} conditions met
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
