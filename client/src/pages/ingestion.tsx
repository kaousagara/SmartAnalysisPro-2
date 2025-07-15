import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Download, 
  Upload, 
  FileText, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Database,
  Play,
  Eye,
  Search
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function Ingestion() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [testResult, setTestResult] = useState<any>(null);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);

  // Récupération du statut d'ingestion
  const { data: ingestionStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/ingestion/status'],
    refetchInterval: 5000 // Actualisation toutes les 5 secondes
  });

  // Mutation pour tester l'ingestion
  const testIngestionMutation = useMutation({
    mutationFn: () => apiRequest('/api/ingestion/test', {
      method: 'POST',
      body: JSON.stringify({ test_scenario: 'comprehensive_ingestion' })
    }),
    onSuccess: (data) => {
      setTestResult(data);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-green-500';
      case 'degraded':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'SECRET':
        return 'bg-red-100 text-red-800';
      case 'CONFIDENTIEL':
        return 'bg-orange-100 text-orange-800';
      case 'NON CLASSIFIÉ':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'LOW':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Mutation pour uploader un fichier
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/ingestion/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erreur réponse:', errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Upload réussi:', data);
      setTestResult(data);
      setUploadProgress(100);
    },
    onError: (error) => {
      console.error('Erreur upload détaillée:', error);
      setUploadProgress(0);
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
      setTestResult(null);
      
      // Simuler la progression pendant l'upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Effectuer l'upload réel
      uploadFileMutation.mutate(file);
    }
  };



  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ingestion de Données</h1>
        <div className="flex items-center space-x-2">
          <Database className="h-5 w-5 text-blue-500" />
          <span className="text-sm text-gray-600">Système d'ingestion</span>
        </div>
      </div>

      <Tabs defaultValue="status" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="status">Statut des Sources</TabsTrigger>
          <TabsTrigger value="test">Test d'Ingestion</TabsTrigger>
          <TabsTrigger value="upload">Upload de Documents</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Sources de Données</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {ingestionStatus?.sources?.map((source: any) => (
                  <div
                    key={source.name}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(source.status)}
                      <div>
                        <h3 className="font-medium">{source.name}</h3>
                        <p className="text-sm text-gray-600">
                          Type: {source.type} | Débit: {source.throughput}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={source.status === 'operational' ? 'default' : 'destructive'}>
                        {source.status}
                      </Badge>
                      {source.queue_size && (
                        <Badge variant="outline">
                          Queue: {source.queue_size}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Test d'Ingestion Réaliste</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => testIngestionMutation.mutate()}
                  disabled={testIngestionMutation.isPending}
                >
                  {testIngestionMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Lancer Test d'Ingestion
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-600">
                  Teste l'ingestion avec des documents SIGINT, HUMINT et OSINT réalistes
                </p>
              </div>

              {testResult && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      {testResult.message}
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Documents Traités</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{testResult.statistics?.total_documents}</div>
                        <p className="text-xs text-green-600">
                          {testResult.statistics?.successful_ingestions} succès
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Temps Moyen</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{testResult.statistics?.average_processing_time}</div>
                        <p className="text-xs text-gray-600">
                          Temps de traitement
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Entités Extraites</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{testResult.statistics?.total_entities_extracted}</div>
                        <p className="text-xs text-gray-600">
                          Entités détectées
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Résultats d'Ingestion</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {testResult.ingestion_results?.map((result: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <div>
                                <h4 className="font-medium">{result.document.title}</h4>
                                <p className="text-sm text-gray-600">
                                  {result.document.type} • {result.document.source}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant="outline" 
                                className={`${getClassificationColor(result.document.classification)} text-white`}
                              >
                                {result.document.classification}
                              </Badge>
                              <Badge 
                                variant="outline"
                                className={`${getThreatLevelColor(result.threat_scoring.threat_level)} text-white`}
                              >
                                {result.threat_scoring.threat_level}
                              </Badge>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>{result.document.title}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <h4 className="font-medium mb-2">Métadonnées</h4>
                                        <div className="space-y-1 text-sm">
                                          <p><span className="font-medium">Type:</span> {result.document.type}</p>
                                          <p><span className="font-medium">Source:</span> {result.document.source}</p>
                                          <p><span className="font-medium">Classification:</span> {result.document.classification}</p>
                                          <p><span className="font-medium">Confiance:</span> {(result.document.metadata.confidence * 100).toFixed(1)}%</p>
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-2">Scoring de Menace</h4>
                                        <div className="space-y-1 text-sm">
                                          <p><span className="font-medium">Score Global:</span> {(result.threat_scoring.overall_score * 100).toFixed(1)}%</p>
                                          <p><span className="font-medium">Niveau:</span> {result.threat_scoring.threat_level}</p>
                                          <p><span className="font-medium">Fiabilité Source:</span> {(result.threat_scoring.components.source_reliability * 100).toFixed(1)}%</p>
                                          <p><span className="font-medium">Pertinence:</span> {(result.threat_scoring.components.content_relevance * 100).toFixed(1)}%</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-2">Entités Extraites</h4>
                                      <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                          <p><span className="font-medium">Lieux:</span> {result.entities.locations.join(', ')}</p>
                                          <p><span className="font-medium">Organisations:</span> {result.entities.organizations.join(', ')}</p>
                                        </div>
                                        <div>
                                          <p><span className="font-medium">Véhicules:</span> {result.entities.vehicles.join(', ')}</p>
                                          <p><span className="font-medium">Indicateurs:</span> {result.entities.threat_indicators.join(', ')}</p>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-medium mb-2">Contenu</h4>
                                      <div className="bg-gray-50 p-3 rounded text-sm">
                                        {result.document.type === 'SIGINT' && (
                                          <div className="space-y-1">
                                            <p><span className="font-medium">Fréquence:</span> {result.document.content.frequency}</p>
                                            <p><span className="font-medium">Localisation:</span> {result.document.content.location}</p>
                                            <p><span className="font-medium">Transcript:</span> {result.document.content.transcript}</p>
                                          </div>
                                        )}
                                        {result.document.type === 'HUMINT' && (
                                          <div className="space-y-1">
                                            <p><span className="font-medium">Rapport:</span> {result.document.content.report_text}</p>
                                            <p><span className="font-medium">Localisation:</span> {result.document.content.location}</p>
                                            <p><span className="font-medium">Témoins:</span> {result.document.content.witness_count}</p>
                                          </div>
                                        )}
                                        {result.document.type === 'OSINT' && (
                                          <div className="space-y-1">
                                            <p><span className="font-medium">Plateforme:</span> {result.document.content.platform}</p>
                                            <p><span className="font-medium">Posts analysés:</span> {result.document.content.posts_analyzed}</p>
                                            <p><span className="font-medium">Sentiment:</span> {result.document.content.sentiment_analysis}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    <div>
                                      <h4 className="font-medium mb-2">Enrichissement</h4>
                                      <div className="space-y-1 text-sm">
                                        <p><span className="font-medium">Contexte:</span> {result.enrichment.historical_context}</p>
                                        <p><span className="font-medium">Correspondance:</span> {result.enrichment.pattern_matching}</p>
                                        <p><span className="font-medium">Évaluation:</span> {result.enrichment.risk_assessment}</p>
                                      </div>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommandations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {testResult.recommendations?.map((recommendation: string, index: number) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{recommendation}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upload" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload de Documents</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt,.json"
                  onChange={handleFileUpload}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <FileText className="h-12 w-12 text-gray-400" />
                  <span className="text-lg font-medium">
                    Glisser un fichier ici ou cliquer pour sélectionner
                  </span>
                  <span className="text-sm text-gray-500">
                    PDF, DOC, DOCX, TXT, JSON - Maximum 10MB
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">En cours</Badge>
                  </div>

                  <Progress value={uploadProgress} className="w-full" />

                  {uploadFileMutation.isError && (
                    <Alert className="border-red-500">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Erreur lors du traitement du fichier. Veuillez réessayer.
                      </AlertDescription>
                    </Alert>
                  )}

                  {uploadFileMutation.isSuccess && testResult && (
                    <Alert className="border-green-500">
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        {testResult.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {uploadFileMutation.isSuccess && testResult && testResult.document && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">Résultat de l'Analyse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Informations du Document</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">ID:</span> {testResult.document.id}</p>
                            <p><span className="font-medium">Nom:</span> {testResult.document.filename}</p>
                            <p><span className="font-medium">Taille:</span> {(testResult.document.size / 1024).toFixed(2)} KB</p>
                            <p><span className="font-medium">Type:</span> {testResult.document.type}</p>
                            <p><span className="font-medium">Classification:</span> 
                              <Badge className={`ml-2 ${getClassificationColor(testResult.document.classification)}`}>
                                {testResult.document.classification}
                              </Badge>
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Analyse des Menaces</h4>
                          <div className="space-y-1 text-sm">
                            <p><span className="font-medium">Niveau:</span> 
                              <Badge className={`ml-2 ${getThreatLevelColor(testResult.document.processing.threat_scoring.threat_level)}`}>
                                {testResult.document.processing.threat_scoring.threat_level}
                              </Badge>
                            </p>
                            <p><span className="font-medium">Score:</span> {testResult.document.processing.threat_scoring.score.toFixed(2)}</p>
                            <p><span className="font-medium">Confiance:</span> {testResult.document.processing.threat_scoring.confidence.toFixed(2)}</p>
                            <p><span className="font-medium">Temps:</span> {testResult.processing_time}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Entités Extraites</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <p><span className="font-medium">Lieux:</span> {testResult.document.processing.entities_extracted.locations.join(', ')}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Organisations:</span> {testResult.document.processing.entities_extracted.organizations.join(', ')}</p>
                          </div>
                          <div>
                            <p><span className="font-medium">Personnes:</span> {testResult.document.processing.entities_extracted.persons.join(', ')}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Aperçu du Contenu</h4>
                        <div className="bg-gray-50 p-3 rounded text-sm">
                          <p><span className="font-medium">Mots-clés:</span> {testResult.document.processing.keywords.join(', ')}</p>
                          <p><span className="font-medium">Aperçu:</span> {testResult.document.content.text_preview}</p>
                          <p><span className="font-medium">Nombre de mots:</span> {testResult.document.content.word_count}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Recommandations</h4>
                        <div className="space-y-1">
                          {testResult.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Documents Traités</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +12% depuis hier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taux de Succès</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.2%</div>
                <p className="text-xs text-muted-foreground">
                  +0.5% depuis hier
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Temps Moyen</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3s</div>
                <p className="text-xs text-muted-foreground">
                  -0.2s depuis hier
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Activité Récente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { time: '14:30', document: 'rapport_intelligence_001.pdf', status: 'success', type: 'HUMINT' },
                  { time: '14:25', document: 'sigint_data_batch.json', status: 'success', type: 'SIGINT' },
                  { time: '14:20', document: 'osint_analysis.txt', status: 'processing', type: 'OSINT' },
                  { time: '14:15', document: 'classification_error.doc', status: 'error', type: 'UNKNOWN' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {item.status === 'success' && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {item.status === 'processing' && <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />}
                      {item.status === 'error' && <XCircle className="h-4 w-4 text-red-500" />}
                      <div>
                        <p className="font-medium">{item.document}</p>
                        <p className="text-sm text-gray-600">{item.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{item.type}</Badge>
                      <Badge variant={
                        item.status === 'success' ? 'default' : 
                        item.status === 'processing' ? 'secondary' : 'destructive'
                      }>
                        {item.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}