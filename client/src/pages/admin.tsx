import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Brain, Database, Shield, TestTube, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LLMConfig {
  provider: string;
  model: string;
  temperature: number;
  max_tokens: number;
  endpoint?: string;
  api_key_set: boolean;
}

interface SystemConfig {
  threat_threshold: number;
  critical_score_delta: number;
  false_positive_threshold: number;
  latency_threshold: number;
  enable_realtime_processing: boolean;
  enable_auto_alerts: boolean;
  data_retention_days: number;
  max_concurrent_analysis: number;
}

export default function Admin() {
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.3,
    max_tokens: 2000,
    endpoint: 'http://localhost:11434',
    api_key_set: false
  });
  
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    threat_threshold: 0.70,
    critical_score_delta: 0.20,
    false_positive_threshold: 0.08,
    latency_threshold: 400,
    enable_realtime_processing: true,
    enable_auto_alerts: true,
    data_retention_days: 90,
    max_concurrent_analysis: 10
  });
  
  const [apiKey, setApiKey] = useState('');
  const [isTestingLLM, setIsTestingLLM] = useState(false);
  const [isTestingDB, setIsTestingDB] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Charger la configuration actuelle
    loadConfigurations();
  }, []);

  const loadConfigurations = async () => {
    try {
      const [llmResponse, systemResponse] = await Promise.all([
        fetch('/api/admin/llm/config'),
        fetch('/api/admin/system/config')
      ]);
      
      if (llmResponse.ok) {
        const llmData = await llmResponse.json();
        setLlmConfig(llmData);
      }
      
      if (systemResponse.ok) {
        const systemData = await systemResponse.json();
        setSystemConfig(systemData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des configurations:', error);
    }
  };

  const handleSaveLLMConfig = async () => {
    try {
      const configToSave = {
        ...llmConfig,
        api_key: apiKey || undefined
      };
      
      const response = await fetch('/api/admin/llm/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configToSave),
      });
      
      if (response.ok) {
        toast({
          title: "Configuration sauvegardée",
          description: "La configuration LLM a été mise à jour avec succès.",
        });
        loadConfigurations();
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration LLM.",
        variant: "destructive",
      });
    }
  };

  const handleSaveSystemConfig = async () => {
    try {
      const response = await fetch('/api/admin/system/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(systemConfig),
      });
      
      if (response.ok) {
        toast({
          title: "Configuration sauvegardée",
          description: "La configuration système a été mise à jour avec succès.",
        });
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la configuration système.",
        variant: "destructive",
      });
    }
  };

  const handleTestLLM = async () => {
    setIsTestingLLM(true);
    try {
      const response = await fetch('/api/admin/llm/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      setTestResults(result);
      
      if (result.status === 'success') {
        toast({
          title: "Test réussi",
          description: `Connexion au LLM ${result.provider} établie avec succès.`,
        });
      } else {
        toast({
          title: "Test échoué",
          description: `Erreur: ${result.error}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de test",
        description: "Impossible de tester la connexion LLM.",
        variant: "destructive",
      });
    } finally {
      setIsTestingLLM(false);
    }
  };

  const handleTestDatabase = async () => {
    setIsTestingDB(true);
    try {
      const response = await fetch('/api/admin/database/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.status === 'success') {
        toast({
          title: "Test réussi",
          description: result.message,
        });
      } else {
        toast({
          title: "Test échoué",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur de test",
        description: "Impossible de tester la connexion à la base de données.",
        variant: "destructive",
      });
    } finally {
      setIsTestingDB(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Administration</h1>
      </div>

      <Tabs defaultValue="llm" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="llm">Configuration LLM</TabsTrigger>
          <TabsTrigger value="system">Système</TabsTrigger>
          <TabsTrigger value="database">Base de données</TabsTrigger>
        </TabsList>

        <TabsContent value="llm" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5" />
                <span>Configuration du LLM</span>
              </CardTitle>
              <CardDescription>
                Configurez le fournisseur LLM pour l'analyse des menaces
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Fournisseur</Label>
                  <Select 
                    value={llmConfig.provider} 
                    onValueChange={(value) => setLlmConfig({...llmConfig, provider: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un fournisseur" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="openai">OpenAI</SelectItem>
                      <SelectItem value="ollama">Ollama</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">Modèle</Label>
                  <Input
                    id="model"
                    value={llmConfig.model}
                    onChange={(e) => setLlmConfig({...llmConfig, model: e.target.value})}
                    placeholder="gpt-4o"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Température</Label>
                  <Input
                    id="temperature"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={llmConfig.temperature}
                    onChange={(e) => setLlmConfig({...llmConfig, temperature: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_tokens">Tokens max</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={llmConfig.max_tokens}
                    onChange={(e) => setLlmConfig({...llmConfig, max_tokens: parseInt(e.target.value)})}
                  />
                </div>

                {llmConfig.provider === 'ollama' && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="endpoint">Endpoint Ollama</Label>
                    <Input
                      id="endpoint"
                      value={llmConfig.endpoint}
                      onChange={(e) => setLlmConfig({...llmConfig, endpoint: e.target.value})}
                      placeholder="http://localhost:11434"
                    />
                  </div>
                )}

                {(llmConfig.provider === 'openai' || llmConfig.provider === 'openrouter') && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="api_key">Clé API</Label>
                    <Input
                      id="api_key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="Entrez votre clé API"
                    />
                    {llmConfig.api_key_set && (
                      <Badge variant="secondary">Clé API configurée</Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button onClick={handleSaveLLMConfig}>
                  Sauvegarder la configuration
                </Button>
                <Button variant="outline" onClick={handleTestLLM} disabled={isTestingLLM}>
                  {isTestingLLM ? (
                    <>
                      <TestTube className="h-4 w-4 mr-2 animate-spin" />
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Tester la connexion
                    </>
                  )}
                </Button>
              </div>

              {testResults && (
                <Alert>
                  <div className="flex items-center space-x-2">
                    {testResults.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <AlertDescription>
                      {testResults.status === 'success' 
                        ? `Connexion réussie avec ${testResults.provider} (${testResults.model})`
                        : `Erreur: ${testResults.error}`
                      }
                    </AlertDescription>
                  </div>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Configuration système</span>
              </CardTitle>
              <CardDescription>
                Paramètres de sécurité et de performance du système
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="threat_threshold">Seuil de menace</Label>
                  <Input
                    id="threat_threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={systemConfig.threat_threshold}
                    onChange={(e) => setSystemConfig({...systemConfig, threat_threshold: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="critical_score_delta">Delta score critique</Label>
                  <Input
                    id="critical_score_delta"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={systemConfig.critical_score_delta}
                    onChange={(e) => setSystemConfig({...systemConfig, critical_score_delta: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="false_positive_threshold">Seuil faux positifs</Label>
                  <Input
                    id="false_positive_threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={systemConfig.false_positive_threshold}
                    onChange={(e) => setSystemConfig({...systemConfig, false_positive_threshold: parseFloat(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latency_threshold">Seuil de latence (ms)</Label>
                  <Input
                    id="latency_threshold"
                    type="number"
                    value={systemConfig.latency_threshold}
                    onChange={(e) => setSystemConfig({...systemConfig, latency_threshold: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_retention_days">Rétention des données (jours)</Label>
                  <Input
                    id="data_retention_days"
                    type="number"
                    value={systemConfig.data_retention_days}
                    onChange={(e) => setSystemConfig({...systemConfig, data_retention_days: parseInt(e.target.value)})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_concurrent_analysis">Analyses simultanées max</Label>
                  <Input
                    id="max_concurrent_analysis"
                    type="number"
                    value={systemConfig.max_concurrent_analysis}
                    onChange={(e) => setSystemConfig({...systemConfig, max_concurrent_analysis: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <Button onClick={handleSaveSystemConfig}>
                Sauvegarder la configuration système
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>Base de données</span>
              </CardTitle>
              <CardDescription>
                Gestion et test de la connexion à la base de données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Alert>
                  <Database className="h-4 w-4" />
                  <AlertDescription>
                    Base de données PostgreSQL configurée et opérationnelle
                  </AlertDescription>
                </Alert>

                <Button 
                  variant="outline" 
                  onClick={handleTestDatabase} 
                  disabled={isTestingDB}
                >
                  {isTestingDB ? (
                    <>
                      <TestTube className="h-4 w-4 mr-2 animate-spin" />
                      Test en cours...
                    </>
                  ) : (
                    <>
                      <TestTube className="h-4 w-4 mr-2" />
                      Tester la connexion
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}