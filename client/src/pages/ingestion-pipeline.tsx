import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Brain, 
  Database, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Target,
  BarChart3,
  Cpu,
  Network
} from 'lucide-react';

interface PipelineStatus {
  sources: Array<{
    name: string;
    type: string;
    status: string;
    last_updated: string;
    throughput: string;
    queue_size?: number;
    dl_enhanced: boolean;
  }>;
  deep_learning: {
    models_loaded: boolean;
    simulation_mode: boolean;
    processing_enabled: boolean;
    average_confidence: number;
    anomalies_detected: number;
    severity_classifications: number;
  };
  pipeline_metrics: {
    total_processed_today: number;
    deep_learning_enhanced: number;
    anomalies_flagged: number;
    critical_threats_detected: number;
    processing_speed: string;
    queue_health: string;
  };
}

interface PipelineTestResult {
  scenario: string;
  status: string;
  ingestion_complete: boolean;
  deep_learning_analysis: {
    anomaly_detected: boolean;
    anomaly_score: number;
    predicted_severity: string;
    confidence: number;
  };
  quality_indicators: {
    completeness: number;
    consistency: number;
    anomaly_risk: number;
    overall_score: number;
  };
  processing_time: string;
  error?: string;
}

export default function IngestionPipeline() {
  const [activeTest, setActiveTest] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Récupérer le statut du pipeline
  const { data: pipelineStatus, isLoading: statusLoading } = useQuery<PipelineStatus>({
    queryKey: ['/api/ingestion/pipeline-status'],
    refetchInterval: 30000, // Refresh toutes les 30 secondes
  });

  // Mutation pour tester le pipeline complet
  const testPipelineMutation = useMutation({
    mutationFn: () => fetch('/api/ingestion/test-pipeline', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingestion/pipeline-status'] });
    }
  });

  // Mutation pour tester l'ingestion avancée
  const testEnhancedMutation = useMutation({
    mutationFn: () => fetch('/api/ingestion/enhanced-test', { method: 'POST' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ingestion/pipeline-status'] });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'operational':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'degraded':
        return 'bg-orange-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Pipeline d'Ingestion Deep Learning</h1>
          <p className="text-gray-400">Surveillance et test du pipeline d'ingestion intégré avec l'analyse deep learning</p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
            <TabsTrigger value="sources">Sources de données</TabsTrigger>
            <TabsTrigger value="deep-learning">Deep Learning</TabsTrigger>
            <TabsTrigger value="testing">Tests Pipeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Traité aujourd'hui</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pipelineStatus?.pipeline_metrics?.total_processed_today || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    +{pipelineStatus?.pipeline_metrics?.deep_learning_enhanced || 0} avec DL
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Anomalies détectées</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pipelineStatus?.pipeline_metrics?.anomalies_flagged || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {pipelineStatus?.pipeline_metrics?.critical_threats_detected || 0} critiques
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Vitesse de traitement</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pipelineStatus?.pipeline_metrics?.processing_speed || 'N/A'}</div>
                  <p className="text-xs text-muted-foreground">
                    État: {pipelineStatus?.pipeline_metrics?.queue_health || 'unknown'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Confiance moyenne</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {((pipelineStatus?.deep_learning.average_confidence || 0) * 100).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {pipelineStatus?.deep_learning.severity_classifications || 0} classifications
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Statut Deep Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span>Modèles chargés</span>
                    <Badge variant={pipelineStatus?.deep_learning.models_loaded ? "default" : "destructive"}>
                      {pipelineStatus?.deep_learning.models_loaded ? "Actifs" : "Inactifs"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span>Mode simulation</span>
                    <Badge variant={pipelineStatus?.deep_learning.simulation_mode ? "secondary" : "default"}>
                      {pipelineStatus?.deep_learning.simulation_mode ? "Activé" : "Désactivé"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <span>Traitement actif</span>
                    <Badge variant={pipelineStatus?.deep_learning.processing_enabled ? "default" : "destructive"}>
                      {pipelineStatus?.deep_learning.processing_enabled ? "Activé" : "Désactivé"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sources" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Sources de données
                </CardTitle>
                <CardDescription>État des sources d'ingestion avec support Deep Learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pipelineStatus?.sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(source.status)}`} />
                        <div>
                          <h4 className="font-medium">{source.name}</h4>
                          <p className="text-sm text-gray-400">{source.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{source.throughput}</div>
                        <div className="text-xs text-gray-400">{source.last_updated}</div>
                        {source.queue_size && (
                          <div className="text-xs text-gray-500">Queue: {source.queue_size}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={source.dl_enhanced ? "default" : "secondary"}>
                          {source.dl_enhanced ? "DL Enhanced" : "Standard"}
                        </Badge>
                        <Badge variant={source.status === 'operational' ? "default" : "destructive"}>
                          {source.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deep-learning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Métriques Deep Learning
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Confiance moyenne</span>
                        <span className="text-sm font-medium">
                          {((pipelineStatus?.deep_learning.average_confidence || 0) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={(pipelineStatus?.deep_learning.average_confidence || 0) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Anomalies détectées</span>
                        <span className="text-sm font-medium">{pipelineStatus?.deep_learning.anomalies_detected || 0}</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-red-500 transition-all duration-300"
                          style={{ width: `${Math.min((pipelineStatus?.deep_learning.anomalies_detected || 0) / 100 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Classifications</span>
                        <span className="text-sm font-medium">{pipelineStatus?.deep_learning.severity_classifications || 0}</span>
                      </div>
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 transition-all duration-300"
                          style={{ width: `${Math.min((pipelineStatus?.deep_learning.severity_classifications || 0) / 500 * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <Alert>
                      <Brain className="h-4 w-4" />
                      <AlertDescription>
                        Le système fonctionne en mode simulation avec des modèles PyTorch simulés pour la démonstration.
                        Toutes les analyses sont basées sur des algorithmes de simulation réalistes.
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Test Pipeline Complet
                  </CardTitle>
                  <CardDescription>
                    Teste le pipeline avec plusieurs scénarios de menaces de complexité variable
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => {
                      setActiveTest('complete');
                      testPipelineMutation.mutate();
                    }}
                    disabled={testPipelineMutation.isPending}
                    className="w-full"
                  >
                    {testPipelineMutation.isPending && activeTest === 'complete' ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Test en cours...
                      </div>
                    ) : (
                      'Lancer Test Complet'
                    )}
                  </Button>
                  
                  {testPipelineMutation.data && activeTest === 'complete' && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Pipeline: {testPipelineMutation.data.pipeline_health}</span>
                      </div>
                      <div className="space-y-2">
                        {testPipelineMutation.data.results?.map((result: PipelineTestResult, index: number) => (
                          <div key={index} className="p-3 bg-gray-800 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{result.scenario}</span>
                              <Badge variant={result.status === 'success' ? "default" : "destructive"}>
                                {result.status}
                              </Badge>
                            </div>
                            {result.status === 'success' && (
                              <div className="text-sm text-gray-400 space-y-1">
                                <div>Anomalie: {result.deep_learning_analysis.anomaly_detected ? 'Oui' : 'Non'}</div>
                                <div>Sévérité: {result.deep_learning_analysis.predicted_severity}</div>
                                <div>Confiance: {(result.deep_learning_analysis.confidence * 100).toFixed(1)}%</div>
                                <div>Qualité: {(result.quality_indicators.overall_score * 100).toFixed(1)}%</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Test Ingestion Avancée
                  </CardTitle>
                  <CardDescription>
                    Teste l'ingestion avec analyse deep learning détaillée et métriques complètes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => {
                      setActiveTest('enhanced');
                      testEnhancedMutation.mutate();
                    }}
                    disabled={testEnhancedMutation.isPending}
                    className="w-full"
                  >
                    {testEnhancedMutation.isPending && activeTest === 'enhanced' ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Analyse en cours...
                      </div>
                    ) : (
                      'Lancer Test Avancé'
                    )}
                  </Button>
                  
                  {testEnhancedMutation.data && activeTest === 'enhanced' && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Test: {testEnhancedMutation.data.test_successful ? 'Réussi' : 'Échoué'}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="p-3 bg-gray-800 rounded-lg">
                          <h4 className="font-medium mb-2">Analyse Deep Learning</h4>
                          <div className="text-sm text-gray-400 space-y-1">
                            <div>Anomalie détectée: {testEnhancedMutation.data.analysis?.anomaly_analysis?.is_anomaly ? 'Oui' : 'Non'}</div>
                            <div>Score anomalie: {(testEnhancedMutation.data.analysis?.anomaly_analysis?.anomaly_score * 100 || 0).toFixed(1)}%</div>
                            <div>Niveau prédit: {testEnhancedMutation.data.analysis?.predicted_threat_level}</div>
                          </div>
                        </div>
                        <div className="p-3 bg-gray-800 rounded-lg">
                          <h4 className="font-medium mb-2">Qualité des données</h4>
                          <div className="text-sm text-gray-400 space-y-1">
                            <div>Complétude: {(testEnhancedMutation.data.analysis?.data_quality?.completeness * 100 || 0).toFixed(1)}%</div>
                            <div>Cohérence: {(testEnhancedMutation.data.analysis?.data_quality?.consistency * 100 || 0).toFixed(1)}%</div>
                            <div>Score global: {(testEnhancedMutation.data.analysis?.data_quality?.overall_score * 100 || 0).toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}