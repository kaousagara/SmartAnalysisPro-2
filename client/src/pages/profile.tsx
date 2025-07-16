import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  User, 
  Shield, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Settings, 
  Save,
  Edit,
  Activity,
  Lock,
  Bell,
  Eye
} from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    location: '',
    bio: '',
    department: '',
    supervisor: '',
    twoFactor: false,
    emailNotifications: true,
    pushNotifications: true,
    securityAlerts: true,
    reportDigest: 'daily'
  });

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const getClearanceColor = (level: number) => {
    if (level >= 5) return 'bg-red-900 text-red-200';
    if (level >= 3) return 'bg-yellow-900 text-yellow-200';
    return 'bg-green-900 text-green-200';
  };

  const getClearanceLabel = (level: number) => {
    if (level >= 5) return 'TOP SECRET';
    if (level >= 3) return 'SECRET';
    return 'CONFIDENTIAL';
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Chargement du profil...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Profil Utilisateur</h1>
          <p className="text-gray-400 mt-1">Gérez votre profil et vos préférences</p>
        </div>
        <Button 
          onClick={() => setIsEditing(!isEditing)}
          variant={isEditing ? "destructive" : "default"}
        >
          {isEditing ? "Annuler" : <><Edit className="w-4 h-4 mr-2" />Modifier</>}
        </Button>
      </div>

      {/* Profile Overview */}
      <Card className="bg-dark-surface border-dark-border">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getUserInitials(user.name || user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-semibold text-white">{user.name || user.username}</h2>
                <Badge className={`${getClearanceColor(user.clearance_level)} border-none`}>
                  <Shield className="w-3 h-3 mr-1" />
                  {getClearanceLabel(user.clearance_level)}
                </Badge>
              </div>
              <p className="text-gray-400 mb-2">@{user.username}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Membre depuis juillet 2025</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Activity className="w-4 h-4" />
                  <span>Actif</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Tabs */}
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-dark-surface border-dark-border">
          <TabsTrigger value="general">Informations Générales</TabsTrigger>
          <TabsTrigger value="security">Sécurité</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="activity">Activité</TabsTrigger>
        </TabsList>

        {/* General Information Tab */}
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <User className="w-5 h-5 mr-2" />
                Informations Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">Nom complet</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={!isEditing}
                    className="bg-dark-elevated border-dark-border text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className="bg-dark-elevated border-dark-border text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-gray-300">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className="bg-dark-elevated border-dark-border text-white"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                <div>
                  <Label htmlFor="location" className="text-gray-300">Localisation</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    className="bg-dark-elevated border-dark-border text-white"
                    placeholder="Paris, France"
                  />
                </div>
                <div>
                  <Label htmlFor="department" className="text-gray-300">Département</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)} disabled={!isEditing}>
                    <SelectTrigger className="bg-dark-elevated border-dark-border text-white">
                      <SelectValue placeholder="Sélectionnez un département" />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      <SelectItem value="intelligence">Intelligence</SelectItem>
                      <SelectItem value="cyber">Cybersécurité</SelectItem>
                      <SelectItem value="analysis">Analyse</SelectItem>
                      <SelectItem value="operations">Opérations</SelectItem>
                      <SelectItem value="admin">Administration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="supervisor" className="text-gray-300">Superviseur</Label>
                  <Input
                    id="supervisor"
                    value={formData.supervisor}
                    onChange={(e) => handleInputChange('supervisor', e.target.value)}
                    disabled={!isEditing}
                    className="bg-dark-elevated border-dark-border text-white"
                    placeholder="Nom du superviseur"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio" className="text-gray-300">Biographie</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  className="bg-dark-elevated border-dark-border text-white"
                  placeholder="Décrivez votre rôle et vos responsabilités..."
                  rows={4}
                />
              </div>
              {isEditing && (
                <div className="flex justify-end space-x-2">
                  <Button onClick={handleSave} className="bg-success hover:bg-success/90">
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Lock className="w-5 h-5 mr-2" />
                Paramètres de Sécurité
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-dark-elevated rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">Authentification à deux facteurs</h3>
                    <p className="text-sm text-gray-400">Sécurisez votre compte avec 2FA</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Configurer
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-dark-elevated rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">Mot de passe</h3>
                    <p className="text-sm text-gray-400">Dernière modification il y a 30 jours</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Modifier
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-dark-elevated rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">Sessions actives</h3>
                    <p className="text-sm text-gray-400">Gérez vos sessions connectées</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Voir tout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Préférences de Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Notifications par email</h3>
                    <p className="text-sm text-gray-400">Recevez des alertes par email</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {formData.emailNotifications ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Notifications push</h3>
                    <p className="text-sm text-gray-400">Notifications en temps réel</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {formData.pushNotifications ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-white">Alertes de sécurité</h3>
                    <p className="text-sm text-gray-400">Alertes critiques uniquement</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {formData.securityAlerts ? 'Activé' : 'Désactivé'}
                  </Button>
                </div>
                <div>
                  <Label htmlFor="reportDigest" className="text-gray-300">Digest des rapports</Label>
                  <Select value={formData.reportDigest} onValueChange={(value) => handleInputChange('reportDigest', value)}>
                    <SelectTrigger className="bg-dark-elevated border-dark-border text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-surface border-dark-border">
                      <SelectItem value="never">Jamais</SelectItem>
                      <SelectItem value="daily">Quotidien</SelectItem>
                      <SelectItem value="weekly">Hebdomadaire</SelectItem>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card className="bg-dark-surface border-dark-border">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Activité Récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-3 bg-dark-elevated rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Connexion réussie</p>
                    <p className="text-gray-400 text-xs">Il y a 2 minutes</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-dark-elevated rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Rapport consulté: Threat Analysis Q2</p>
                    <p className="text-gray-400 text-xs">Il y a 1 heure</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 p-3 bg-dark-elevated rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-white text-sm">Profil mis à jour</p>
                    <p className="text-gray-400 text-xs">Il y a 3 heures</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}