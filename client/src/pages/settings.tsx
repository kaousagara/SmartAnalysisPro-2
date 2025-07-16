import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, 
  Save, 
  Shield, 
  Bell, 
  Monitor, 
  Palette, 
  Globe, 
  Database,
  Key,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    // Paramètres de profil
    theme: 'dark',
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'DD/MM/YYYY',
    
    // Paramètres de sécurité
    sessionTimeout: 60,
    requireTwoFactor: false,
    allowMultipleSessions: true,
    passwordExpiry: 90,
    
    // Paramètres de notifications
    emailNotifications: true,
    pushNotifications: true,
    securityAlerts: true,
    systemMaintenance: true,
    weeklyDigest: true,
    
    // Paramètres d'interface
    compactMode: false,
    showTutorials: true,
    autoSave: true,
    confirmDeletion: true,
    
    // Paramètres de données
    cacheLifetime: 300,
    autoRefresh: true,
    dataRetention: 365,
    exportFormat: 'json',
    
    // Paramètres LLM
    llmProvider: 'ollama',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3',
    openaiApiKey: '',
    openaiModel: 'gpt-4',
    openrouterApiKey: '',
    openrouterModel: 'openai/gpt-4'
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Charger la configuration LLM au démarrage
  useEffect(() => {
    const loadLLMConfig = async () => {
      try {
        // Charger depuis localStorage
        const savedConfig = localStorage.getItem('llm_config');
        if (savedConfig) {
          const config = JSON.parse(savedConfig);
          setSettings(prev => ({
            ...prev,
            llmProvider: config.provider || 'ollama',
            ollamaUrl: config.ollama?.url || 'http://localhost:11434',
            ollamaModel: config.ollama?.model || 'llama3',
            openaiApiKey: config.openai?.apiKey || '',
            openaiModel: config.openai?.model || 'gpt-4',
            openrouterApiKey: config.openrouter?.apiKey || '',
            openrouterModel: config.openrouter?.model || 'openai/gpt-4'
          }));
        }
        console.log('Configuration LLM chargée');
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration LLM:', error);
      }
    };
    
    loadLLMConfig();
  }, []);

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    
    try {
      // Save LLM configuration to localStorage for now
      const llmConfig = {
        provider: settings.llmProvider,
        ollama: {
          url: settings.ollamaUrl,
          model: settings.ollamaModel
        },
        openai: {
          apiKey: settings.openaiApiKey,
          model: settings.openaiModel
        },
        openrouter: {
          apiKey: settings.openrouterApiKey,
          model: settings.openrouterModel
        }
      };
      
      // Store in localStorage
      localStorage.setItem('llm_config', JSON.stringify(llmConfig));
      
      // TODO: When admin routes are fixed, save to backend
      // const response = await fetch('/api/admin/config', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
      //   },
      //   body: JSON.stringify(llmConfig)
      // });
      
      // Simulate API call for other settings
      console.log('Saving other settings:', settings);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleResetSettings = () => {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres aux valeurs par défaut ?')) {
      // Reset to default values
      setSettings({
        theme: 'dark',
        language: 'fr',
        timezone: 'Europe/Paris',
        dateFormat: 'DD/MM/YYYY',
        sessionTimeout: 60,
        requireTwoFactor: false,
        allowMultipleSessions: true,
        passwordExpiry: 90,
        emailNotifications: true,
        pushNotifications: true,
        securityAlerts: true,
        systemMaintenance: true,
        weeklyDigest: true,
        compactMode: false,
        showTutorials: true,
        autoSave: true,
        confirmDeletion: true,
        cacheLifetime: 300,
        autoRefresh: true,
        dataRetention: 365,
        exportFormat: 'json'
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Paramètres</h1>
          <p className="text-gray-400 mt-1">Configurez votre environnement de travail</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleResetSettings}>
            Réinitialiser
          </Button>
          <Button onClick={handleSaveSettings} disabled={saveStatus === 'saving'}>
            <Save className="w-4 h-4 mr-2" />
            {saveStatus === 'saving' ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </div>
      </div>

      {/* Save Status Alert */}
      {saveStatus === 'success' && (
        <Alert className="bg-green-950 border-green-800">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertDescription className="text-green-300">
            Les paramètres ont été enregistrés avec succès.
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert className="bg-red-950 border-red-800">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer.
          </AlertDescription>
        </Alert>
      )}

      {/* Interface Settings */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Palette className="w-5 h-5 mr-2" />
            Préférences d'Interface
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Thème</Label>
              <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                <SelectTrigger className="bg-dark-elevated border-dark-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-dark-border">
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="light">Clair</SelectItem>
                  <SelectItem value="auto">Automatique</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Langue</Label>
              <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                <SelectTrigger className="bg-dark-elevated border-dark-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-dark-border">
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Fuseau horaire</Label>
              <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                <SelectTrigger className="bg-dark-elevated border-dark-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-dark-border">
                  <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
                  <SelectItem value="America/New_York">America/New_York</SelectItem>
                  <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-gray-300">Format de date</Label>
              <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange('dateFormat', value)}>
                <SelectTrigger className="bg-dark-elevated border-dark-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-dark-border">
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-dark-border" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Mode compact</Label>
                <p className="text-sm text-gray-400">Affichage plus dense des informations</p>
              </div>
              <Switch
                checked={settings.compactMode}
                onCheckedChange={(checked) => handleSettingChange('compactMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Afficher les tutoriels</Label>
                <p className="text-sm text-gray-400">Guides d'aide contextuelle</p>
              </div>
              <Switch
                checked={settings.showTutorials}
                onCheckedChange={(checked) => handleSettingChange('showTutorials', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Sauvegarde automatique</Label>
                <p className="text-sm text-gray-400">Sauvegarde automatique des modifications</p>
              </div>
              <Switch
                checked={settings.autoSave}
                onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Confirmer les suppressions</Label>
                <p className="text-sm text-gray-400">Demander confirmation avant suppression</p>
              </div>
              <Switch
                checked={settings.confirmDeletion}
                onCheckedChange={(checked) => handleSettingChange('confirmDeletion', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Paramètres de Sécurité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Timeout de session (minutes)</Label>
              <Input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                className="bg-dark-elevated border-dark-border text-white"
                min="15"
                max="480"
              />
            </div>
            <div>
              <Label className="text-gray-300">Expiration du mot de passe (jours)</Label>
              <Input
                type="number"
                value={settings.passwordExpiry}
                onChange={(e) => handleSettingChange('passwordExpiry', parseInt(e.target.value))}
                className="bg-dark-elevated border-dark-border text-white"
                min="30"
                max="365"
              />
            </div>
          </div>

          <Separator className="bg-dark-border" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Authentification à deux facteurs requise</Label>
                <p className="text-sm text-gray-400">Forcer l'utilisation de 2FA</p>
              </div>
              <Switch
                checked={settings.requireTwoFactor}
                onCheckedChange={(checked) => handleSettingChange('requireTwoFactor', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Sessions multiples autorisées</Label>
                <p className="text-sm text-gray-400">Permettre plusieurs connexions simultanées</p>
              </div>
              <Switch
                checked={settings.allowMultipleSessions}
                onCheckedChange={(checked) => handleSettingChange('allowMultipleSessions', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Paramètres de Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Notifications par email</Label>
                <p className="text-sm text-gray-400">Recevoir des notifications par email</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Notifications push</Label>
                <p className="text-sm text-gray-400">Notifications en temps réel dans le navigateur</p>
              </div>
              <Switch
                checked={settings.pushNotifications}
                onCheckedChange={(checked) => handleSettingChange('pushNotifications', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Alertes de sécurité</Label>
                <p className="text-sm text-gray-400">Alertes pour les menaces critiques</p>
              </div>
              <Switch
                checked={settings.securityAlerts}
                onCheckedChange={(checked) => handleSettingChange('securityAlerts', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Maintenance système</Label>
                <p className="text-sm text-gray-400">Notifications de maintenance planifiée</p>
              </div>
              <Switch
                checked={settings.systemMaintenance}
                onCheckedChange={(checked) => handleSettingChange('systemMaintenance', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Digest hebdomadaire</Label>
                <p className="text-sm text-gray-400">Résumé des activités de la semaine</p>
              </div>
              <Switch
                checked={settings.weeklyDigest}
                onCheckedChange={(checked) => handleSettingChange('weeklyDigest', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Settings */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Paramètres de Données
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-300">Durée de cache (secondes)</Label>
              <Input
                type="number"
                value={settings.cacheLifetime}
                onChange={(e) => handleSettingChange('cacheLifetime', parseInt(e.target.value))}
                className="bg-dark-elevated border-dark-border text-white"
                min="60"
                max="3600"
              />
            </div>
            <div>
              <Label className="text-gray-300">Rétention des données (jours)</Label>
              <Input
                type="number"
                value={settings.dataRetention}
                onChange={(e) => handleSettingChange('dataRetention', parseInt(e.target.value))}
                className="bg-dark-elevated border-dark-border text-white"
                min="30"
                max="2555"
              />
            </div>
            <div>
              <Label className="text-gray-300">Format d'export</Label>
              <Select value={settings.exportFormat} onValueChange={(value) => handleSettingChange('exportFormat', value)}>
                <SelectTrigger className="bg-dark-elevated border-dark-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-dark-border">
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator className="bg-dark-border" />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-gray-300">Actualisation automatique</Label>
                <p className="text-sm text-gray-400">Actualiser automatiquement les données</p>
              </div>
              <Switch
                checked={settings.autoRefresh}
                onCheckedChange={(checked) => handleSettingChange('autoRefresh', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LLM Configuration */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Configuration IA (LLM)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label className="text-gray-300">Fournisseur LLM</Label>
              <Select value={settings.llmProvider || 'ollama'} onValueChange={(value) => handleSettingChange('llmProvider', value)}>
                <SelectTrigger className="bg-dark-elevated border-dark-border text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dark-surface border-dark-border">
                  <SelectItem value="ollama">Ollama (Local)</SelectItem>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="openrouter">OpenRouter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ollama Configuration */}
            {settings.llmProvider === 'ollama' && (
              <div className="space-y-3 p-4 bg-dark-elevated rounded-lg border border-dark-border">
                <h4 className="text-white font-medium">Configuration Ollama</h4>
                <div>
                  <Label className="text-gray-300">URL du serveur</Label>
                  <Input
                    type="text"
                    value={settings.ollamaUrl || 'http://localhost:11434'}
                    onChange={(e) => handleSettingChange('ollamaUrl', e.target.value)}
                    className="bg-dark-surface border-dark-border text-white"
                    placeholder="http://localhost:11434"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Modèle</Label>
                  <Input
                    type="text"
                    value={settings.ollamaModel || 'llama3'}
                    onChange={(e) => handleSettingChange('ollamaModel', e.target.value)}
                    className="bg-dark-surface border-dark-border text-white"
                    placeholder="llama3"
                  />
                </div>
              </div>
            )}

            {/* OpenAI Configuration */}
            {settings.llmProvider === 'openai' && (
              <div className="space-y-3 p-4 bg-dark-elevated rounded-lg border border-dark-border">
                <h4 className="text-white font-medium">Configuration OpenAI</h4>
                <div>
                  <Label className="text-gray-300">Clé API</Label>
                  <Input
                    type="password"
                    value={settings.openaiApiKey || ''}
                    onChange={(e) => handleSettingChange('openaiApiKey', e.target.value)}
                    className="bg-dark-surface border-dark-border text-white"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Modèle</Label>
                  <Select value={settings.openaiModel || 'gpt-4'} onValueChange={(value) => handleSettingChange('openaiModel', value)}>
                    <SelectTrigger className="bg-dark-surface border-dark-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-elevated border-dark-border">
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* OpenRouter Configuration */}
            {settings.llmProvider === 'openrouter' && (
              <div className="space-y-3 p-4 bg-dark-elevated rounded-lg border border-dark-border">
                <h4 className="text-white font-medium">Configuration OpenRouter</h4>
                <div>
                  <Label className="text-gray-300">Clé API</Label>
                  <Input
                    type="password"
                    value={settings.openrouterApiKey || ''}
                    onChange={(e) => handleSettingChange('openrouterApiKey', e.target.value)}
                    className="bg-dark-surface border-dark-border text-white"
                    placeholder="or-..."
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Modèle</Label>
                  <Input
                    type="text"
                    value={settings.openrouterModel || 'openai/gpt-4'}
                    onChange={(e) => handleSettingChange('openrouterModel', e.target.value)}
                    className="bg-dark-surface border-dark-border text-white"
                    placeholder="openai/gpt-4"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button variant="outline" onClick={async () => {
                const provider = settings.llmProvider || 'ollama';
                const config: any = {};
                
                if (provider === 'ollama') {
                  config.ollama = {
                    base_url: settings.ollamaUrl,
                    model: settings.ollamaModel
                  };
                } else if (provider === 'openai') {
                  config.openai = {
                    api_key: settings.openaiApiKey,
                    model: settings.openaiModel
                  };
                } else if (provider === 'openrouter') {
                  config.openrouter = {
                    api_key: settings.openrouterApiKey,
                    model: settings.openrouterModel
                  };
                }

                try {
                  const response = await fetch('/api/test-llm', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`
                    },
                    body: JSON.stringify({
                      provider,
                      config
                    })
                  });
                  
                  const result = await response.json();
                  if (result.success) {
                    alert(`Connexion ${provider} réussie! ${result.message}`);
                  } else {
                    alert(`Erreur: ${result.error}`);
                  }
                } catch (error) {
                  alert(`Erreur de connexion: ${error}`);
                }
              }}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Tester la connexion
              </Button>
              <Alert className="flex-1 ml-4 bg-blue-950 border-blue-800 py-2">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-300 text-sm">
                  Ollama est le fournisseur par défaut pour l'analyse locale des données.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="bg-dark-surface border-dark-border">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Paramètres Avancés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-yellow-950 border-yellow-800">
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-300">
              Ces paramètres sont destinés aux utilisateurs avancés. Modifiez-les avec précaution.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm">
                <Key className="w-4 h-4 mr-2" />
                Regénérer les clés API
              </Button>
              <Button variant="outline" size="sm">
                <Monitor className="w-4 h-4 mr-2" />
                Vider le cache
              </Button>
            </div>
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm">
                <Database className="w-4 h-4 mr-2" />
                Exporter les données
              </Button>
              <Button variant="destructive" size="sm">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Supprimer le compte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}