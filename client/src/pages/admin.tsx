import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Settings, Database, Brain, Shield, Bell, Save, TestTube, RefreshCw } from "lucide-react";

export default function Admin() {
  const [llmProvider, setLlmProvider] = useState("chatgpt");
  const [llmConfig, setLlmConfig] = useState({
    openai_api_key: "",
    openai_model: "gpt-4o",
    ollama_url: "http://localhost:11434",
    ollama_model: "llama3.1:8b",
    openrouter_api_key: "",
    openrouter_model: "anthropic/claude-3-sonnet"
  });
  const [systemConfig, setSystemConfig] = useState({
    threat_threshold: 0.7,
    alert_enabled: true,
    data_retention_days: 90,
    max_concurrent_ingestion: 10,
    response_timeout: 30,
    false_positive_threshold: 0.08
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();

  const handleLlmConfigChange = (key: string, value: string) => {
    setLlmConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSystemConfigChange = (key: string, value: string | number | boolean) => {
    setSystemConfig(prev => ({ ...prev, [key]: value }));
  };

  const testLlmConnection = async () => {
    setIsTestingConnection(true);
    try {
      // Test connection based on provider
      const response = await fetch('/api/admin/test-llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: llmProvider,
          config: llmConfig
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Connexion réussie",
          description: `Connexion au LLM ${llmProvider} établie avec succès`,
        });
      } else {
        toast({
          title: "Échec de la connexion",
          description: result.error || "Impossible de se connecter au LLM",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors du test de connexion",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          llm_provider: llmProvider,
          llm_config: llmConfig,
          system_config: systemConfig
        })
      });

      if (response.ok) {
        toast({
          title: "Configuration sauvegardée",
          description: "Les paramètres ont été sauvegardés avec succès",
        });
      } else {
        throw new Error('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde de la configuration",
        variant: "destructive",
      });
    }
  };

  const getLlmProviderInfo = () => {
    switch (llmProvider) {
      case 'chatgpt':
        return {
          name: 'ChatGPT (OpenAI)',
          status: 'Recommandé',
          color: 'bg-green-500 bg-opacity-20 text-green-400 border-green-500'
        };
      case 'ollama':
        return {
          name: 'Ollama (Local)',
          status: 'Auto-hébergé',
          color: 'bg-blue-500 bg-opacity-20 text-blue-400 border-blue-500'
        };
      case 'openrouter':
        return {
          name: 'OpenRouter',
          status: 'Multi-modèles',
          color: 'bg-purple-500 bg-opacity-20 text-purple-400 border-purple-500'
        };
      default:
        return {
          name: 'Non configuré',
          status: 'Inactif',
          color: 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500'
        };
    }
  };

  const providerInfo = getLlmProviderInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Administration</h1>
          <p className="text-gray-400">Configuration et paramétrage du système d'analyse d'intelligence</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={providerInfo.color}>
            {providerInfo.name} - {providerInfo.status}
          </Badge>
          <Button onClick={saveConfiguration} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
        </div>
      </div>

      <Tabs defaultValue="llm" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="llm">
            <Brain className="w-4 h-4 mr-2" />
            LLM
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="w-4 h-4 mr-2" />
            Système
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Sécurité
          </TabsTrigger>
          <TabsTrigger value="database">
            <Database className="w-4 h-4 mr-2" />
            Base de données
          </TabsTrigger>
        </TabsList>

        <TabsContent value="llm" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Brain className="w-5 h-5 mr-2" />
                Configuration du LLM
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className={`cursor-pointer transition-all ${llmProvider === 'chatgpt' ? 'ring-2 ring-blue-500 bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'} border-slate-700`}
                  onClick={() => setLlmProvider('chatgpt')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">ChatGPT</h3>
                        <p className="text-sm text-gray-400">OpenAI (Recommandé)</p>
                      </div>
                      <Badge className="bg-green-500 bg-opacity-20 text-green-400">Défaut</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${llmProvider === 'ollama' ? 'ring-2 ring-blue-500 bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'} border-slate-700`}
                  onClick={() => setLlmProvider('ollama')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">Ollama</h3>
                        <p className="text-sm text-gray-400">Local/Auto-hébergé</p>
                      </div>
                      <Badge className="bg-blue-500 bg-opacity-20 text-blue-400">Local</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all ${llmProvider === 'openrouter' ? 'ring-2 ring-blue-500 bg-slate-700' : 'bg-slate-800 hover:bg-slate-700'} border-slate-700`}
                  onClick={() => setLlmProvider('openrouter')}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-white">OpenRouter</h3>
                        <p className="text-sm text-gray-400">Multi-modèles</p>
                      </div>
                      <Badge className="bg-purple-500 bg-opacity-20 text-purple-400">API</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {llmProvider === 'chatgpt' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="openai_api_key" className="text-gray-300">
                      Clé API OpenAI
                    </Label>
                    <Input
                      id="openai_api_key"
                      type="password"
                      value={llmConfig.openai_api_key}
                      onChange={(e) => handleLlmConfigChange('openai_api_key', e.target.value)}
                      placeholder="sk-..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="openai_model" className="text-gray-300">
                      Modèle OpenAI
                    </Label>
                    <Select value={llmConfig.openai_model} onValueChange={(value) => handleLlmConfigChange('openai_model', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Choisir un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o (Recommandé)</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {llmProvider === 'ollama' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ollama_url" className="text-gray-300">
                      URL Ollama
                    </Label>
                    <Input
                      id="ollama_url"
                      value={llmConfig.ollama_url}
                      onChange={(e) => handleLlmConfigChange('ollama_url', e.target.value)}
                      placeholder="http://localhost:11434"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ollama_model" className="text-gray-300">
                      Modèle Ollama
                    </Label>
                    <Select value={llmConfig.ollama_model} onValueChange={(value) => handleLlmConfigChange('ollama_model', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Choisir un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="llama3.1:8b">Llama 3.1 8B</SelectItem>
                        <SelectItem value="llama3.1:70b">Llama 3.1 70B</SelectItem>
                        <SelectItem value="mistral:7b">Mistral 7B</SelectItem>
                        <SelectItem value="codellama:7b">CodeLlama 7B</SelectItem>
                        <SelectItem value="dolphin-mistral:7b">Dolphin Mistral 7B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {llmProvider === 'openrouter' && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="openrouter_api_key" className="text-gray-300">
                      Clé API OpenRouter
                    </Label>
                    <Input
                      id="openrouter_api_key"
                      type="password"
                      value={llmConfig.openrouter_api_key}
                      onChange={(e) => handleLlmConfigChange('openrouter_api_key', e.target.value)}
                      placeholder="sk-or-..."
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="openrouter_model" className="text-gray-300">
                      Modèle OpenRouter
                    </Label>
                    <Select value={llmConfig.openrouter_model} onValueChange={(value) => handleLlmConfigChange('openrouter_model', value)}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Choisir un modèle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anthropic/claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="anthropic/claude-3-haiku">Claude 3 Haiku</SelectItem>
                        <SelectItem value="openai/gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</SelectItem>
                        <SelectItem value="mistralai/mistral-7b-instruct">Mistral 7B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Button 
                  onClick={testLlmConnection}
                  disabled={isTestingConnection}
                  variant="outline"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700"
                >
                  {isTestingConnection ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  Tester la connexion
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Paramètres du système
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="threat_threshold" className="text-gray-300">
                    Seuil de menace (0-1)
                  </Label>
                  <Input
                    id="threat_threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={systemConfig.threat_threshold}
                    onChange={(e) => handleSystemConfigChange('threat_threshold', parseFloat(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="false_positive_threshold" className="text-gray-300">
                    Seuil de faux positifs (0-1)
                  </Label>
                  <Input
                    id="false_positive_threshold"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={systemConfig.false_positive_threshold}
                    onChange={(e) => handleSystemConfigChange('false_positive_threshold', parseFloat(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="data_retention_days" className="text-gray-300">
                    Rétention des données (jours)
                  </Label>
                  <Input
                    id="data_retention_days"
                    type="number"
                    min="1"
                    value={systemConfig.data_retention_days}
                    onChange={(e) => handleSystemConfigChange('data_retention_days', parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="max_concurrent_ingestion" className="text-gray-300">
                    Ingestion simultanée max
                  </Label>
                  <Input
                    id="max_concurrent_ingestion"
                    type="number"
                    min="1"
                    value={systemConfig.max_concurrent_ingestion}
                    onChange={(e) => handleSystemConfigChange('max_concurrent_ingestion', parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="response_timeout" className="text-gray-300">
                    Timeout de réponse (secondes)
                  </Label>
                  <Input
                    id="response_timeout"
                    type="number"
                    min="1"
                    value={systemConfig.response_timeout}
                    onChange={(e) => handleSystemConfigChange('response_timeout', parseInt(e.target.value))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="alert_enabled"
                    checked={systemConfig.alert_enabled}
                    onCheckedChange={(checked) => handleSystemConfigChange('alert_enabled', checked)}
                  />
                  <Label htmlFor="alert_enabled" className="text-gray-300">
                    Alertes activées
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Sécurité et authentification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-400">
                <Shield className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Configuration de sécurité</h3>
                <p>Paramètres de sécurité et d'authentification à venir</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Base de données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-400">
                <Database className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Configuration base de données</h3>
                <p>Paramètres de base de données à venir</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}