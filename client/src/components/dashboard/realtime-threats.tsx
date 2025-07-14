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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader className="pb-4 border-b border-slate-700">
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <span className="text-white">Analyse Détaillée de la Menace</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedThreat && (
            <div className="space-y-6 pt-4">
              {/* En-tête de la menace - Redesign */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                      <Shield className="w-6 h-6 mr-3 text-blue-400" />
                      {selectedThreat.name || selectedThreat.id}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Détecté le {formatDistanceToNow(new Date(selectedThreat.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getSeverityColor(selectedThreat.severity)} text-sm px-3 py-1`}
                  >
                    {selectedThreat.severity.charAt(0).toUpperCase() + selectedThreat.severity.slice(1)}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Score de Menace</p>
                    <p className={`text-3xl font-bold ${getScoreColor(selectedThreat.score)}`}>
                      {selectedThreat.score.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Statut</p>
                    <p className="text-white font-medium text-lg">{selectedThreat.status}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Priorité</p>
                    <p className="text-orange-400 font-medium text-lg">HAUTE</p>
                  </div>
                </div>
              </div>

              {/* Informations détaillées - Amélioré */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-4 flex items-center text-lg">
                    <Activity className="w-5 h-5 mr-3 text-green-400" />
                    Chronologie d'Activité
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-gray-300 font-medium">Première détection:</span>
                      <span className="text-white">
                        {formatDistanceToNow(new Date(selectedThreat.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-gray-300 font-medium">Dernière mise à jour:</span>
                      <span className="text-white">Il y a 2 minutes</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-300 font-medium">Évolution du score:</span>
                      <span className="text-green-400 font-bold">↗ +0.15 (+12%)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-600 rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-4 flex items-center text-lg">
                    <Shield className="w-5 h-5 mr-3 text-blue-400" />
                    Classification Intelligence
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-gray-300 font-medium">Type de menace:</span>
                      <span className="text-white">Activité Suspecte</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-gray-300 font-medium">Zone géographique:</span>
                      <span className="text-white">Mali Nord</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-300 font-medium">Niveau de confiance:</span>
                      <span className="text-yellow-400 font-bold">78%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Indicateurs de menace - Amélioré */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                  <AlertTriangle className="w-5 h-5 mr-3 text-orange-400" />
                  Indicateurs de Menace
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Communications cryptées', value: 85, color: 'text-red-400', bg: 'bg-red-500' },
                    { label: 'Mouvement de véhicules', value: 72, color: 'text-yellow-400', bg: 'bg-yellow-500' },
                    { label: 'Activité réseau', value: 60, color: 'text-yellow-400', bg: 'bg-yellow-500' },
                    { label: 'Patterns temporels', value: 45, color: 'text-green-400', bg: 'bg-green-500' }
                  ].map((indicator, index) => (
                    <div key={index} className="p-3 bg-slate-700 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-300 font-medium">{indicator.label}</span>
                        <span className={`text-sm font-bold ${indicator.color}`}>{indicator.value}%</span>
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${indicator.bg}`}
                          style={{ width: `${indicator.value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sources et contexte - Amélioré */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                  <Eye className="w-5 h-5 mr-3 text-purple-400" />
                  Sources d'Intelligence
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { type: 'SIGINT', source: 'Station d\'écoute GA-Alpha', reliability: '95%', color: 'bg-blue-500' },
                    { type: 'HUMINT', source: 'Agent terrain KI-7', reliability: '82%', color: 'bg-green-500' },
                    { type: 'IMINT', source: 'Surveillance satellite', reliability: '88%', color: 'bg-purple-500' }
                  ].map((source, index) => (
                    <div key={index} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className={`text-xs px-2 py-1 ${source.color} bg-opacity-20`}>
                          {source.type}
                        </Badge>
                        <span className="text-xs text-gray-400">{source.reliability}</span>
                      </div>
                      <p className="text-sm text-gray-300 font-medium">{source.source}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions recommandées - Amélioré */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                  <Activity className="w-5 h-5 mr-3 text-orange-400" />
                  Actions Recommandées
                </h4>
                <div className="space-y-3">
                  {[
                    { action: 'Intensifier la surveillance SIGINT sur la zone', priority: 'URGENT', color: 'bg-red-500' },
                    { action: 'Déploiement d\'agents HUMINT supplémentaires', priority: 'HAUTE', color: 'bg-orange-500' },
                    { action: 'Coordination avec les forces locales', priority: 'MOYENNE', color: 'bg-yellow-500' },
                    { action: 'Alerte aux unités de patrouille', priority: 'HAUTE', color: 'bg-orange-500' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 ${item.color} rounded-full`}></div>
                        <span className="text-sm text-gray-300 font-medium">{item.action}</span>
                      </div>
                      <Badge variant="outline" className={`text-xs px-2 py-1 ${item.color} bg-opacity-20`}>
                        {item.priority}
                      </Badge>
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
