import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Clock, Eye, AlertTriangle, Shield, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export function RealtimeThreats() {
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  
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
                className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => setSelectedThreat(threat)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {threat.name || threat.id}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getSeverityColor(threat.severity)}`}
                    >
                      {threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1)}
                    </Badge>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
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
      
      {/* Modal des détails de menace */}
      <Dialog open={!!selectedThreat} onOpenChange={() => setSelectedThreat(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Détails de la Menace</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedThreat && (
            <div className="space-y-6">
              {/* En-tête de la menace */}
              <div className="border border-slate-700 rounded-lg p-4 bg-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-white">
                    {selectedThreat.name || selectedThreat.id}
                  </h3>
                  <Badge
                    variant="outline"
                    className={`${getSeverityColor(selectedThreat.severity)}`}
                  >
                    {selectedThreat.severity.charAt(0).toUpperCase() + selectedThreat.severity.slice(1)}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Score de Menace</p>
                    <p className={`text-2xl font-bold ${getScoreColor(selectedThreat.score)}`}>
                      {selectedThreat.score.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Statut</p>
                    <p className="text-white font-medium">{selectedThreat.status}</p>
                  </div>
                </div>
              </div>

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2" />
                    Activité
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Détecté:</span>
                      <span className="text-white">
                        {formatDistanceToNow(new Date(selectedThreat.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Dernière mise à jour:</span>
                      <span className="text-white">
                        {formatDistanceToNow(new Date(selectedThreat.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Évolution:</span>
                      <span className="text-green-400">↗ +0.15</span>
                    </div>
                  </div>
                </div>

                <div className="border border-slate-700 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Classification
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span className="text-white">Activité Suspecte</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Origine:</span>
                      <span className="text-white">Mali Nord</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Confiance:</span>
                      <span className="text-white">78%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicateurs de menace */}
              <div className="border border-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Indicateurs de Menace</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Communications cryptées', value: '85%', color: 'text-red-400' },
                    { label: 'Mouvement de véhicules', value: '72%', color: 'text-yellow-400' },
                    { label: 'Activité réseau', value: '60%', color: 'text-yellow-400' },
                    { label: 'Patterns temporels', value: '45%', color: 'text-green-400' }
                  ].map((indicator, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="text-sm text-gray-400">{indicator.label}:</span>
                      <span className={`text-sm font-medium ${indicator.color}`}>{indicator.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sources et contexte */}
              <div className="border border-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Sources et Contexte</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">SIGINT</Badge>
                    <span className="text-gray-400">Station d'écoute GA-Alpha</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">HUMINT</Badge>
                    <span className="text-gray-400">Agent terrain KI-7</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">IMINT</Badge>
                    <span className="text-gray-400">Surveillance satellite</span>
                  </div>
                </div>
              </div>

              {/* Actions recommandées */}
              <div className="border border-slate-700 rounded-lg p-4">
                <h4 className="font-medium text-white mb-3">Actions Recommandées</h4>
                <div className="space-y-2">
                  {[
                    'Intensifier la surveillance SIGINT sur la zone',
                    'Déploiement d\'agents HUMINT supplémentaires',
                    'Coordination avec les forces locales',
                    'Alerte aux unités de patrouille'
                  ].map((action, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
