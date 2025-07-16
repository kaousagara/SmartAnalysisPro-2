import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, FileText, Database, AlertTriangle, GitBranch, Zap } from 'lucide-react';

const ThreatEvaluationDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [newDocument, setNewDocument] = useState({
    name: '',
    content: '',
    type: 'text'
  });
  const [activeTab, setActiveTab] = useState('ingestion');

  const handleDocumentIngestion = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('local_auth_token');
      const response = await fetch('/api/ingestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: 'document',
          document: {
            id: Date.now(),
            name: newDocument.name,
            content: newDocument.content,
            type: newDocument.type,
            threat_score: Math.random() * 0.5 + 0.3 // Score entre 0.3 et 0.8
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ingestion');
      }

      const result = await response.json();
      setEvaluationResult(result);
      
      // Réinitialiser le formulaire
      setNewDocument({ name: '', content: '', type: 'text' });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateDocument = async (documentId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('local_auth_token');
      const response = await fetch(`/api/documents/${documentId}/evaluate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'évaluation');
      }

      const result = await response.json();
      setEvaluationResult(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluateCluster = async (clusterId: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('local_auth_token');
      const response = await fetch(`/api/cluster/${clusterId}/evaluate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'évaluation du cluster');
      }

      const result = await response.json();
      setEvaluationResult(result);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Zap className="h-6 w-6 text-blue-500" />
        <h2 className="text-2xl font-bold">Système Unifié d'Ingestion et Réévaluation</h2>
      </div>

      <Tabs defaultValue="ingestion" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ingestion">
            <Zap className="h-4 w-4 mr-2" />
            Ingestion Unifiée
          </TabsTrigger>
          <TabsTrigger value="document">
            <FileText className="h-4 w-4 mr-2" />
            Évaluation Document
          </TabsTrigger>
          <TabsTrigger value="cluster">
            <GitBranch className="h-4 w-4 mr-2" />
            Évaluation Cluster
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingestion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Ingestion Unifiée avec Réévaluation</span>
              </CardTitle>
              <CardDescription>
                Ingestion automatique qui déclenche clustering + réévaluation complète des menaces, prédictions et prescriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du document</Label>
                <Input
                  id="name"
                  placeholder="Ex: Rapport de sécurité Mali"
                  value={newDocument.name}
                  onChange={(e) => setNewDocument({ ...newDocument, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Contenu du document</Label>
                <Textarea
                  id="content"
                  placeholder="Saisissez le contenu du document..."
                  value={newDocument.content}
                  onChange={(e) => setNewDocument({ ...newDocument, content: e.target.value })}
                  rows={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type de document</Label>
                <Input
                  id="type"
                  placeholder="Ex: rapport, alerte, analyse"
                  value={newDocument.type}
                  onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value })}
                />
              </div>

              <Button
                onClick={handleDocumentIngestion}
                disabled={isLoading || !newDocument.name || !newDocument.content}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Traitement en cours...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Ingestion Unifiée + Réévaluation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="document" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Évaluation de Document Spécifique</span>
              </CardTitle>
              <CardDescription>
                Réévaluez un document existant et tous les documents de son cluster
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => handleEvaluateDocument(1)}
                  disabled={isLoading}
                  variant="outline"
                >
                  Évaluer Document #1
                </Button>
                <Button
                  onClick={() => handleEvaluateDocument(2)}
                  disabled={isLoading}
                  variant="outline"
                >
                  Évaluer Document #2
                </Button>
                <Button
                  onClick={() => handleEvaluateDocument(3)}
                  disabled={isLoading}
                  variant="outline"
                >
                  Évaluer Document #3
                </Button>
                <Button
                  onClick={() => handleEvaluateDocument(4)}
                  disabled={isLoading}
                  variant="outline"
                >
                  Évaluer Document #4
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cluster" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Évaluation de Cluster Complet</span>
              </CardTitle>
              <CardDescription>
                Réévaluez tous les documents d'un cluster spécifique
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Button
                  onClick={() => handleEvaluateCluster(1)}
                  disabled={isLoading}
                  variant="outline"
                >
                  Évaluer Cluster #1
                </Button>
                <Button
                  onClick={() => handleEvaluateCluster(2)}
                  disabled={isLoading}
                  variant="outline"
                >
                  Évaluer Cluster #2
                </Button>
                <Button
                  onClick={() => handleEvaluateCluster(3)}
                  disabled={isLoading}
                  variant="outline"
                >
                  Évaluer Cluster #3
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {evaluationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Résultat de l'Évaluation</CardTitle>
            <CardDescription>
              {evaluationResult.success ? 'Évaluation réussie' : 'Erreur lors de l\'évaluation'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {evaluationResult.success && (
                <>
                  <div className="text-sm text-green-600">
                    ✓ {evaluationResult.message}
                  </div>

                  {evaluationResult.evaluation_result && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-sm">
                          <span className="font-medium">ID Cluster:</span> {evaluationResult.evaluation_result.cluster_id}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Taille Cluster:</span> {evaluationResult.evaluation_result.cluster_size}
                        </div>
                      </div>

                      {/* Menaces */}
                      {evaluationResult.evaluation_result.threats && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Menaces Évaluées</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm">
                              <span className="font-medium">Menaces Mises à Jour:</span> {evaluationResult.evaluation_result.threats.updated_threats?.length || 0}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Nouvelles Menaces:</span> {evaluationResult.evaluation_result.threats.new_threats?.length || 0}
                            </div>
                          </div>

                          {evaluationResult.evaluation_result.threats.updated_threats?.map((threat: any, index: number) => (
                            <div key={index} className="p-2 bg-blue-50 rounded border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Menace #{threat.id}</span>
                                <Badge className={getSeverityColor(threat.severity)}>
                                  {threat.severity}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-600">
                                Score: {threat.old_score?.toFixed(2)} → {threat.new_score?.toFixed(2)}
                                {threat.score_change && (
                                  <span className={threat.score_change > 0 ? 'text-red-600' : 'text-green-600'}>
                                    {' '}({threat.score_change > 0 ? '+' : ''}{threat.score_change.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}

                          {evaluationResult.evaluation_result.threats.new_threats?.map((threat: any, index: number) => (
                            <div key={index} className="p-2 bg-green-50 rounded border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Nouvelle Menace #{threat.id}</span>
                                <Badge className={getSeverityColor(threat.severity)}>
                                  {threat.severity}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-600">
                                Score: {threat.score?.toFixed(2)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Prédictions */}
                      {evaluationResult.evaluation_result.predictions && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Prédictions Évaluées</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm">
                              <span className="font-medium">Prédictions Mises à Jour:</span> {evaluationResult.evaluation_result.predictions.updated_predictions?.length || 0}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Nouvelles Prédictions:</span> {evaluationResult.evaluation_result.predictions.new_predictions?.length || 0}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Prescriptions */}
                      {evaluationResult.evaluation_result.prescriptions && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Prescriptions Évaluées</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="text-sm">
                              <span className="font-medium">Prescriptions Mises à Jour:</span> {evaluationResult.evaluation_result.prescriptions.updated_prescriptions?.length || 0}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">Nouvelles Prescriptions:</span> {evaluationResult.evaluation_result.prescriptions.new_prescriptions?.length || 0}
                            </div>
                          </div>

                          {evaluationResult.evaluation_result.prescriptions.new_prescriptions?.map((prescription: any, index: number) => (
                            <div key={index} className="p-2 bg-yellow-50 rounded border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Prescription #{prescription.id}</span>
                                <Badge className={getPriorityColor(prescription.priority)}>
                                  {prescription.priority}
                                </Badge>
                              </div>
                              <div className="text-xs text-gray-600">
                                Type: {prescription.type}
                              </div>
                              <div className="text-xs text-gray-600">
                                {prescription.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {!evaluationResult.success && (
                <div className="text-sm text-red-600">
                  ✗ {evaluationResult.error || 'Erreur lors de l\'évaluation'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ThreatEvaluationDemo;