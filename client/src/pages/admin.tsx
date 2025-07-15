import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Settings, Database, Brain, Users, Bell, Save, TestTube, RefreshCw, UserPlus, Edit, Trash2, Shield, Activity, Cpu, Zap } from "lucide-react";

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
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    email: '',
    clearance_level: 1,
    password: ''
  });
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false);
  const [isClearingTestData, setIsClearingTestData] = useState(false);
  const [deepLearningConfig, setDeepLearningConfig] = useState({
    enabled: true,
    training_enabled: true,
    auto_retrain: true,
    retrain_interval_hours: 24,
    anomaly_threshold: 0.3,
    prediction_confidence_min: 0.7,
    severity_threshold: 0.8
  });
  const [isRetrainingModels, setIsRetrainingModels] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries for users
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Queries for deep learning
  const { data: deepLearningModels, isLoading: modelsLoading } = useQuery({
    queryKey: ['/api/admin/deep-learning/models'],
    queryFn: async () => {
      const response = await fetch('/api/admin/deep-learning/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      return response.json();
    }
  });

  const { data: deepLearningConfigData, isLoading: configLoading } = useQuery({
    queryKey: ['/api/admin/deep-learning/config'],
    queryFn: async () => {
      const response = await fetch('/api/admin/deep-learning/config');
      if (!response.ok) throw new Error('Failed to fetch config');
      return response.json();
    }
  });

  // Mutations for deep learning
  const updateDeepLearningConfigMutation = useMutation({
    mutationFn: async (config) => {
      return await apiRequest('/api/admin/deep-learning/config', {
        method: 'POST',
        body: config
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deep-learning/config'] });
      toast({
        title: "Configuration mise à jour",
        description: "La configuration deep learning a été mise à jour avec succès"
      });
    }
  });

  const retrainModelsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin/deep-learning/retrain', {
        method: 'POST'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/deep-learning/models'] });
      toast({
        title: "Réentraînement lancé",
        description: "Le réentraînement des modèles a été lancé avec succès"
      });
    }
  });

  // Mutations for user management
  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      return await apiRequest('/api/admin/users', {
        method: 'POST',
        body: userData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsUserDialogOpen(false);
      resetUserForm();
      toast({
        title: "Utilisateur créé",
        description: "L'utilisateur a été créé avec succès"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création de l'utilisateur",
        variant: "destructive"
      });
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }) => {
      return await apiRequest(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: userData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setIsUserDialogOpen(false);
      resetUserForm();
      toast({
        title: "Utilisateur mis à jour",
        description: "L'utilisateur a été mis à jour avec succès"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour de l'utilisateur",
        variant: "destructive"
      });
    }
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId) => {
      return await apiRequest(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la suppression de l'utilisateur",
        variant: "destructive"
      });
    }
  });

  const handleLlmConfigChange = (key: string, value: string) => {
    setLlmConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSystemConfigChange = (key: string, value: string | number | boolean) => {
    setSystemConfig(prev => ({ ...prev, [key]: value }));
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      name: '',
      email: '',
      clearance_level: 1,
      password: ''
    });
    setEditingUser(null);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    resetUserForm();
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      name: user.name,
      email: user.email,
      clearance_level: user.clearance_level,
      password: ''
    });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = () => {
    if (!userForm.username || !userForm.name || !userForm.email) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis",
        variant: "destructive"
      });
      return;
    }

    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        userData: {
          username: userForm.username,
          name: userForm.name,
          email: userForm.email,
          clearance_level: userForm.clearance_level
        }
      });
    } else {
      if (!userForm.password) {
        toast({
          title: "Erreur",
          description: "Le mot de passe est requis pour un nouvel utilisateur",
          variant: "destructive"
        });
        return;
      }
      createUserMutation.mutate(userForm);
    }
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getClearanceLevelBadge = (level) => {
    const colors = {
      1: 'bg-green-500 bg-opacity-20 text-green-400',
      2: 'bg-blue-500 bg-opacity-20 text-blue-400',
      3: 'bg-yellow-500 bg-opacity-20 text-yellow-400',
      4: 'bg-orange-500 bg-opacity-20 text-orange-400',
      5: 'bg-red-500 bg-opacity-20 text-red-400'
    };
    return colors[level] || 'bg-gray-500 bg-opacity-20 text-gray-400';
  };

  const getClearanceLevelName = (level) => {
    const names = {
      1: 'Niveau 1',
      2: 'Niveau 2',
      3: 'Niveau 3',
      4: 'Niveau 4',
      5: 'Niveau 5'
    };
    return names[level] || 'Inconnu';
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

  // Queries for database statistics
  const { data: dbStats, isLoading: dbStatsLoading } = useQuery({
    queryKey: ['/api/admin/database_stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/database_stats');
      if (!response.ok) throw new Error('Failed to fetch database stats');
      return response.json();
    }
  });

  // Mutation for generating test data
  const generateTestDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/generate_test_data');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database_stats'] });
      toast({
        title: "Données de test générées",
        description: data.message || "Les données de test ont été générées avec succès"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la génération des données de test",
        variant: "destructive"
      });
    }
  });

  // Mutation for clearing test data
  const clearTestDataMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/clear_test_data');
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/database_stats'] });
      toast({
        title: "Données de test supprimées",
        description: data.message || "Les données de test ont été supprimées avec succès"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression des données de test",
        variant: "destructive"
      });
    }
  });

  const handleGenerateTestData = () => {
    if (window.confirm('Êtes-vous sûr de vouloir générer des données de test ? Cela ajoutera de nouvelles données à la base.')) {
      generateTestDataMutation.mutate();
    }
  };

  const handleClearTestData = () => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer toutes les données de test ? Cette action est irréversible.')) {
      clearTestDataMutation.mutate();
    }
  };

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
        <TabsList className="grid w-full grid-cols-5 bg-slate-800">
          <TabsTrigger value="llm">
            <Brain className="w-4 h-4 mr-2" />
            LLM
          </TabsTrigger>
          <TabsTrigger value="system">
            <Settings className="w-4 h-4 mr-2" />
            Système
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            Utilisateurs
          </TabsTrigger>
          <TabsTrigger value="deep-learning">
            <Cpu className="w-4 h-4 mr-2" />
            Deep Learning
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

        <TabsContent value="users" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Gestion des utilisateurs
                </div>
                <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Nouvel utilisateur
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="text-center py-12 text-gray-400">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin" />
                  <p>Chargement des utilisateurs...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-gray-300">Nom d'utilisateur</TableHead>
                        <TableHead className="text-gray-300">Nom complet</TableHead>
                        <TableHead className="text-gray-300">Email</TableHead>
                        <TableHead className="text-gray-300">Niveau de clearance</TableHead>
                        <TableHead className="text-gray-300">Créé le</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.users?.map((user) => (
                        <TableRow key={user.id} className="border-slate-700">
                          <TableCell className="text-white font-medium">{user.username}</TableCell>
                          <TableCell className="text-gray-300">{user.name}</TableCell>
                          <TableCell className="text-gray-300">{user.email}</TableCell>
                          <TableCell>
                            <Badge className={getClearanceLevelBadge(user.clearance_level)}>
                              {getClearanceLevelName(user.clearance_level)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(user.created_at).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => handleEditUser(user)}
                                variant="outline"
                                size="sm"
                                className="border-slate-600 text-gray-300 hover:bg-slate-700"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button 
                                onClick={() => handleDeleteUser(user.id)}
                                variant="outline"
                                size="sm"
                                className="border-red-600 text-red-400 hover:bg-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog for creating/editing users */}
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username" className="text-gray-300">
                    Nom d'utilisateur
                  </Label>
                  <Input
                    id="username"
                    value={userForm.username}
                    onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Entrez le nom d'utilisateur"
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-gray-300">
                    Nom complet
                  </Label>
                  <Input
                    id="name"
                    value={userForm.name}
                    onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Entrez le nom complet"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Entrez l'email"
                  />
                </div>
                <div>
                  <Label htmlFor="clearance_level" className="text-gray-300">
                    Niveau de clearance
                  </Label>
                  <Select 
                    value={userForm.clearance_level.toString()} 
                    onValueChange={(value) => setUserForm(prev => ({ ...prev, clearance_level: parseInt(value) }))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue placeholder="Choisir un niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Niveau 1 - Accès de base</SelectItem>
                      <SelectItem value="2">Niveau 2 - Accès étendu</SelectItem>
                      <SelectItem value="3">Niveau 3 - Accès confidentiel</SelectItem>
                      <SelectItem value="4">Niveau 4 - Accès secret</SelectItem>
                      <SelectItem value="5">Niveau 5 - Accès très secret</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!editingUser && (
                  <div>
                    <Label htmlFor="password" className="text-gray-300">
                      Mot de passe
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      placeholder="Entrez le mot de passe"
                    />
                  </div>
                )}
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsUserDialogOpen(false)}
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSaveUser}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={createUserMutation.isPending || updateUserMutation.isPending}
                  >
                    {createUserMutation.isPending || updateUserMutation.isPending ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {editingUser ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="deep-learning" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Cpu className="w-5 h-5 mr-2" />
                Configuration Deep Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* État des modèles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {deepLearningModels?.models ? Object.entries(deepLearningModels.models).map(([key, model]) => (
                  <Card key={key} className="bg-slate-700 border-slate-600">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{model.name}</h3>
                        <Badge className={model.status === 'active' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-yellow-500 bg-opacity-20 text-yellow-400'}>
                          {model.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{model.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Précision: {(model.accuracy * 100).toFixed(1)}%</span>
                        <span className="text-gray-300">{model.type}</span>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <div className="col-span-3 text-center py-8 text-gray-400">
                    <Cpu className="w-8 h-8 mx-auto mb-4" />
                    <p>Chargement des modèles...</p>
                  </div>
                )}
              </div>

              {/* Configuration générale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Configuration générale</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dl-enabled" className="text-gray-300">
                        Deep Learning activé
                      </Label>
                      <Switch
                        id="dl-enabled"
                        checked={deepLearningConfig.enabled}
                        onCheckedChange={(checked) => setDeepLearningConfig(prev => ({ ...prev, enabled: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="training-enabled" className="text-gray-300">
                        Entraînement activé
                      </Label>
                      <Switch
                        id="training-enabled"
                        checked={deepLearningConfig.training_enabled}
                        onCheckedChange={(checked) => setDeepLearningConfig(prev => ({ ...prev, training_enabled: checked }))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-retrain" className="text-gray-300">
                        Réentraînement automatique
                      </Label>
                      <Switch
                        id="auto-retrain"
                        checked={deepLearningConfig.auto_retrain}
                        onCheckedChange={(checked) => setDeepLearningConfig(prev => ({ ...prev, auto_retrain: checked }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="retrain-interval" className="text-gray-300">
                        Intervalle de réentraînement (heures)
                      </Label>
                      <Input
                        id="retrain-interval"
                        type="number"
                        value={deepLearningConfig.retrain_interval_hours}
                        onChange={(e) => setDeepLearningConfig(prev => ({ ...prev, retrain_interval_hours: parseInt(e.target.value) }))}
                        className="bg-slate-600 border-slate-500 text-white"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">Seuils de détection</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="anomaly-threshold" className="text-gray-300">
                        Seuil d'anomalie ({deepLearningConfig.anomaly_threshold})
                      </Label>
                      <Input
                        id="anomaly-threshold"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={deepLearningConfig.anomaly_threshold}
                        onChange={(e) => setDeepLearningConfig(prev => ({ ...prev, anomaly_threshold: parseFloat(e.target.value) }))}
                        className="bg-slate-600 border-slate-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confidence-threshold" className="text-gray-300">
                        Confiance minimale ({deepLearningConfig.prediction_confidence_min})
                      </Label>
                      <Input
                        id="confidence-threshold"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={deepLearningConfig.prediction_confidence_min}
                        onChange={(e) => setDeepLearningConfig(prev => ({ ...prev, prediction_confidence_min: parseFloat(e.target.value) }))}
                        className="bg-slate-600 border-slate-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="severity-threshold" className="text-gray-300">
                        Seuil de sévérité ({deepLearningConfig.severity_threshold})
                      </Label>
                      <Input
                        id="severity-threshold"
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={deepLearningConfig.severity_threshold}
                        onChange={(e) => setDeepLearningConfig(prev => ({ ...prev, severity_threshold: parseFloat(e.target.value) }))}
                        className="bg-slate-600 border-slate-500"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div className="flex space-x-4">
                  <Button 
                    onClick={() => updateDeepLearningConfigMutation.mutate(deepLearningConfig)}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={updateDeepLearningConfigMutation.isPending}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {updateDeepLearningConfigMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder configuration'}
                  </Button>
                  <Button 
                    onClick={() => retrainModelsMutation.mutate()}
                    variant="outline"
                    className="border-slate-600 text-gray-300 hover:bg-slate-700"
                    disabled={retrainModelsMutation.isPending}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {retrainModelsMutation.isPending ? 'Réentraînement...' : 'Réentraîner modèles'}
                  </Button>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">
                    {deepLearningModels?.statistics?.models_loaded ? 'Modèles chargés' : 'Modèles en cours de chargement'}
                  </span>
                </div>
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