import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scenarioApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Play, Pause, Settings, Trash2, AlertTriangle, CheckCircle, Clock, Eye, Shield, Globe, Target, Zap, Monitor, Calendar, Users, Activity } from "lucide-react";

export default function Scenarios() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [newScenario, setNewScenario] = useState({
    name: "",
    description: "",
    conditions: "",
    actions: "",
    priority: 1,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scenariosData, isLoading } = useQuery({
    queryKey: ['/api/scenarios'],
    queryFn: scenarioApi.getScenarios,
    refetchInterval: 10000,
  });

  const createMutation = useMutation({
    mutationFn: scenarioApi.createScenario,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scenario created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
      setIsCreateDialogOpen(false);
      setNewScenario({ name: "", description: "", conditions: "", actions: "", priority: 1 });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create scenario",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => scenarioApi.updateScenario(id, data),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scenario updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update scenario",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: scenarioApi.deleteScenario,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Scenario deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scenarios'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete scenario",
        variant: "destructive",
      });
    },
  });

  const handleCreateScenario = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const conditions = JSON.parse(newScenario.conditions);
      const actions = JSON.parse(newScenario.actions);
      
      createMutation.mutate({
        name: newScenario.name,
        description: newScenario.description,
        conditions,
        actions,
        priority: newScenario.priority,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Invalid JSON format in conditions or actions",
        variant: "destructive",
      });
    }
  };

  const handleStatusToggle = (scenarioId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateMutation.mutate({ id: scenarioId, data: { status: newStatus } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'scenario-active';
      case 'partial':
        return 'scenario-partial';
      default:
        return 'scenario-inactive';
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

  const handleViewDetails = (scenario: any) => {
    setSelectedScenario(scenario);
    setShowDetailsDialog(true);
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 2:
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 3:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 4:
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'Critique';
      case 2:
        return 'Urgent';
      case 3:
        return 'Élevé';
      case 4:
        return 'Normal';
      default:
        return 'Faible';
    }
  };

  const scenarios = scenariosData?.scenarios || [];
  const activeScenarios = scenarios.filter(s => s.status === 'active').length;
  const partialScenarios = scenarios.filter(s => s.status === 'partial').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Scenario Management</h1>
          <p className="text-gray-400">Configure and monitor automated threat response scenarios</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400 transition-all duration-200 font-medium shadow-lg">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau Scénario
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Scenario</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateScenario} className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">Name</Label>
                <Input
                  id="name"
                  value={newScenario.name}
                  onChange={(e) => setNewScenario(prev => ({ ...prev, name: e.target.value }))}
                  className="bg-dark-elevated border-dark-border text-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={newScenario.description}
                  onChange={(e) => setNewScenario(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-dark-elevated border-dark-border text-white"
                />
              </div>
              <div>
                <Label htmlFor="conditions" className="text-gray-300">Conditions (JSON)</Label>
                <Textarea
                  id="conditions"
                  placeholder='[{"type": "score_threshold", "value": 0.75}]'
                  value={newScenario.conditions}
                  onChange={(e) => setNewScenario(prev => ({ ...prev, conditions: e.target.value }))}
                  className="bg-dark-elevated border-dark-border text-white font-mono"
                  required
                />
              </div>
              <div>
                <Label htmlFor="actions" className="text-gray-300">Actions (JSON)</Label>
                <Textarea
                  id="actions"
                  placeholder='[{"type": "trigger_collection", "collection_type": "SIGINT", "priority": 1}]'
                  value={newScenario.actions}
                  onChange={(e) => setNewScenario(prev => ({ ...prev, actions: e.target.value }))}
                  className="bg-dark-elevated border-dark-border text-white font-mono"
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority" className="text-gray-300">Priority</Label>
                <select
                  id="priority"
                  value={newScenario.priority}
                  onChange={(e) => setNewScenario(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
                  className="w-full bg-dark-elevated border-dark-border text-white rounded-md px-3 py-2"
                >
                  <option value={1}>P1 - Critical</option>
                  <option value={2}>P2 - High</option>
                  <option value={3}>P3 - Medium</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-200 font-medium"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400 transition-all duration-200 font-medium shadow-lg"
                >
                  {createMutation.isPending ? "Création..." : "Créer Scénario"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Active Scenarios</p>
                <p className="text-2xl font-bold text-white">{activeScenarios}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Partial Scenarios</p>
                <p className="text-2xl font-bold text-white">{partialScenarios}</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-dark-surface border-dark-border">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Scenarios</p>
                <p className="text-2xl font-bold text-white">{scenarios.length}</p>
              </div>
              <Settings className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scenarios List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-dark-surface border-dark-border animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-4" />
                  <div className="h-6 bg-gray-700 rounded w-1/4 mb-2" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          scenarios.map((scenario) => (
            <Card key={scenario.id} className="bg-dark-surface border-dark-border">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{scenario.name}</h3>
                      <Badge className={`${getStatusColor(scenario.status)} text-xs`}>
                        {getStatusIcon(scenario.status)}
                        <span className="ml-1">
                          {scenario.status === 'active' ? '🔴 Active' : 
                           scenario.status === 'partial' ? '⚠️ Partial' : '⚫ Inactive'}
                        </span>
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        P{scenario.priority}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-400 mb-4">{scenario.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-400">
                      <span>{scenario.conditions_met}/{scenario.total_conditions} conditions met</span>
                      <span>{scenario.conditions.length} conditions</span>
                      <span>{scenario.actions.length} actions</span>
                      {scenario.last_triggered && (
                        <span>Last triggered: {new Date(scenario.last_triggered).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(scenario)}
                      className="bg-blue-600 border-blue-500 text-white hover:bg-blue-700 hover:border-blue-400 transition-all duration-200 font-medium"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusToggle(scenario.id, scenario.status)}
                      className={`${scenario.status === 'active' ? 
                        'bg-red-600 border-red-500 text-white hover:bg-red-700 hover:border-red-400' : 
                        'bg-green-600 border-green-500 text-white hover:bg-green-700 hover:border-green-400'} transition-all duration-200 font-medium`}
                    >
                      {scenario.status === 'active' ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(scenario.id)}
                      className="bg-red-600 border-red-500 text-white hover:bg-red-700 hover:border-red-400 hover:text-white transition-all duration-200 font-medium"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
        
        {scenarios.length === 0 && !isLoading && (
          <Card className="bg-dark-surface border-dark-border">
            <CardContent className="p-12 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No scenarios configured</h3>
              <p className="text-gray-400 mb-4">
                Create your first scenario to automate threat response
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400 transition-all duration-200 font-medium shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Créer Premier Scénario
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de détails du scénario */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-600 shadow-2xl">
          <DialogHeader className="pb-6 border-b border-slate-600/50">
            <DialogTitle className="flex items-center space-x-4 text-2xl font-bold">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-white">{selectedScenario?.name || 'Détails du Scénario'}</span>
                <p className="text-sm text-gray-400 font-normal mt-1">Analyse détaillée du scénario d'intelligence</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedScenario && (
            <div className="space-y-8 pt-6">
              {/* Informations générales */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center mr-4">
                    <Shield className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">Informations Générales</h3>
                    <p className="text-gray-400 text-sm">Configuration et statut du scénario</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-200 font-semibold text-sm flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      Nom du Scénario
                    </Label>
                    <div className="bg-slate-700/60 rounded-xl p-3 border border-slate-600/50">
                      <p className="text-white font-medium">{selectedScenario.name}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-200 font-semibold text-sm flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      Statut
                    </Label>
                    <div className="bg-slate-700/60 rounded-xl p-3 border border-slate-600/50">
                      <Badge className={`${getStatusColor(selectedScenario.status)} text-xs`}>
                        {getStatusIcon(selectedScenario.status)}
                        <span className="ml-2">
                          {selectedScenario.status === 'active' ? 'Actif' : 
                           selectedScenario.status === 'partial' ? 'Partiel' : 'Inactif'}
                        </span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-200 font-semibold text-sm flex items-center">
                      <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                      Priorité
                    </Label>
                    <div className="bg-slate-700/60 rounded-xl p-3 border border-slate-600/50">
                      <Badge className={`${getPriorityColor(selectedScenario.priority)} text-xs border`}>
                        P{selectedScenario.priority} - {getPriorityLabel(selectedScenario.priority)}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <Label className="text-gray-200 font-semibold text-sm flex items-center">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                    Description
                  </Label>
                  <div className="bg-slate-700/60 rounded-xl p-4 border border-slate-600/50">
                    <p className="text-gray-200 leading-relaxed">{selectedScenario.description}</p>
                  </div>
                </div>
              </div>

              {/* Conditions */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center mr-4">
                    <Target className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">Conditions de Déclenchement</h3>
                    <p className="text-gray-400 text-sm">Critères d'activation automatique</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedScenario.conditions.map((condition: any, index: number) => (
                    <div key={index} className="bg-slate-700/60 rounded-xl p-4 border border-slate-600/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center mt-1">
                          <Activity className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{condition.description}</p>
                          <div className="mt-2 text-xs text-gray-400">
                            <p>Type: {condition.type}</p>
                            {condition.threshold && <p>Seuil: {condition.threshold}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-slate-900/60 rounded-xl border border-slate-600/50">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Conditions remplies</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-300"
                          style={{ width: `${(selectedScenario.conditions_met / selectedScenario.total_conditions) * 100}%` }}
                        />
                      </div>
                      <span className="text-white text-sm font-medium">
                        {selectedScenario.conditions_met}/{selectedScenario.total_conditions}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center mr-4">
                    <Zap className="w-6 h-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">Actions Automatiques</h3>
                    <p className="text-gray-400 text-sm">Réponses programmées lors du déclenchement</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedScenario.actions.map((action: any, index: number) => (
                    <div key={index} className="bg-slate-700/60 rounded-xl p-4 border border-slate-600/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center mt-1">
                          <Zap className="w-4 h-4 text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-white font-medium text-sm">{action.description}</p>
                          <div className="mt-2 text-xs text-gray-400">
                            <p>Type: {action.type}</p>
                            {action.priority && <p>Priorité: {action.priority}</p>}
                            {action.collection_type && <p>Collection: {action.collection_type}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Métriques et historique */}
              <div className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 backdrop-blur-sm border border-slate-600/50 rounded-2xl p-8 shadow-lg">
                <div className="flex items-center mb-6">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center mr-4">
                    <Monitor className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-xl">Métriques et Historique</h3>
                    <p className="text-gray-400 text-sm">Performances et utilisation du scénario</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-700/60 rounded-xl p-4 border border-slate-600/50 text-center">
                    <Calendar className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Dernière activation</p>
                    <p className="text-white font-medium">
                      {selectedScenario.last_triggered ? 
                        new Date(selectedScenario.last_triggered).toLocaleDateString('fr-FR') : 
                        'Jamais'
                      }
                    </p>
                  </div>
                  
                  <div className="bg-slate-700/60 rounded-xl p-4 border border-slate-600/50 text-center">
                    <Users className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Créé par</p>
                    <p className="text-white font-medium">Système</p>
                  </div>
                  
                  <div className="bg-slate-700/60 rounded-xl p-4 border border-slate-600/50 text-center">
                    <Activity className="w-8 h-8 text-orange-400 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Version</p>
                    <p className="text-white font-medium">v1.0</p>
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-slate-600/50">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsDialog(false)}
                  className="border-slate-500 text-gray-300 hover:bg-slate-700/80 hover:border-slate-400 px-6 py-3 h-12 transition-all"
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => handleStatusToggle(selectedScenario.id, selectedScenario.status)}
                  className={`${selectedScenario.status === 'active' ? 
                    'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 
                    'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'} text-white px-8 py-3 h-12 shadow-lg transition-all`}
                >
                  {selectedScenario.status === 'active' ? (
                    <>
                      <Pause className="w-5 h-5 mr-3" />
                      Désactiver
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-3" />
                      Activer
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
