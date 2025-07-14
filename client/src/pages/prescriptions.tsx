import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Users,
  Database,
  Network,
  Eye,
  Zap,
  Activity
} from "lucide-react";

interface Prescription {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'investigation' | 'mitigation' | 'response';
  threat_id?: string;
  threat_name?: string;
  actions: Action[];
  estimated_time: string;
  resources_needed: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  created_at: string;
  confidence_score: number;
}

interface Action {
  id: string;
  description: string;
  type: 'manual' | 'automatic';
  completed: boolean;
  details?: string;
}

export default function Prescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      const response = await fetch('/api/prescriptions');
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePrescriptionStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (response.ok) {
        setPrescriptions(prev => 
          prev.map(p => p.id === id ? { ...p, status: status as any } : p)
        );
        toast({
          title: "Statut mis à jour",
          description: `Prescription ${status === 'in_progress' ? 'en cours' : status === 'completed' ? 'terminée' : 'rejetée'}`,
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le statut",
        variant: "destructive",
      });
    }
  };

  const executeAction = async (prescriptionId: string, actionId: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/actions/${actionId}/execute`, {
        method: 'POST'
      });

      if (response.ok) {
        setPrescriptions(prev => 
          prev.map(p => p.id === prescriptionId ? {
            ...p,
            actions: p.actions.map(a => a.id === actionId ? { ...a, completed: true } : a)
          } : p)
        );
        toast({
          title: "Action exécutée",
          description: "L'action a été exécutée avec succès",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'exécuter l'action",
        variant: "destructive",
      });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return Shield;
      case 'investigation': return Search;
      case 'mitigation': return AlertTriangle;
      case 'response': return Activity;
      default: return FileText;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 bg-opacity-20 text-red-400 border-red-500';
      case 'high': return 'bg-orange-500 bg-opacity-20 text-orange-400 border-orange-500';
      case 'medium': return 'bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500';
      case 'low': return 'bg-green-500 bg-opacity-20 text-green-400 border-green-500';
      default: return 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 bg-opacity-20 text-green-400 border-green-500';
      case 'in_progress': return 'bg-blue-500 bg-opacity-20 text-blue-400 border-blue-500';
      case 'pending': return 'bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500';
      case 'dismissed': return 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500';
      default: return 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500';
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (activeTab === 'all') return true;
    return p.category === activeTab;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2 text-white">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Chargement des prescriptions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Prescriptions Automatisées</h1>
          <p className="text-gray-400">Recommandations d'actions basées sur l'analyse des menaces</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-500 bg-opacity-20 text-blue-400">
            {prescriptions.filter(p => p.status === 'pending').length} En attente
          </Badge>
          <Badge className="bg-green-500 bg-opacity-20 text-green-400">
            {prescriptions.filter(p => p.status === 'in_progress').length} En cours
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="all">
            <FileText className="w-4 h-4 mr-2" />
            Toutes
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="investigation">
            <Search className="w-4 h-4 mr-2" />
            Investigation
          </TabsTrigger>
          <TabsTrigger value="mitigation">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Mitigation
          </TabsTrigger>
          <TabsTrigger value="response">
            <Activity className="w-4 h-4 mr-2" />
            Réponse
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredPrescriptions.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucune prescription</h3>
                <p className="text-gray-400">
                  Aucune prescription disponible pour cette catégorie
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredPrescriptions.map((prescription) => {
                const CategoryIcon = getCategoryIcon(prescription.category);
                
                return (
                  <Card key={prescription.id} className="bg-slate-800 border-slate-700">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <CategoryIcon className="w-6 h-6 text-blue-400" />
                          <div>
                            <CardTitle className="text-white">{prescription.title}</CardTitle>
                            <p className="text-sm text-gray-400 mt-1">{prescription.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getPriorityColor(prescription.priority)}>
                            {prescription.priority.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(prescription.status)}>
                            {prescription.status === 'pending' && 'En attente'}
                            {prescription.status === 'in_progress' && 'En cours'}
                            {prescription.status === 'completed' && 'Terminé'}
                            {prescription.status === 'dismissed' && 'Rejeté'}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {prescription.threat_name && (
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Menace associée: {prescription.threat_name}</span>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">Temps estimé: {prescription.estimated_time}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">Confiance: {Math.round(prescription.confidence_score * 100)}%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">Ressources: {prescription.resources_needed.join(', ')}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium text-white">Actions recommandées:</h4>
                        <div className="space-y-2">
                          {prescription.actions.map((action) => (
                            <div key={action.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                              <div className="flex items-center space-x-3">
                                {action.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-400" />
                                ) : (
                                  <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                                )}
                                <div>
                                  <p className="text-white text-sm">{action.description}</p>
                                  {action.details && (
                                    <p className="text-xs text-gray-400 mt-1">{action.details}</p>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge variant="outline" className="text-xs">
                                  {action.type === 'automatic' ? 'Auto' : 'Manuel'}
                                </Badge>
                                {!action.completed && prescription.status !== 'completed' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => executeAction(prescription.id, action.id)}
                                    className="text-xs bg-blue-600 border-blue-500 text-white hover:bg-blue-700 hover:border-blue-400 transition-all duration-200 font-medium"
                                  >
                                    {action.type === 'automatic' ? (
                                      <>
                                        <Zap className="w-3 h-3 mr-1" />
                                        Exécuter
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="w-3 h-3 mr-1" />
                                        Marquer fait
                                      </>
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {prescription.status === 'pending' && (
                        <div className="flex items-center space-x-2 pt-4 border-t border-slate-700">
                          <Button
                            size="sm"
                            onClick={() => updatePrescriptionStatus(prescription.id, 'in_progress')}
                            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400 transition-all duration-200 font-medium"
                          >
                            <Activity className="w-4 h-4 mr-1" />
                            Commencer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updatePrescriptionStatus(prescription.id, 'dismissed')}
                            className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-200 font-medium"
                          >
                            Rejeter
                          </Button>
                        </div>
                      )}

                      {prescription.status === 'in_progress' && (
                        <div className="flex items-center space-x-2 pt-4 border-t border-slate-700">
                          <Button
                            size="sm"
                            onClick={() => updatePrescriptionStatus(prescription.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700 text-white border-green-500 hover:border-green-400 transition-all duration-200 font-medium"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Marquer terminé
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}