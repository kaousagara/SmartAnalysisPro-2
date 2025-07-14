import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Plus, 
  MapPin, 
  Calendar, 
  AlertTriangle, 
  Target,
  CheckCircle,
  Clock,
  Filter,
  Zap,
  Users,
  Shield,
  RefreshCw
} from 'lucide-react';

interface CollectionRequest {
  id: string;
  zone: string;
  objectif: string;
  origine: string;
  urgence: string;
  date: string;
  type_requete: string;
  scenario_id?: string;
  threat_id?: string;
  status: string;
  created_at: string;
  expires_at: string;
}

export default function CollectionRequests() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isExampleDialogOpen, setIsExampleDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    type: 'information_gap',
    zone: '',
    missing_info: '',
    threat_type: '',
    confidence: 0.5,
    threat_level: 'medium'
  });

  const [predictionValidation, setPredictionValidation] = useState({
    prediction_id: '',
    hypothesis: '',
    confidence: 0.7,
    zone: '',
    threat_type: 'terrorisme'
  });

  const [isValidationDialogOpen, setIsValidationDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  // Récupération des requêtes de collecte
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['/api/collection-requests'],
    refetchInterval: 30000 // Rafraîchir toutes les 30 secondes
  });

  // Récupération des exemples
  const { data: examplesData } = useQuery({
    queryKey: ['/api/collection-requests/examples']
  });

  // Mutation pour déclencher une requête
  const triggerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/collection-requests/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erreur lors de la génération');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collection-requests'] });
      setIsCreateDialogOpen(false);
      setNewRequest({
        type: 'information_gap',
        zone: '',
        missing_info: '',
        threat_type: '',
        confidence: 0.5,
        threat_level: 'medium'
      });
    }
  });

  // Mutation pour générer une requête de validation de prédiction
  const validationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/collection-requests/prediction-validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Erreur lors de la génération de validation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collection-requests'] });
      setIsValidationDialogOpen(false);
      setPredictionValidation({
        prediction_id: '',
        hypothesis: '',
        confidence: 0.7,
        zone: '',
        threat_type: 'terrorisme'
      });
    }
  });

  // Mutation pour marquer comme satisfaite
  const fulfillMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const response = await fetch(`/api/collection-requests/${requestId}/fulfill`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fulfillment_info: {} })
      });
      if (!response.ok) throw new Error('Erreur lors du traitement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/collection-requests'] });
    }
  });

  const requests = requestsData?.collection_requests || [];
  const examples = examplesData?.examples || [];

  // Filtrage des requêtes
  const filteredRequests = requests.filter((request: CollectionRequest) => {
    const matchesSearch = !searchTerm || 
      request.objectif.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.origine.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesZone = !selectedZone || selectedZone === 'all' || request.zone === selectedZone;
    const matchesUrgency = !selectedUrgency || selectedUrgency === 'all' || request.urgence === selectedUrgency;
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && request.status === 'pending') ||
      (activeTab === 'urgent' && ['Critique', 'Haute'].includes(request.urgence)) ||
      (activeTab === 'validation' && request.prediction_id);
    
    return matchesSearch && matchesZone && matchesUrgency && matchesTab;
  });

  const getUrgencyColor = (urgence: string) => {
    switch (urgence) {
      case 'Critique': return 'bg-red-600 text-white';
      case 'Haute': return 'bg-orange-600 text-white';
      case 'Moyenne': return 'bg-yellow-600 text-white';
      case 'Faible': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('HUMINT')) return Users;
    if (type.includes('SIGINT')) return Shield;
    return Target;
  };

  const handleCreateRequest = () => {
    triggerMutation.mutate(newRequest);
  };

  const handleCreateValidationRequest = () => {
    validationMutation.mutate(predictionValidation);
  };

  const handleFulfillRequest = (requestId: string) => {
    fulfillMutation.mutate(requestId);
  };

  const zones = [...new Set(requests.map((r: CollectionRequest) => r.zone))];
  const urgencies = ['Critique', 'Haute', 'Moyenne', 'Faible'];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Requêtes de Collecte</h1>
          <p className="text-gray-400">Gestion automatisée des requêtes de renseignement</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-blue-400 border-blue-400">
            {requests.length} Requêtes Actives
          </Badge>
          <Dialog open={isValidationDialogOpen} onOpenChange={setIsValidationDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white border-green-500 hover:border-green-400 transition-all duration-200 font-medium shadow-lg">
                <Target className="w-4 h-4 mr-2" />
                Valider Prédiction
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Générer Requête de Validation de Prédiction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prediction_id" className="text-gray-300">ID Prédiction</Label>
                  <Input
                    id="prediction_id"
                    value={predictionValidation.prediction_id}
                    onChange={(e) => setPredictionValidation(prev => ({ ...prev, prediction_id: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="ex: pred_001"
                  />
                </div>
                
                <div>
                  <Label htmlFor="hypothesis" className="text-gray-300">Hypothèse à Valider</Label>
                  <Textarea
                    id="hypothesis"
                    value={predictionValidation.hypothesis}
                    onChange={(e) => setPredictionValidation(prev => ({ ...prev, hypothesis: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="ex: Augmentation de l'activité terroriste prévue"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="pred_zone" className="text-gray-300">Zone</Label>
                  <Input
                    id="pred_zone"
                    value={predictionValidation.zone}
                    onChange={(e) => setPredictionValidation(prev => ({ ...prev, zone: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="ex: Gao, Tombouctou, Kidal..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="pred_threat_type" className="text-gray-300">Type de Menace</Label>
                  <Select 
                    value={predictionValidation.threat_type} 
                    onValueChange={(value) => setPredictionValidation(prev => ({ ...prev, threat_type: value }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="terrorisme">Terrorisme</SelectItem>
                      <SelectItem value="cyber">Cyber</SelectItem>
                      <SelectItem value="groupe_arme">Groupe Armé</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="pred_confidence" className="text-gray-300">Confiance Prédiction ({(predictionValidation.confidence * 100).toFixed(0)}%)</Label>
                  <Input
                    id="pred_confidence"
                    type="range"
                    min="0.4"
                    max="1"
                    step="0.05"
                    value={predictionValidation.confidence}
                    onChange={(e) => setPredictionValidation(prev => ({ ...prev, confidence: parseFloat(e.target.value) }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsValidationDialogOpen(false)}
                    className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-200 font-medium"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateValidationRequest}
                    disabled={validationMutation.isPending}
                    className="bg-green-600 hover:bg-green-700 text-white border-green-500 hover:border-green-400 transition-all duration-200 font-medium shadow-lg"
                  >
                    {validationMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Créer Requête
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400 transition-all duration-200 font-medium shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Déclencher Requête
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Déclencher une Requête de Collecte</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type" className="text-gray-300">Type de Déclenchement</Label>
                  <Select value={newRequest.type} onValueChange={(value) => setNewRequest(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="information_gap">Manque d'Information</SelectItem>
                      <SelectItem value="scenario_uncertain">Scénario Incertain</SelectItem>
                      <SelectItem value="prescription_incomplete">Prescription Incomplète</SelectItem>
                      <SelectItem value="threat_validation">Validation de Menace</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="zone" className="text-gray-300">Zone</Label>
                  <Input
                    id="zone"
                    value={newRequest.zone}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, zone: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="ex: Gao, Tombouctou, Kidal..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="missing_info" className="text-gray-300">Information Manquante</Label>
                  <Input
                    id="missing_info"
                    value={newRequest.missing_info}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, missing_info: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="ex: mouvements de groupes armés"
                  />
                </div>
                
                <div>
                  <Label htmlFor="threat_type" className="text-gray-300">Type de Menace</Label>
                  <Input
                    id="threat_type"
                    value={newRequest.threat_type}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, threat_type: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="ex: groupe armé, terrorisme, cyber"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confidence" className="text-gray-300">Confiance ({(newRequest.confidence * 100).toFixed(0)}%)</Label>
                  <Input
                    id="confidence"
                    type="range"
                    min="0.4"
                    max="1"
                    step="0.1"
                    value={newRequest.confidence}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, confidence: parseFloat(e.target.value) }))}
                    className="bg-slate-700 border-slate-600"
                  />
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
                    onClick={handleCreateRequest}
                    disabled={triggerMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400 transition-all duration-200 font-medium shadow-lg"
                  >
                    {triggerMutation.isPending ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Déclencher
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher dans les requêtes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="text-gray-400 w-4 h-4" />
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white min-w-[120px]">
                  <SelectValue placeholder="Zone" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Toutes les zones</SelectItem>
                  {zones.map(zone => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedUrgency} onValueChange={setSelectedUrgency}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white min-w-[120px]">
                  <SelectValue placeholder="Urgence" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Toutes</SelectItem>
                  {urgencies.map(urgency => (
                    <SelectItem key={urgency} value={urgency}>{urgency}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onglets */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="all">Toutes ({requests.length})</TabsTrigger>
          <TabsTrigger value="active">Actives ({requests.filter((r: CollectionRequest) => r.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="urgent">Urgentes ({requests.filter((r: CollectionRequest) => ['Critique', 'Haute'].includes(r.urgence)).length})</TabsTrigger>
          <TabsTrigger value="validation">Validations ({requests.filter((r: CollectionRequest) => r.prediction_id).length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-slate-800 border-slate-700 animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-700 rounded w-3/4 mb-4" />
                    <div className="h-6 bg-slate-700 rounded w-1/4 mb-2" />
                    <div className="h-3 bg-slate-700 rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-12 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucune requête trouvée</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm || selectedZone || selectedUrgency ? 
                    'Aucune requête ne correspond aux critères de recherche' : 
                    'Aucune requête de collecte active'
                  }
                </p>
                <Button
                  onClick={() => setIsExampleDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-500 hover:border-blue-400 transition-all duration-200 font-medium shadow-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Voir les Exemples
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request: CollectionRequest) => {
                const TypeIcon = getTypeIcon(request.type_requete);
                
                return (
                  <Card key={request.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <TypeIcon className="w-5 h-5 text-blue-400" />
                            <Badge className={`${getUrgencyColor(request.urgence)} text-xs`}>
                              {request.urgence}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {request.type_requete}
                            </Badge>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-white mb-2">{request.objectif}</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400 mb-4">
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-4 h-4" />
                              <span>Zone: {request.zone}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>Date: {request.date}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <AlertTriangle className="w-4 h-4" />
                              <span>Origine: {request.origine}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>Expire: {new Date(request.expires_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          {/* Section spécifique aux requêtes de validation de prédiction */}
                          {request.prediction_id && (
                            <div className="bg-slate-700 rounded-lg p-4 mb-4 border-l-4 border-green-500">
                              <div className="flex items-center space-x-2 mb-2">
                                <Target className="w-4 h-4 text-green-400" />
                                <h4 className="font-semibold text-green-400">Validation de Prédiction</h4>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-300">ID Prédiction:</span>
                                  <span className="text-white font-mono">{request.prediction_id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-300">Confiance:</span>
                                  <span className="text-white">{(request.prediction_confidence * 100).toFixed(0)}%</span>
                                </div>
                                <div className="mt-2">
                                  <p className="text-gray-300 mb-1">Hypothèse:</p>
                                  <p className="text-white text-sm italic">{request.prediction_hypothesis}</p>
                                </div>
                                {request.validation_result && (
                                  <div className="mt-3 pt-3 border-t border-slate-600">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-gray-300">Résultat:</span>
                                      <Badge className={request.validation_result === 'confirm' ? 'bg-green-600' : 
                                                      request.validation_result === 'refute' ? 'bg-red-600' : 'bg-yellow-600'}>
                                        {request.validation_result === 'confirm' ? 'Confirmé' : 
                                         request.validation_result === 'refute' ? 'Réfuté' : 'Inconcluant'}
                                      </Badge>
                                    </div>
                                    {request.collected_evidence && (
                                      <div>
                                        <p className="text-gray-300 mb-1">Preuves collectées:</p>
                                        <p className="text-white text-sm bg-slate-800 p-2 rounded border-l-2 border-blue-400">
                                          {request.collected_evidence}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => handleFulfillRequest(request.id)}
                              disabled={fulfillMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white border-green-500 hover:border-green-400 transition-all duration-200 font-medium"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Marquer Satisfaite
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog des exemples */}
      <Dialog open={isExampleDialogOpen} onOpenChange={setIsExampleDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Exemples de Requêtes de Collecte</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {examples.map((example, index) => (
              <Card key={index} className="bg-slate-700 border-slate-600">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge className={`${getUrgencyColor(example.urgence)} text-xs`}>
                        {example.urgence}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {example.type_requête}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-white">{example.objectif}</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p><strong>Zone:</strong> {example.zone}</p>
                      <p><strong>Origine:</strong> {example.origine}</p>
                      <p><strong>Date:</strong> {example.date}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}