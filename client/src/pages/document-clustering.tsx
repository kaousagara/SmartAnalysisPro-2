import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  FileText, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Network,
  Target,
  Zap
} from 'lucide-react';

interface Document {
  id: string;
  content: string;
  source: string;
  type: string;
  created_at: string;
  entities?: Array<{text: string, type: string}>;
  threat_score?: number;
}

interface ClusteringResult {
  clusters: Array<{
    id: string;
    documents: Document[];
    size: number;
    avg_similarity: number;
  }>;
  summary: {
    total_documents: number;
    clusters_found: number;
    avg_cluster_size: number;
  };
  analysis: {
    cluster_themes: Array<{
      cluster_id: string;
      themes: {
        keywords: Array<{word: string, score: number}>;
        confidence: number;
        theme_summary: string;
      };
    }>;
    risk_assessment: Record<string, {
      risk_score: number;
      risk_level: string;
      factors: any;
    }>;
  };
}

export default function DocumentClustering() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [newDocument, setNewDocument] = useState({
    content: '',
    source: '',
    type: 'DOCUMENT'
  });
  const [clusteringResult, setClusteringResult] = useState<ClusteringResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('input');

  const addDocument = () => {
    if (!newDocument.content.trim()) return;
    
    const document: Document = {
      id: `doc_${Date.now()}`,
      content: newDocument.content,
      source: newDocument.source || 'Manual Input',
      type: newDocument.type,
      created_at: new Date().toISOString(),
      entities: [],
      threat_score: Math.random() * 0.5 + 0.2
    };
    
    setDocuments([...documents, document]);
    setNewDocument({ content: '', source: '', type: 'DOCUMENT' });
  };

  const loadSampleDocuments = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clustering/sample-documents', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des échantillons');
      }

      const result = await response.json();
      setDocuments(result.documents);
      setActiveTab('analysis');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const performClustering = async () => {
    if (documents.length < 2) {
      setError('Au moins 2 documents sont requis pour l\'analyse de clustering');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clustering/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        },
        body: JSON.stringify({ documents })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse de clustering');
      }

      const result = await response.json();
      setClusteringResult(result);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const performBatchAnalysis = async () => {
    if (documents.length < 2) {
      setError('Au moins 2 documents sont requis pour l\'analyse en lot');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/clustering/batch-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
        },
        body: JSON.stringify({ documents })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'analyse en lot');
      }

      const result = await response.json();
      setClusteringResult(result);
      setActiveTab('results');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Clustering de Documents</h1>
        <Badge variant="outline" className="text-sm">
          {documents.length} documents
        </Badge>
      </div>

      {error && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="input">
            <FileText className="w-4 h-4 mr-2" />
            Saisie Documents
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <Network className="w-4 h-4 mr-2" />
            Analyse
          </TabsTrigger>
          <TabsTrigger value="results">
            <TrendingUp className="w-4 h-4 mr-2" />
            Résultats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="input" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                Ajouter un Document
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    value={newDocument.source}
                    onChange={(e) => setNewDocument({...newDocument, source: e.target.value})}
                    placeholder="Source du document"
                  />
                </div>
                <div>
                  <Label htmlFor="type">Type</Label>
                  <Input
                    id="type"
                    value={newDocument.type}
                    onChange={(e) => setNewDocument({...newDocument, type: e.target.value})}
                    placeholder="Type de document"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({...newDocument, content: e.target.value})}
                  placeholder="Contenu du document à analyser..."
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={addDocument} className="w-full">
                  Ajouter Document
                </Button>
                <Button 
                  onClick={loadSampleDocuments} 
                  variant="outline" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? 'Chargement...' : 'Charger Échantillons'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documents Ajoutés ({documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{doc.type}</Badge>
                        <Badge variant="secondary">{doc.source}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{doc.content}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Analyse de Clustering
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Documents</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium">Prêt pour analyse</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {documents.length >= 2 ? 'Oui' : 'Non'}
                  </p>
                </div>
              </div>

              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Analyse en cours...</span>
                  </div>
                  <Progress value={50} className="w-full" />
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <Button 
                  onClick={performClustering}
                  disabled={documents.length < 2 || isLoading}
                  className="w-full"
                >
                  <Network className="w-4 h-4 mr-2" />
                  Analyser Clustering Simple
                </Button>
                <Button 
                  onClick={performBatchAnalysis}
                  disabled={documents.length < 2 || isLoading}
                  variant="outline"
                  className="w-full"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Analyse Complète + Prescriptions
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {clusteringResult && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Résumé de l'Analyse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Documents Analysés</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {clusteringResult.summary?.total_documents || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Clusters Trouvés</p>
                      <p className="text-2xl font-bold text-green-600">
                        {clusteringResult.summary?.clusters_found || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Taille Moyenne</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {clusteringResult.summary?.avg_cluster_size?.toFixed(1) || 0}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {clusteringResult.clusters?.map((cluster) => {
                  const riskData = clusteringResult.analysis?.risk_assessment?.[cluster.id];
                  const themeData = clusteringResult.analysis?.cluster_themes?.find(
                    t => t.cluster_id === cluster.id
                  );
                  
                  return (
                    <Card key={cluster.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center">
                            <Users className="w-5 h-5 mr-2" />
                            {cluster.id} ({cluster.size} documents)
                          </CardTitle>
                          {riskData && (
                            <Badge className={`${getRiskColor(riskData.risk_level)} text-white`}>
                              Risque: {riskData.risk_level}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium mb-2">Similarité Moyenne</p>
                            <Progress 
                              value={cluster.avg_similarity * 100} 
                              className="w-full"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              {(cluster.avg_similarity * 100).toFixed(1)}%
                            </p>
                          </div>
                          {riskData && (
                            <div>
                              <p className="text-sm font-medium mb-2">Score de Risque</p>
                              <Progress 
                                value={riskData.risk_score * 100} 
                                className="w-full"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {(riskData.risk_score * 100).toFixed(1)}%
                              </p>
                            </div>
                          )}
                        </div>

                        {themeData && (
                          <div>
                            <p className="text-sm font-medium mb-2">Thème Principal</p>
                            <p className="text-sm text-gray-600 mb-2">
                              {themeData.themes.theme_summary}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {themeData.themes.keywords?.slice(0, 5).map((keyword, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {keyword.word} ({(keyword.score * 100).toFixed(0)}%)
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <p className="text-sm font-medium mb-2">Documents dans ce cluster</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {cluster.documents.map((doc) => (
                              <div key={doc.id} className="p-2 bg-gray-50 rounded text-xs">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {doc.type}
                                  </Badge>
                                  <span className="text-gray-500">{doc.source}</span>
                                </div>
                                <p className="line-clamp-2">{doc.content}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          {!clusteringResult && (
            <Card>
              <CardContent className="py-8 text-center">
                <Network className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-500">
                  Aucun résultat d'analyse disponible. Effectuez une analyse depuis l'onglet "Analyse".
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}