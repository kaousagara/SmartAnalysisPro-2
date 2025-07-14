import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { actionApi } from '@/lib/api';
import { Satellite, Eye, Network, AlertTriangle, Activity, CheckCircle, Clock, Target, User, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export function RecentActions() {
  const [selectedAction, setSelectedAction] = useState<any>(null);
  
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
                className="flex items-start space-x-4 p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
                onClick={() => setSelectedAction(action)}
              >
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getActionColor(action.type)}`}>
                  {getActionIcon(action.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-white">
                      {getActionTitle(action.type)}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(action.timestamp), { addSuffix: true })}
                      </span>
                      <Eye className="w-4 h-4 text-gray-400" />
                    </div>
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

      {/* Modal des détails de l'action */}
      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader className="pb-4 border-b border-slate-700">
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <Activity className="w-6 h-6 text-green-500" />
              <span className="text-white">Détails de l'Action & Prescription</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedAction && (
            <div className="space-y-6 pt-4">
              {/* En-tête de l'action */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getActionColor(selectedAction.type)}`}>
                        {getActionIcon(selectedAction.type)}
                      </div>
                      {getActionTitle(selectedAction.type)}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Exécuté le {formatDistanceToNow(new Date(selectedAction.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getPriorityColor(selectedAction.priority)} text-sm px-3 py-1`}
                  >
                    {selectedAction.priority}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Type d'Action</p>
                    <p className="text-lg font-bold text-blue-400">{selectedAction.type}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Statut</p>
                    <p className="text-lg font-bold text-green-400">Terminée</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Déclenchement</p>
                    <p className="text-lg font-bold text-orange-400">
                      {selectedAction.metadata?.automated ? 'Automatique' : 'Manuel'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Description détaillée */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-4 flex items-center text-lg">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                  Description de l'Action
                </h4>
                <div className="bg-slate-700 rounded-lg p-4 border border-slate-600">
                  <p className="text-gray-300 leading-relaxed">{selectedAction.description}</p>
                </div>
              </div>

              {/* Contexte et déclencheur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-4 flex items-center text-lg">
                    <Target className="w-5 h-5 mr-3 text-blue-400" />
                    Contexte de Déclenchement
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-gray-300 font-medium">Score de menace déclencheur:</span>
                      <span className="text-white font-bold">
                        {selectedAction.metadata?.trigger_score || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-gray-300 font-medium">Seuil d'activation:</span>
                      <span className="text-white">≥ 0.70</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-300 font-medium">Confiance:</span>
                      <span className="text-yellow-400 font-bold">87%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-600 rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-4 flex items-center text-lg">
                    <User className="w-5 h-5 mr-3 text-purple-400" />
                    Informations d'Exécution
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-gray-300 font-medium">Opérateur:</span>
                      <span className="text-white">Système automatisé</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-gray-300 font-medium">Durée d'exécution:</span>
                      <span className="text-white">2m 34s</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-300 font-medium">Ressources utilisées:</span>
                      <span className="text-green-400 font-bold">Normale</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Résultats et impact */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                  <Shield className="w-5 h-5 mr-3 text-orange-400" />
                  Résultats & Impact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { metric: 'Données collectées', value: '2.3 GB', color: 'text-blue-400' },
                    { metric: 'Signaux détectés', value: '47', color: 'text-yellow-400' },
                    { metric: 'Alertes générées', value: '3', color: 'text-red-400' },
                    { metric: 'Efficacité', value: '94%', color: 'text-green-400' }
                  ].map((result, index) => (
                    <div key={index} className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-300">{result.metric}</span>
                        <span className={`font-bold ${result.color}`}>{result.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions de suivi */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                  <Clock className="w-5 h-5 mr-3 text-indigo-400" />
                  Actions de Suivi Recommandées
                </h4>
                <div className="space-y-3">
                  {[
                    { action: 'Analyser les données collectées', priority: 'HAUTE', completed: true },
                    { action: 'Mettre à jour les profils de menace', priority: 'MOYENNE', completed: true },
                    { action: 'Informer les équipes terrain', priority: 'HAUTE', completed: false },
                    { action: 'Programmer surveillance continue', priority: 'BASSE', completed: false }
                  ].map((followUp, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          followUp.completed ? 'bg-green-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className="text-sm text-gray-300">{followUp.action}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={`text-xs ${
                          followUp.priority === 'HAUTE' ? 'text-red-400' : 
                          followUp.priority === 'MOYENNE' ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {followUp.priority}
                        </Badge>
                        <span className={`text-xs ${
                          followUp.completed ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                          {followUp.completed ? 'Terminé' : 'En cours'}
                        </span>
                      </div>
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
