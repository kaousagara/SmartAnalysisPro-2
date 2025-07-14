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
import { Plus, Play, Pause, Settings, Trash2, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default function Scenarios() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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
            <Button className="bg-primary hover:bg-primary/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Scenario
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-dark-surface border-dark-border max-w-2xl">
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
                  className="border-dark-border text-gray-300 hover:bg-dark-elevated"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  {createMutation.isPending ? "Creating..." : "Create Scenario"}
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
                      onClick={() => handleStatusToggle(scenario.id, scenario.status)}
                      className={`${scenario.status === 'active' ? 
                        'text-error border-error hover:bg-error' : 
                        'text-success border-success hover:bg-success'} hover:text-white`}
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
                      className="text-error border-error hover:bg-error hover:text-white"
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
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Scenario
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
