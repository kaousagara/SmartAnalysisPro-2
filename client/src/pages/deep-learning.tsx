import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Brain, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Zap, 
  Settings, 
  Play, 
  Pause,
  BarChart3,
  Target,
  Cpu,
  Database,
  RefreshCw,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

export default function DeepLearning() {
  const [selectedThreatId, setSelectedThreatId] = useState('');
  const [threatText, setThreatText] = useState('');
  const [documents, setDocuments] = useState('');
  const queryClient = useQueryClient();

  // Fetch deep learning system status
  const { data: systemStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/deep-learning/health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch model statistics
  const { data: modelStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/deep-learning/model-stats'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Initialize models mutation
  const initMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/deep-learning/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/deep-learning/health'] });
      queryClient.invalidateQueries({ queryKey: ['/api/deep-learning/model-stats'] });
    },
  });

  // Predict evolution mutation
  const evolutionMutation = useMutation({
    mutationFn: async (threatId: string) => {
      const response = await fetch('/api/deep-learning/predict-evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threat_id: threatId }),
      });
      return response.json();
    },
  });

  // Detect anomalies mutation
  const anomalyMutation = useMutation({
    mutationFn: async (threatData: any) => {
      const response = await fetch('/api/deep-learning/detect-anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threat_data: threatData }),
      });
      return response.json();
    },
  });

  // Classify severity mutation
  const severityMutation = useMutation({
    mutationFn: async (docs: string[]) => {
      const response = await fetch('/api/deep-learning/classify-severity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documents: docs }),
      });
      return response.json();
    },
  });

  // Comprehensive analysis mutation
  const comprehensiveMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/deep-learning/comprehensive-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
  });

  const handlePredictEvolution = () => {
    if (selectedThreatId) {
      evolutionMutation.mutate(selectedThreatId);
    }
  };

  const handleDetectAnomalies = () => {
    if (threatText) {
      const threatData = {
        id: 'test-threat',
        text: threatText,
        score: Math.random(),
        confidence: Math.random(),
        source: { reliability: Math.random() }
      };
      anomalyMutation.mutate(threatData);
    }
  };

  const handleClassifySeverity = () => {
    if (documents) {
      const docArray = documents.split('\n').filter(doc => doc.trim());
      severityMutation.mutate(docArray);
    }
  };

  const handleComprehensiveAnalysis = () => {
    if (threatText) {
      const threatData = {
        id: selectedThreatId || 'comprehensive-test',
        text: threatText,
        score: Math.random(),
        confidence: Math.random(),
        source: { reliability: Math.random() }
      };
      
      const docs = documents ? documents.split('\n').filter(doc => doc.trim()) : [];
      
      comprehensiveMutation.mutate({
        threat_data: threatData,
        threat_id: selectedThreatId || 'comprehensive-test',
        documents: docs
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Brain className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-white">Deep Learning</h1>
            <p className="text-gray-400">Analyse avancée des menaces par intelligence artificielle</p>
          </div>
        </div>
        <Button
          onClick={() => initMutation.mutate()}
          disabled={initMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {initMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Settings className="w-4 h-4 mr-2" />
          )}
          Initialiser les Modèles
        </Button>
      </div>

      {/* System Status */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Activity className="w-5 h-5" />
            <span>État du Système</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                {systemStatus ? getStatusIcon(systemStatus.status) : <Loader2 className="w-4 h-4 animate-spin" />}
                <span className="text-sm text-gray-300">Statut Général</span>
              </div>
              <p className={`text-lg font-semibold ${getStatusColor(systemStatus?.status || 'unknown')}`}>
                {systemStatus?.status || 'Chargement...'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-300">Device</span>
              </div>
              <p className="text-lg font-semibold text-white">
                {systemStatus?.device || 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-300">Modèles Chargés</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={systemStatus?.models_loaded ? "default" : "destructive"}>
                  {systemStatus?.models_loaded ? "Oui" : "Non"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Statistics */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <BarChart3 className="w-5 h-5" />
            <span>Statistiques des Modèles</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <span className="text-sm text-gray-300">LSTM Parameters</span>
                <p className="text-lg font-semibold text-white">
                  {modelStats?.lstm_parameters?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-gray-300">Autoencoder Parameters</span>
                <p className="text-lg font-semibold text-white">
                  {modelStats?.autoencoder_parameters?.toLocaleString() || 'N/A'}
                </p>
              </div>
              <div className="space-y-2">
                <span className="text-sm text-gray-300">Attention Parameters</span>
                <p className="text-lg font-semibold text-white">
                  {modelStats?.attention_parameters?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deep Learning Analysis */}
      <Tabs defaultValue="evolution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="evolution" className="text-gray-300">
            <TrendingUp className="w-4 h-4 mr-2" />
            Évolution
          </TabsTrigger>
          <TabsTrigger value="anomalies" className="text-gray-300">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Anomalies
          </TabsTrigger>
          <TabsTrigger value="severity" className="text-gray-300">
            <Target className="w-4 h-4 mr-2" />
            Sévérité
          </TabsTrigger>
          <TabsTrigger value="comprehensive" className="text-gray-300">
            <Brain className="w-4 h-4 mr-2" />
            Analyse Complète
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Prédiction d'Évolution (LSTM)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">ID de la Menace</Label>
                <Input
                  value={selectedThreatId}
                  onChange={(e) => setSelectedThreatId(e.target.value)}
                  placeholder="threat_001"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button
                onClick={handlePredictEvolution}
                disabled={!selectedThreatId || evolutionMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {evolutionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Prédire l'Évolution
              </Button>
              
              {evolutionMutation.data && (
                <Alert className="bg-slate-700 border-slate-600">
                  <AlertDescription className="text-white">
                    <div className="space-y-2">
                      <p><strong>Score Prédit:</strong> {evolutionMutation.data.next_score?.toFixed(3)}</p>
                      <p><strong>Confiance:</strong> {evolutionMutation.data.confidence?.toFixed(3)}</p>
                      <p><strong>Tendance:</strong> {evolutionMutation.data.trend_analysis?.trend}</p>
                      <p><strong>Facteurs de Risque:</strong> {evolutionMutation.data.risk_factors?.join(', ')}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Détection d'Anomalies (Autoencoder)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Texte de la Menace</Label>
                <Textarea
                  value={threatText}
                  onChange={(e) => setThreatText(e.target.value)}
                  placeholder="Entrez le texte de la menace à analyser..."
                  className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                />
              </div>
              <Button
                onClick={handleDetectAnomalies}
                disabled={!threatText || anomalyMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {anomalyMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 mr-2" />
                )}
                Détecter les Anomalies
              </Button>
              
              {anomalyMutation.data && (
                <Alert className={`border-slate-600 ${anomalyMutation.data.is_anomaly ? 'bg-red-900/20' : 'bg-green-900/20'}`}>
                  <AlertDescription className="text-white">
                    <div className="space-y-2">
                      <p><strong>Anomalie Détectée:</strong> 
                        <Badge variant={anomalyMutation.data.is_anomaly ? "destructive" : "default"} className="ml-2">
                          {anomalyMutation.data.is_anomaly ? "Oui" : "Non"}
                        </Badge>
                      </p>
                      <p><strong>Score d'Anomalie:</strong> {anomalyMutation.data.anomaly_score?.toFixed(3)}</p>
                      <p><strong>Erreur de Reconstruction:</strong> {anomalyMutation.data.reconstruction_error?.toFixed(4)}</p>
                      <p><strong>Explication:</strong> {anomalyMutation.data.explanation}</p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="severity" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Classification de Sévérité (Attention)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Documents (un par ligne)</Label>
                <Textarea
                  value={documents}
                  onChange={(e) => setDocuments(e.target.value)}
                  placeholder="Document 1: Incident de sécurité détecté...&#10;Document 2: Activité suspecte observée...&#10;Document 3: Menace critique identifiée..."
                  className="bg-slate-700 border-slate-600 text-white min-h-[120px]"
                />
              </div>
              <Button
                onClick={handleClassifySeverity}
                disabled={!documents || severityMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {severityMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Target className="w-4 h-4 mr-2" />
                )}
                Classifier la Sévérité
              </Button>
              
              {severityMutation.data && (
                <Alert className="bg-slate-700 border-slate-600">
                  <AlertDescription className="text-white">
                    <div className="space-y-2">
                      <p><strong>Classe Prédite:</strong> 
                        <Badge variant="default" className="ml-2">
                          {severityMutation.data.predicted_class?.toUpperCase()}
                        </Badge>
                      </p>
                      <p><strong>Confiance:</strong> {severityMutation.data.confidence?.toFixed(3)}</p>
                      <div className="space-y-1">
                        <p><strong>Probabilités:</strong></p>
                        {severityMutation.data.probabilities && Object.entries(severityMutation.data.probabilities).map(([key, value]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <span className="text-sm w-16">{key}:</span>
                            <Progress value={(value as number) * 100} className="flex-1" />
                            <span className="text-sm w-12">{((value as number) * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comprehensive" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Analyse Complète</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">ID de la Menace</Label>
                  <Input
                    value={selectedThreatId}
                    onChange={(e) => setSelectedThreatId(e.target.value)}
                    placeholder="threat_comprehensive"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Texte de la Menace</Label>
                  <Textarea
                    value={threatText}
                    onChange={(e) => setThreatText(e.target.value)}
                    placeholder="Texte de la menace..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Documents Associés</Label>
                <Textarea
                  value={documents}
                  onChange={(e) => setDocuments(e.target.value)}
                  placeholder="Documents associés (un par ligne)..."
                  className="bg-slate-700 border-slate-600 text-white min-h-[80px]"
                />
              </div>
              <Button
                onClick={handleComprehensiveAnalysis}
                disabled={!threatText || comprehensiveMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {comprehensiveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                Analyse Complète
              </Button>
              
              {comprehensiveMutation.data && (
                <div className="space-y-4">
                  {comprehensiveMutation.data.evolution_prediction && (
                    <Alert className="bg-blue-900/20 border-blue-600">
                      <AlertDescription className="text-white">
                        <p className="font-semibold mb-2">Prédiction d'Évolution:</p>
                        <p>Score: {comprehensiveMutation.data.evolution_prediction.next_score?.toFixed(3)}</p>
                        <p>Confiance: {comprehensiveMutation.data.evolution_prediction.confidence?.toFixed(3)}</p>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {comprehensiveMutation.data.anomaly_detection && (
                    <Alert className={`border-slate-600 ${comprehensiveMutation.data.anomaly_detection.is_anomaly ? 'bg-red-900/20' : 'bg-green-900/20'}`}>
                      <AlertDescription className="text-white">
                        <p className="font-semibold mb-2">Détection d'Anomalies:</p>
                        <p>Anomalie: {comprehensiveMutation.data.anomaly_detection.is_anomaly ? 'Oui' : 'Non'}</p>
                        <p>Score: {comprehensiveMutation.data.anomaly_detection.anomaly_score?.toFixed(3)}</p>
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {comprehensiveMutation.data.severity_classification && (
                    <Alert className="bg-purple-900/20 border-purple-600">
                      <AlertDescription className="text-white">
                        <p className="font-semibold mb-2">Classification de Sévérité:</p>
                        <p>Classe: {comprehensiveMutation.data.severity_classification.predicted_class?.toUpperCase()}</p>
                        <p>Confiance: {comprehensiveMutation.data.severity_classification.confidence?.toFixed(3)}</p>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}