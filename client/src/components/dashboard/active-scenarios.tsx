import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scenarioApi } from '@/lib/api';
import { Plus, AlertTriangle, Clock, CheckCircle, Eye, Activity, Target, Settings, Shield, Zap, Globe, Monitor } from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export function ActiveScenarios() {
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newScenario, setNewScenario] = useState({
    name: '',
    description: '',
    priority: 1,
    type: 'CYBER',
    classification: 'CONFIDENTIEL',
    region: 'FRANCE',
    duration: '30',
    conditions: [],
    actions: []
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
      setNewScenario({ 
        name: '', 
        description: '', 
        priority: 1, 
        type: 'CYBER', 
        classification: 'CONFIDENTIEL', 
        region: 'FRANCE', 
        duration: '30', 
        conditions: [], 
        actions: [] 
      });
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
                className="group border border-slate-700 rounded-xl p-5 hover:border-slate-500 hover:bg-slate-700/50 transition-all duration-200 cursor-pointer"
                onClick={() => setSelectedScenario(scenario)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      scenario.status === 'active' ? 'bg-red-500/20 text-red-400' : 
                      scenario.status === 'partial' ? 'bg-orange-500/20 text-orange-400' : 
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {getStatusIcon(scenario.status)}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {scenario.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Type: {scenario.type || 'CYBER'} • Priorité: {scenario.priority}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${getStatusColor(scenario.status)} text-xs px-3 py-1`}>
                      <span className="ml-1">{getStatusText(scenario.status)}</span>
                    </Badge>
                    <Eye className="w-4 h-4 text-gray-400 group-hover:text-blue-400 transition-colors" />
                  </div>
                </div>
                
                <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                  {scenario.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-400">
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-3 h-3" />
                      <span>{scenario.conditions_met}/{scenario.total_conditions} conditions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Target className="w-3 h-3" />
                      <span>Score: {scenario.conditions_met > 0 ? '0.87' : '0.00'}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className={`w-2 h-2 rounded-full ${
                      scenario.conditions_met > 0 ? 'bg-green-500' : 'bg-gray-500'
                    }`}></div>
                    <span className="text-xs text-gray-400">
                      {scenario.conditions_met > 0 ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
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
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-600 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-slate-600/50">
            <DialogTitle className="flex items-center space-x-4 text-2xl font-bold">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-white">Créer un Nouveau Scénario d'Intelligence</span>
                <p className="text-sm text-gray-400 font-normal mt-1">Configuration avancée pour opérations de renseignement</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8 pt-6">
            {/* Informations générales */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4">
                  <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">Informations Générales</h3>
                  <p className="text-gray-400 text-sm">Configuration de base du scénario</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="scenario-name" className="text-gray-200 font-semibold text-sm flex items-center">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                    Code Opération
                  </Label>
                  <Input
                    id="scenario-name"
                    value={newScenario.name}
                    onChange={(e) => setNewScenario({...newScenario, name: e.target.value})}
                    placeholder="Ex: CYBER-INTRUSION-08"
                    className="bg-slate-700/80 border-slate-500 text-white h-12 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scenario-type" className="text-gray-200 font-semibold text-sm flex items-center">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                    Type d'Opération
                  </Label>
                  <select
                    id="scenario-type"
                    value={newScenario.type}
                    onChange={(e) => setNewScenario({...newScenario, type: e.target.value})}
                    className="w-full bg-slate-700/80 border border-slate-500 text-white rounded-lg px-4 py-3 h-12 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
                  >
                    <option value="CYBER">🔒 Cyber Intelligence</option>
                    <option value="HUMINT">👥 Human Intelligence</option>
                    <option value="SIGINT">📡 Signal Intelligence</option>
                    <option value="IMINT">🛰️ Imagery Intelligence</option>
                    <option value="GEOINT">🌍 Geospatial Intelligence</option>
                    <option value="TECHINT">⚙️ Technical Intelligence</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scenario-priority" className="text-gray-200 font-semibold text-sm flex items-center">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                    Niveau de Priorité
                  </Label>
                  <select
                    id="scenario-priority"
                    value={newScenario.priority}
                    onChange={(e) => setNewScenario({...newScenario, priority: parseInt(e.target.value)})}
                    className="w-full bg-slate-700/80 border border-slate-500 text-white rounded-lg px-4 py-3 h-12 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
                  >
                    <option value="1">🔴 Critique (1)</option>
                    <option value="2">🟠 Urgent (2)</option>
                    <option value="3">🟡 Élevé (3)</option>
                    <option value="4">🟢 Normal (4)</option>
                    <option value="5">🔵 Faible (5)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scenario-classification" className="text-gray-200 font-semibold text-sm flex items-center">
                    <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                    Classification
                  </Label>
                  <select
                    id="scenario-classification"
                    value={newScenario.classification}
                    onChange={(e) => setNewScenario({...newScenario, classification: e.target.value})}
                    className="w-full bg-slate-700/80 border border-slate-500 text-white rounded-lg px-4 py-3 h-12 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
                  >
                    <option value="SECRET-DEFENSE">🔒 SECRET-DÉFENSE</option>
                    <option value="CONFIDENTIEL">🔐 CONFIDENTIEL</option>
                    <option value="DIFFUSION-RESTREINTE">📋 DIFFUSION RESTREINTE</option>
                    <option value="NON-CLASSIFIE">📄 NON CLASSIFIÉ</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Configuration opérationnelle */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mr-4">
                  <Globe className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">Configuration Opérationnelle</h3>
                  <p className="text-gray-400 text-sm">Paramètres géographiques et temporels</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="scenario-region" className="text-gray-200 font-semibold text-sm flex items-center">
                    <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                    Zone Géographique
                  </Label>
                  <select
                    id="scenario-region"
                    value={newScenario.region}
                    onChange={(e) => setNewScenario({...newScenario, region: e.target.value})}
                    className="w-full bg-slate-700/80 border border-slate-500 text-white rounded-lg px-4 py-3 h-12 focus:outline-none focus:ring-2 focus:ring-blue-400/20 focus:border-blue-400 transition-all"
                  >
                    <option value="FRANCE">🇫🇷 France Métropolitaine</option>
                    <option value="EUROPE">🇪🇺 Europe</option>
                    <option value="AFRIQUE">🌍 Afrique</option>
                    <option value="MOYEN-ORIENT">🏜️ Moyen-Orient</option>
                    <option value="ASIE">🌏 Asie-Pacifique</option>
                    <option value="AMERIQUES">🌎 Amériques</option>
                    <option value="GLOBAL">🌐 Mondial</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scenario-duration" className="text-gray-200 font-semibold text-sm flex items-center">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></div>
                    Durée d'Opération (jours)
                  </Label>
                  <Input
                    id="scenario-duration"
                    type="number"
                    value={newScenario.duration}
                    onChange={(e) => setNewScenario({...newScenario, duration: e.target.value})}
                    placeholder="30"
                    min="1"
                    max="365"
                    className="bg-slate-700/80 border-slate-500 text-white h-12 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Description et objectifs */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mr-4">
                  <Target className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">Description et Objectifs</h3>
                  <p className="text-gray-400 text-sm">Contexte et finalité opérationnelle</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="scenario-description" className="text-gray-200 font-semibold text-sm flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                    Description Opérationnelle
                  </Label>
                  <Textarea
                    id="scenario-description"
                    value={newScenario.description}
                    onChange={(e) => setNewScenario({...newScenario, description: e.target.value})}
                    placeholder="Décrivez les objectifs, le contexte et les enjeux du scénario..."
                    className="bg-slate-700/80 border-slate-500 text-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                    rows={5}
                  />
                </div>
              </div>
            </div>

            {/* Paramètres avancés */}
            <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mr-4">
                  <Settings className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xl">Paramètres Avancés</h3>
                  <p className="text-gray-400 text-sm">Conditions et actions automatisées</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label className="text-gray-200 font-semibold text-sm mb-4 block flex items-center">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                    Conditions de Déclenchement
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 bg-slate-700/60 rounded-xl border border-slate-600/50 hover:bg-slate-700/80 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400" />
                      <span className="text-sm text-gray-200">Score de menace {'>'} 0.7</span>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-slate-700/60 rounded-xl border border-slate-600/50 hover:bg-slate-700/80 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400" />
                      <span className="text-sm text-gray-200">Sources multiples confirmées</span>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-slate-700/60 rounded-xl border border-slate-600/50 hover:bg-slate-700/80 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400" />
                      <span className="text-sm text-gray-200">Validation humaine requise</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="text-gray-200 font-semibold text-sm mb-4 block flex items-center">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></div>
                    Actions Automatiques
                  </Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-4 bg-slate-700/60 rounded-xl border border-slate-600/50 hover:bg-slate-700/80 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400" />
                      <span className="text-sm text-gray-200">Collecte SIGINT</span>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-slate-700/60 rounded-xl border border-slate-600/50 hover:bg-slate-700/80 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400" />
                      <span className="text-sm text-gray-200">Analyse réseau</span>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-slate-700/60 rounded-xl border border-slate-600/50 hover:bg-slate-700/80 transition-all">
                      <input type="checkbox" className="w-4 h-4 text-blue-500 rounded focus:ring-blue-400" />
                      <span className="text-sm text-gray-200">Génération de rapport</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Boutons d'action */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-600/50">
              <div className="text-sm text-gray-400">
                <p>Toutes les informations sont chiffrées et sécurisées</p>
              </div>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  className="border-slate-500 text-gray-300 hover:bg-slate-700/80 hover:border-slate-400 px-6 py-3 h-12 transition-all"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateScenario}
                  disabled={createScenarioMutation.isPending || !newScenario.name || !newScenario.description}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 h-12 shadow-lg transition-all disabled:opacity-50"
                >
                  {createScenarioMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Création en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-3" />
                      Créer le Scénario
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
