import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenarioApi } from '@/lib/api';
import { Plus, AlertTriangle, Clock, CheckCircle, Eye, Activity, Target, Settings } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export function ActiveScenarios() {
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    priority: 1
  });

  const queryClient = useQueryClient();
  
  const { data: scenariosData, isLoading } = useQuery({
    queryKey: ['/api/scenarios'],
    queryFn: scenarioApi.getScenarios,
    refetchInterval: 15000,
  });

  const createScenarioMutation = useMutation({
    mutationFn: scenarioApi.createScenario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
      setShowCreateDialog(false);
      setNewScenario({ name: '', description: '', priority: 1 });
    },
    onError: (error) => {
      console.error('Erreur lors de la création du scénario:', error);
    }
  });

  const handleCreateScenario = () => {
    createScenarioMutation.mutate(newScenario);
  };

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
            onClick={() => setShowCreateDialog(true)}
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
                className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => setSelectedScenario(scenario)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {scenario.name}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(scenario.status)} text-xs`}>
                      {getStatusIcon(scenario.status)}
                      <span className="ml-1">{getStatusText(scenario.status)}</span>
                    </Badge>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
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

      {/* Modal des détails du scénario */}
      <Dialog open={!!selectedScenario} onOpenChange={() => setSelectedScenario(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader className="pb-4 border-b border-slate-700">
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <Target className="w-6 h-6 text-blue-500" />
              <span className="text-white">Détails du Scénario</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedScenario && (
            <div className="space-y-6 pt-4">
              {/* En-tête du scénario */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                      <Activity className="w-6 h-6 mr-3 text-blue-400" />
                      {selectedScenario.name}
                    </h3>
                    <p className="text-gray-300 text-sm">{selectedScenario.description}</p>
                  </div>
                  <Badge className={`${getStatusColor(selectedScenario.status)} text-sm px-3 py-1`}>
                    {getStatusIcon(selectedScenario.status)}
                    <span className="ml-1">{getStatusText(selectedScenario.status)}</span>
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Priorité</p>
                    <p className="text-2xl font-bold text-orange-400">{selectedScenario.priority}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Conditions</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {selectedScenario.conditions_met}/{selectedScenario.total_conditions}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Score</p>
                    <p className="text-2xl font-bold text-green-400">
                      {selectedScenario.conditions_met > 0 ? '0.87' : '0.00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Conditions du scénario */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                  <CheckCircle className="w-5 h-5 mr-3 text-green-400" />
                  Conditions de Déclenchement
                </h4>
                <div className="space-y-3">
                  {selectedScenario.conditions && selectedScenario.conditions.length > 0 ? (
                    selectedScenario.conditions.map((condition: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            condition.met ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          <span className="text-sm text-gray-300">{condition.description}</span>
                        </div>
                        <Badge variant="outline" className={`text-xs ${
                          condition.met ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {condition.met ? 'Satisfaite' : 'Non satisfaite'}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>Aucune condition définie</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions du scénario */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                  <Settings className="w-5 h-5 mr-3 text-orange-400" />
                  Actions Prévues
                </h4>
                <div className="space-y-3">
                  {selectedScenario.actions && selectedScenario.actions.length > 0 ? (
                    selectedScenario.actions.map((action: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-300">{action.description}</span>
                        </div>
                        <Badge variant="outline" className="text-xs text-blue-400">
                          {action.type}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>Aucune action définie</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Historique et logs */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                  <Clock className="w-5 h-5 mr-3 text-purple-400" />
                  Historique d'Exécution
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-300">Dernier déclenchement</span>
                      <span className="text-xs text-gray-400">
                        {selectedScenario.last_triggered ? 
                          formatDistanceToNow(new Date(selectedScenario.last_triggered), { addSuffix: true }) : 
                          'Jamais déclenché'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">Statut d'exécution</span>
                      <Badge variant="outline" className="text-xs text-green-400">
                        Opérationnel
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de création de scénario */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl bg-slate-900 border-slate-700">
          <DialogHeader className="pb-4 border-b border-slate-700">
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <Plus className="w-6 h-6 text-blue-500" />
              <span className="text-white">Créer un Nouveau Scénario</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="scenario-name" className="text-gray-300">Nom du Scénario</Label>
              <Input
                id="scenario-name"
                value={newScenario.name}
                onChange={(e) => setNewScenario({...newScenario, name: e.target.value})}
                placeholder="Ex: CYBER-INTRUSION-08"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="scenario-description" className="text-gray-300">Description</Label>
              <Textarea
                id="scenario-description"
                value={newScenario.description}
                onChange={(e) => setNewScenario({...newScenario, description: e.target.value})}
                placeholder="Description détaillée du scénario..."
                className="bg-slate-800 border-slate-600 text-white"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="scenario-priority" className="text-gray-300">Priorité</Label>
              <Input
                id="scenario-priority"
                type="number"
                value={newScenario.priority}
                onChange={(e) => setNewScenario({...newScenario, priority: parseInt(e.target.value)})}
                min="1"
                max="10"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
                className="border-slate-600 text-gray-300"
              >
                Annuler
              </Button>
              <Button
                onClick={handleCreateScenario}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Créer le Scénario
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
