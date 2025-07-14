import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Clock, 
  MapPin, 
  Target, 
  AlertTriangle,
  CheckCircle,
  X,
  Search,
  Filter,
  Eye,
  Archive,
  Activity,
  Users,
  Database,
  RefreshCw,
  Shield,
  Info,
  ExternalLink
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CollectionRequest {
  id: string;
  zone: string;
  objectif: string;
  origine: string;
  urgence: 'Faible' | 'Moyenne' | 'Haute' | 'Critique';
  date: string;
  type_requete: string;
  scenario_id?: string;
  scenario_name?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  priority_score: number;
  assigned_to?: string;
  estimated_completion?: string;
  documents_analysed?: number;
  confidence_level?: number;
}

interface Document {
  id: string;
  title: string;
  type: string;
  classification: string;
  date_created: string;
  source: string;
  confidence_score: number;
  content: {
    resume: string;
    details: string;
    key_points: string[];
  };
  gaps_identified: string[];
}

interface DocumentsResponse {
  request_id: string;
  documents: Document[];
  analysis_summary: {
    total_documents: number;
    average_confidence: number;
    total_gaps_identified: number;
    document_types: string[];
    classification_levels: string[];
    analysis_period: {
      start: string;
      end: string;
    };
  };
}

// Composant pour afficher les documents analysés
function DocumentsModal({ requestId, requestTitle }: { requestId: string; requestTitle: string }) {
  const { data: documentsData, isLoading } = useQuery<DocumentsResponse>({
    queryKey: [`/api/collection-requests/${requestId}/documents`],
    enabled: !!requestId,
  });

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'SECRET': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200';
      case 'CONFIDENTIEL': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200';
      case 'NON CLASSIFIÉ': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'SIGINT': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200';
      case 'HUMINT': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200';
      case 'IMINT': return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-200';
      case 'OSINT': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
      case 'TECHINT': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Chargement des documents...</span>
      </div>
    );
  }

  if (!documentsData) {
    return (
      <div className="text-center p-8 text-gray-500">
        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Aucun document trouvé</p>
      </div>
    );
  }

  const { documents, analysis_summary } = documentsData;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Documents analysés pour: {requestTitle}</h3>
        
        {/* Résumé de l'analyse */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-blue-600 dark:text-blue-400 text-sm">Total documents</div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{analysis_summary.total_documents}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-green-600 dark:text-green-400 text-sm">Confiance moyenne</div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{(analysis_summary.average_confidence * 100).toFixed(0)}%</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
            <div className="text-orange-600 dark:text-orange-400 text-sm">Lacunes détectées</div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{analysis_summary.total_gaps_identified}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="text-purple-600 dark:text-purple-400 text-sm">Types de sources</div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{analysis_summary.document_types.length}</div>
          </div>
        </div>
      </div>

      <ScrollArea className="h-96">
        <div className="space-y-4">
          {documents.map((doc) => (
            <Card key={doc.id} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{doc.title}</CardTitle>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getTypeColor(doc.type)}>{doc.type}</Badge>
                      <Badge className={getClassificationColor(doc.classification)}>
                        <Shield className="h-3 w-3 mr-1" />
                        {doc.classification}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Source:</strong> {doc.source}</p>
                      <p><strong>Date:</strong> {new Date(doc.date_created).toLocaleDateString('fr-FR')}</p>
                      <p><strong>Confiance:</strong> {(doc.confidence_score * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Résumé</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{doc.content.resume}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Détails</h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{doc.content.details}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Points clés</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {doc.content.key_points.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2 text-orange-600 dark:text-orange-400">Lacunes identifiées</h4>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                      {doc.gaps_identified.map((gap, index) => (
                        <li key={index} className="flex items-start">
                          <AlertTriangle className="h-4 w-4 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function CollectionRequests() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [urgenceFilter, setUrgenceFilter] = useState('');
  const [activeTab, setActiveTab] = useState('active');
  const queryClient = useQueryClient();

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['/api/collection-requests'],
    refetchInterval: 30000,
  });

  const { data: statisticsData } = useQuery({
    queryKey: ['/api/collection-requests/statistics'],
    refetchInterval: 30000,
  });

  const generateRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/collection-requests/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to generate request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collection-requests'] });
      toast({
        title: "Requête générée",
        description: "Une nouvelle requête de collecte a été générée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de générer la requête de collecte.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await fetch(`/api/collection-requests/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collection-requests'] });
      toast({
        title: "Statut mis à jour",
        description: "Le statut de la requête a été mis à jour avec succès.",
      });
    },
  });

  const requests = requestsData?.requests || [];
  const statistics = statisticsData?.statistics || {};

  const filteredRequests = requests.filter((request: CollectionRequest) => {
    const matchesSearch = !searchTerm || 
      request.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.objectif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.origine.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || request.status === statusFilter;
    const matchesUrgence = !urgenceFilter || request.urgence === urgenceFilter;
    
    const matchesTab = activeTab === 'active' ? 
      request.status === 'pending' || request.status === 'in_progress' :
      request.status === 'completed' || request.status === 'cancelled';
    
    return matchesSearch && matchesStatus && matchesUrgence && matchesTab;
  });

  const getUrgenceColor = (urgence: string) => {
    switch (urgence) {
      case 'Critique': return 'bg-red-600 text-white';
      case 'Haute': return 'bg-red-500 text-white';
      case 'Moyenne': return 'bg-yellow-600 text-white';
      case 'Faible': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-600 text-white';
      case 'in_progress': return 'bg-yellow-600 text-white';
      case 'completed': return 'bg-green-600 text-white';
      case 'cancelled': return 'bg-gray-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'En Attente';
      case 'in_progress': return 'En Cours';
      case 'completed': return 'Terminée';
      case 'cancelled': return 'Annulée';
      default: return 'Inconnu';
    }
  };

  const handleGenerateRequest = async () => {
    generateRequestMutation.mutate({
      auto_generate: true,
      source: 'scenario_analysis'
    });
  };

  const handleUpdateStatus = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Requêtes de Collecte</h1>
          <p className="text-gray-400">Génération automatique de requêtes de renseignement</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleGenerateRequest}
            disabled={generateRequestMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400 transition-all duration-200 font-medium"
          >
            {generateRequestMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Génération...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Générer Requête
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Requêtes Actives</p>
                <p className="text-2xl font-bold text-white">{statistics.active_requests || 0}</p>
              </div>
              <Activity className="w-6 h-6 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Terminées</p>
                <p className="text-2xl font-bold text-white">{statistics.completed_requests || 0}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Taux de Succès</p>
                <p className="text-2xl font-bold text-white">{statistics.success_rate || '0%'}</p>
              </div>
              <Target className="w-6 h-6 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Temps Moyen</p>
                <p className="text-2xl font-bold text-white">{statistics.avg_completion_time || 'N/A'}</p>
              </div>
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher requêtes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
              >
                <option value="">Tous les statuts</option>
                <option value="pending">En Attente</option>
                <option value="in_progress">En Cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
              <select
                value={urgenceFilter}
                onChange={(e) => setUrgenceFilter(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
              >
                <option value="">Toutes urgences</option>
                <option value="Critique">Critique</option>
                <option value="Haute">Haute</option>
                <option value="Moyenne">Moyenne</option>
                <option value="Faible">Faible</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="active">Requêtes Actives</TabsTrigger>
          <TabsTrigger value="archived">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-gray-800 border-gray-700 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-4" />
                    <div className="h-6 bg-gray-700 rounded w-1/4 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests.length > 0 ? (
            <div className="space-y-4">
              {filteredRequests.map((request: CollectionRequest) => (
                <Card key={request.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-white">{request.objectif}</h3>
                          <Badge className={getUrgenceColor(request.urgence)}>
                            {request.urgence}
                          </Badge>
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusText(request.status)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>Zone: {request.zone}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span>Type: {request.type_requete}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-300">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span>Créée: {new Date(request.created_at).toLocaleString()}</span>
                          </div>
                          {request.scenario_name && (
                            <div className="flex items-center space-x-2 text-sm text-gray-300">
                              <Target className="w-4 h-4 text-gray-400" />
                              <span>Scénario: {request.scenario_name}</span>
                            </div>
                          )}
                        </div>

                        <div className="bg-gray-700 p-3 rounded-md mb-4">
                          <p className="text-sm text-gray-300">
                            <span className="font-medium">Origine:</span> {request.origine}
                          </p>
                        </div>

                        {request.documents_analysed && (
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 p-1 h-auto"
                                >
                                  <Database className="w-4 h-4 mr-1" />
                                  {request.documents_analysés} documents analysés
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-6xl h-[80vh] bg-gray-900 border-gray-700 text-white">
                                <DialogHeader>
                                  <DialogTitle>Documents Analysés</DialogTitle>
                                </DialogHeader>
                                <DocumentsModal 
                                  requestId={request.id} 
                                  requestTitle={request.objectif} 
                                />
                              </DialogContent>
                            </Dialog>
                            {request.confidence_level && (
                              <span>🎯 Confiance: {Math.round(request.confidence_level * 100)}%</span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleUpdateStatus(request.id, 'in_progress')}
                              className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400 transition-all duration-200 font-medium"
                            >
                              <Activity className="w-4 h-4 mr-1" />
                              Commencer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateStatus(request.id, 'cancelled')}
                              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-200 font-medium"
                            >
                              <X className="w-4 h-4 mr-1" />
                              Annuler
                            </Button>
                          </>
                        )}
                        {request.status === 'in_progress' && (
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(request.id, 'completed')}
                            className="bg-green-600 hover:bg-green-700 text-white border-green-500 hover:border-green-400 transition-all duration-200 font-medium"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Terminer
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-200 font-medium"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Détails
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-12 text-center">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucune requête trouvée</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm || statusFilter || urgenceFilter ? 
                    'Aucune requête ne correspond aux critères de recherche' : 
                    'Aucune requête de collecte générée pour le moment'}
                </p>
                {!searchTerm && !statusFilter && !urgenceFilter && (
                  <Button
                    onClick={handleGenerateRequest}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400 transition-all duration-200 font-medium"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Générer Première Requête
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}