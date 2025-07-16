import { useState } from 'react';
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
    exportFormat: 'json'
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    
    try {
      // TODO: Implement API call to save settings
      console.log('Saving settings:', settings);
      
      // Simulate API call
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