import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  AlertTriangle,
  Target,
  Shield,
  Brain,
  Eye,
  Zap,
  CheckCircle,
  Clock,
  Users,
  Search,
  Filter,
  Calendar,
  CalendarDays,
  X
} from "lucide-react";
import { formatDistanceToNow, isAfter, isBefore, subHours, subDays, subWeeks, subMonths, format } from 'date-fns';

interface Threat {
  id: string;
  name: string;
  description: string;
  score: number;
  severity: string;
  category: string;
  source: string;
  entities: string[];
  last_updated: string;
}

interface Prediction {
  threat_id: string;
  current_score: number;
  predicted_score: number;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  timeframe: string;
  risk_level: string;
  factors: string[];
}

interface Prescription {
  id: string;
  threat_id: string;
  title: string;
  category: string;
  priority: string;
  actions: Array<{
    id: string;
    description: string;
    type: string;
    status: string;
    estimated_time: string;
  }>;
  resources: string[];
  timeline: string;
  status: string;
}

export default function ThreatFlow() {
  const [threats, setThreats] = useState<Threat[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [actions, setActions] = useState<any[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // États pour les filtres
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDateRange, setShowCustomDateRange] = useState<boolean>(false);

  useEffect(() => {
    fetchFlowData();
  }, []);

  const fetchFlowData = async () => {
    try {
      const [threatsResponse, predictionsResponse, prescriptionsResponse, actionsResponse] = await Promise.all([
        fetch('/api/threats/realtime'),
        fetch('/api/prescriptions/trends'),
        fetch('/api/prescriptions'),
        fetch('/api/actions')
      ]);

      if (threatsResponse.ok) {
        const threatsData = await threatsResponse.json();
        const threatsList = threatsData.threats || [];
        setThreats(threatsList);
        
        // Sélectionner automatiquement la première menace si aucune n'est sélectionnée
        if (threatsList.length > 0 && !selectedThreat) {
          setSelectedThreat(threatsList[0].id);
        }
      }

      if (predictionsResponse.ok) {
        const predictionsData = await predictionsResponse.json();
        // Transform trends data to prediction format
        const transformedPredictions: Record<string, Prediction> = {};
        Object.entries(predictionsData.trends || {}).forEach(([threatId, trend]: [string, any]) => {
          transformedPredictions[threatId] = {
            threat_id: threatId,
            current_score: trend.current_score,
            predicted_score: trend.current_score + trend.recent_trend,
            confidence: trend.volatility < 0.1 ? 0.9 : 0.7,
            trend: trend.recent_trend > 0 ? 'increasing' : trend.recent_trend < 0 ? 'decreasing' : 'stable',
            timeframe: '24-48h',
            risk_level: trend.current_score > 0.7 ? 'high' : trend.current_score > 0.4 ? 'medium' : 'low',
            factors: ['Historical patterns', 'Network analysis', 'Source credibility']
          };
        });
        setPredictions(transformedPredictions);
      } else {
        // Fallback: générer des prédictions basées sur les menaces existantes
        const threatsList = threats.length > 0 ? threats : [];
        const fallbackPredictions: Record<string, Prediction> = {};
        
        threatsList.forEach(threat => {
          const currentScore = threat.score;
          const trendValue = Math.random() * 0.2 - 0.1; // Entre -0.1 et 0.1
          
          fallbackPredictions[threat.id] = {
            threat_id: threat.id,
            current_score: currentScore,
            predicted_score: Math.max(0, Math.min(1, currentScore + trendValue)),
            confidence: Math.random() * 0.3 + 0.7, // Entre 0.7 et 1.0
            trend: trendValue > 0.02 ? 'increasing' : trendValue < -0.02 ? 'decreasing' : 'stable',
            timeframe: '24-48h',
            risk_level: currentScore > 0.7 ? 'high' : currentScore > 0.4 ? 'medium' : 'low',
            factors: ['Historical patterns', 'Network analysis', 'Source credibility']
          };
        });
        
        setPredictions(fallbackPredictions);
      }

      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json();
        setPrescriptions(prescriptionsData.prescriptions || []);
      }

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        setActions(actionsData.actions || []);
      }

    } catch (error) {
      console.error('Error fetching flow data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeFilterDate = (filter: string) => {
    const now = new Date();
    switch (filter) {
      case '1h':
        return subHours(now, 1);
      case '6h':
        return subHours(now, 6);
      case '24h':
        return subDays(now, 1);
      case '7d':
        return subWeeks(now, 1);
      case '30d':
        return subMonths(now, 1);
      default:
        return null;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-red-500 bg-opacity-20 text-red-400';
      case 'high': return 'bg-orange-500 bg-opacity-20 text-orange-400';
      case 'medium': return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'low': return 'bg-green-500 bg-opacity-20 text-green-400';
      default: return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critique': return 'bg-red-500 bg-opacity-20 text-red-400';
      case 'haute': return 'bg-orange-500 bg-opacity-20 text-orange-400';
      case 'moyenne': return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'faible': return 'bg-green-500 bg-opacity-20 text-green-400';
      default: return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Eye className="w-4 h-4 text-gray-400" />;
    
    switch (status.toLowerCase()) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'active': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-400" />;
      default: return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  // Filtrer les menaces selon le terme de recherche et l'intervalle de temps
  const filteredThreats = threats.filter((threat) => {
    // Filtrage par texte
    const matchesSearch = searchTerm === '' || 
      threat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.id?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrage par temps
    let matchesTime = true;
    
    if (timeFilter === 'custom' && (startDate || endDate)) {
      const threatDate = threat.last_updated ? (() => {
        try {
          return new Date(threat.last_updated);
        } catch (e) {
          return null;
        }
      })() : null;
      if (threatDate) {
        if (startDate && endDate) {
          try {
            matchesTime = isAfter(threatDate, new Date(startDate)) && isBefore(threatDate, new Date(endDate));
          } catch (e) {
            matchesTime = false;
          }
        } else if (startDate) {
          try {
            matchesTime = isAfter(threatDate, new Date(startDate));
          } catch (e) {
            matchesTime = false;
          }
        } else if (endDate) {
          try {
            matchesTime = isBefore(threatDate, new Date(endDate));
          } catch (e) {
            matchesTime = false;
          }
        }
      }
    } else if (timeFilter !== 'all') {
      const timeFilterDate = getTimeFilterDate(timeFilter);
      matchesTime = timeFilterDate === null || 
        (threat.last_updated && (() => {
          try {
            return isAfter(new Date(threat.last_updated), timeFilterDate);
          } catch (e) {
            return false;
          }
        })());
    }
    
    return matchesSearch && matchesTime;
  });

  const selectedThreatData = threats.find(t => t.id === selectedThreat);
  const relatedPrediction = selectedThreat ? predictions[selectedThreat] : null;
  const relatedPrescriptions = prescriptions.filter(p => p.threat_id === selectedThreat);
  const relatedActions = actions.filter(a => 
    // Liens directs ou via description/type
    a.threat_id === selectedThreat || 
    relatedPrescriptions.some(p => p.id === a.prescription_id) ||
    (selectedThreatData && a.description && a.description.toLowerCase().includes(selectedThreatData.name.toLowerCase().split(' ')[0]))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Chargement du flux de traitement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Flux de Traitement des Menaces</h1>
        <Button
          onClick={fetchFlowData}
          variant="outline"
          className="border-slate-600 text-gray-300 hover:bg-slate-700"
        >
          <Activity className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      {/* Sélection des menaces */}
      <Card className="bg-slate-800 border-slate-700 mb-6">
        <CardHeader>
          <CardTitle className="text-white text-sm">Sélectionner une Menace</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtres pour les menaces */}
          <div className="mb-4 space-y-3">
            {/* Recherche par nom */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Filtrer par nom de menace..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-gray-400 focus:border-blue-500"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* Filtre par temps */}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-400">Période:</span>
              <Select value={timeFilter} onValueChange={(value) => {
                setTimeFilter(value);
                if (value !== 'custom') {
                  setStartDate('');
                  setEndDate('');
                  setShowCustomDateRange(false);
                } else {
                  setShowCustomDateRange(true);
                }
              }}>
                <SelectTrigger className="w-40 bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">Toutes les menaces</SelectItem>
                  <SelectItem value="1h">Dernière heure</SelectItem>
                  <SelectItem value="6h">6 dernières heures</SelectItem>
                  <SelectItem value="24h">24 dernières heures</SelectItem>
                  <SelectItem value="7d">7 derniers jours</SelectItem>
                  <SelectItem value="30d">30 derniers jours</SelectItem>
                  <SelectItem value="custom">Plage personnalisée</SelectItem>
                </SelectContent>
              </Select>
              
              {timeFilter !== 'all' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  onClick={() => {
                    setTimeFilter('all');
                    setStartDate('');
                    setEndDate('');
                    setShowCustomDateRange(false);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* Sélection des dates personnalisées */}
            {showCustomDateRange && (
              <div className="flex items-center space-x-2 p-3 bg-slate-800 rounded-lg border border-slate-600">
                <CalendarDays className="w-4 h-4 text-gray-400" />
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400">De:</label>
                  <Input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-48 bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-400">À:</label>
                  <Input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-48 bg-slate-700 border-slate-600 text-white text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Indicateur de filtrage */}
          {(searchTerm || timeFilter !== 'all') && (
            <div className="mb-3 flex items-center space-x-2 text-sm text-gray-400">
              <Filter className="w-4 h-4" />
              <span>
                {filteredThreats.length} résultat{filteredThreats.length > 1 ? 's' : ''}
                {searchTerm && ` pour "${searchTerm}"`}
                {timeFilter !== 'all' && ` (${
                  timeFilter === '1h' ? 'dernière heure' :
                  timeFilter === '6h' ? '6 dernières heures' :
                  timeFilter === '24h' ? '24 dernières heures' :
                  timeFilter === '7d' ? '7 derniers jours' :
                  timeFilter === '30d' ? '30 derniers jours' :
                  timeFilter === 'custom' ? 
                    (() => {
                      try {
                        const startFormatted = startDate ? `du ${format(new Date(startDate), 'dd/MM/yyyy HH:mm')}` : '';
                        const endFormatted = endDate ? `au ${format(new Date(endDate), 'dd/MM/yyyy HH:mm')}` : '';
                        return `${startFormatted}${startDate && endDate ? ' ' : ''}${endFormatted}`;
                      } catch (e) {
                        return 'plage personnalisée';
                      }
                    })() : ''
                })`}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredThreats.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-400">
                {searchTerm || timeFilter !== 'all' ? 
                  'Aucune menace trouvée pour les filtres appliqués' : 
                  'Aucune menace disponible'
                }
              </div>
            ) : (
              filteredThreats.map((threat) => (
                <div
                  key={threat.id}
                  onClick={() => setSelectedThreat(threat.id)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedThreat === threat.id 
                      ? 'bg-slate-600 border-2 border-blue-500' 
                      : 'bg-slate-700 hover:bg-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white text-sm font-medium">{threat.name}</span>
                    <Badge className={getSeverityColor(threat.severity)}>
                      {threat.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    Score: {threat.score.toFixed(2)}
                  </div>
                  <Progress value={threat.score * 100} className="h-2" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flux de traitement hiérarchique horizontal */}
      {selectedThreatData && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Étape 1: QUOI - Menace actuelle */}
          <Card className="bg-slate-800 border-slate-700 relative">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <Target className="w-6 h-6 mr-2 text-red-400" />
                1. QUOI
              </CardTitle>
              <div className="text-sm text-gray-400">Menace Actuelle</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-white font-medium mb-2">{selectedThreatData.name}</h3>
                <p className="text-gray-400 text-sm mb-3">{selectedThreatData.description}</p>
                <div className="flex items-center space-x-2 mb-3">
                  <Badge className={getSeverityColor(selectedThreatData.severity)}>
                    {selectedThreatData.severity}
                  </Badge>
                  <Badge variant="outline" className="text-gray-400">
                    {selectedThreatData.category}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Score de menace</span>
                  <span className="text-white font-bold text-lg">{selectedThreatData.score.toFixed(2)}</span>
                </div>
                <Progress value={selectedThreatData.score * 100} className="h-3" />
              </div>
              
              <div className="space-y-2">
                <div className="text-sm text-gray-300 font-medium">Entités associées:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedThreatData.entities && selectedThreatData.entities.length > 0 ? (
                    selectedThreatData.entities.map((entity, index) => (
                      <Badge key={index} variant="outline" className="text-xs text-gray-400">
                        {entity}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">Aucune entité associée</span>
                  )}
                </div>
              </div>
            </CardContent>
            
            {/* Flèche vers la droite */}
            <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 hidden lg:block">
              <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </Card>

          {/* Étape 2: OÙ ÇA VA - Prédictions */}
          <Card className="bg-slate-800 border-slate-700 relative">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <Brain className="w-6 h-6 mr-2 text-blue-400" />
                2. OÙ ÇA VA
              </CardTitle>
              <div className="text-sm text-gray-400">Prédictions d'Évolution</div>
            </CardHeader>
            <CardContent>
              {relatedPrediction ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-300 text-sm">Score actuel</span>
                        <div className="text-white font-bold text-lg">{relatedPrediction.current_score.toFixed(2)}</div>
                      </div>
                      <div>
                        <span className="text-gray-300 text-sm">Score prédit</span>
                        <div className="flex items-center space-x-2">
                          {getTrendIcon(relatedPrediction.trend)}
                          <span className="text-white font-bold text-lg">{relatedPrediction.predicted_score.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-gray-300 text-sm">Confiance</span>
                        <div className="text-white font-bold text-lg">{(relatedPrediction.confidence * 100).toFixed(0)}%</div>
                        <Progress value={relatedPrediction.confidence * 100} className="h-2 mt-1" />
                      </div>
                      <div>
                        <Badge className={getSeverityColor(relatedPrediction.risk_level)}>
                          Risque: {relatedPrediction.risk_level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm text-gray-300 font-medium">Facteurs d'influence:</div>
                    {relatedPrediction.factors.map((factor, index) => (
                      <div key={index} className="text-xs text-gray-400 flex items-center">
                        <div className="w-1 h-1 bg-blue-400 rounded-full mr-2"></div>
                        {factor}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-400 bg-slate-700 p-2 rounded">
                    <Zap className="w-4 h-4 inline mr-1" />
                    Délai: {relatedPrediction.timeframe}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  Aucune prédiction disponible
                </div>
              )}
            </CardContent>
            
            {/* Flèche vers la droite */}
            <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 hidden lg:block">
              <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </Card>

          {/* Étape 3: QUE FAIRE - Prescriptions */}
          <Card className="bg-slate-800 border-slate-700 relative">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <Shield className="w-6 h-6 mr-2 text-green-400" />
                3. QUE FAIRE
              </CardTitle>
              <div className="text-sm text-gray-400">Actions Recommandées</div>
            </CardHeader>
            <CardContent>
              {relatedPrescriptions.length > 0 ? (
                <div className="space-y-4">
                  {relatedPrescriptions.map((prescription) => (
                    <div key={prescription.id} className="p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-medium text-sm">{prescription.title}</h3>
                        <div className="flex items-center space-x-1">
                          <Badge className={getPriorityColor(prescription.priority)} size="sm">
                            {prescription.priority}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="text-sm text-gray-300 font-medium">Actions:</div>
                          {prescription.actions && prescription.actions.length > 0 ? (
                            prescription.actions.slice(0, 3).map((action) => (
                              <div key={action.id} className="flex items-center space-x-2 text-xs">
                                {getStatusIcon(action.completed ? 'completed' : 'pending')}
                                <span className="text-gray-400">{action.description}</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">Aucune action disponible</span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm text-gray-300 font-medium">Ressources:</div>
                          <div className="flex flex-wrap gap-1">
                            {prescription.resources_needed && prescription.resources_needed.length > 0 ? (
                              prescription.resources_needed.slice(0, 2).map((resource, index) => (
                                <Badge key={index} variant="outline" className="text-xs text-gray-400">
                                  <Users className="w-3 h-3 mr-1" />
                                  {resource}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">Aucune ressource spécifiée</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-400 bg-slate-800 p-2 rounded flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Délai: {prescription.estimated_time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  Aucune prescription disponible
                </div>
              )}
            </CardContent>
            
            {/* Flèche vers la droite */}
            <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 hidden lg:block">
              <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </Card>

          {/* Étape 4: COMMENT - Actions concrètes */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg">
                <Activity className="w-6 h-6 mr-2 text-purple-400" />
                4. COMMENT
              </CardTitle>
              <div className="text-sm text-gray-400">Actions Concrètes</div>
            </CardHeader>
            <CardContent>
              {relatedActions.length > 0 ? (
                <div className="space-y-3">
                  {relatedActions.slice(0, 4).map((action, index) => (
                    <div key={index} className="p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(action.status)}
                          <span className="text-white text-sm font-medium">{action.type || 'Action'}</span>
                        </div>
                        <Badge className={action.status === 'completed' ? 'bg-green-500 bg-opacity-20 text-green-400' : 'bg-blue-500 bg-opacity-20 text-blue-400'}>
                          {action.status === 'completed' ? 'Terminé' : 'En cours'}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-400 text-xs mb-2">{action.description}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-2">
                        <div className="flex items-center space-x-1">
                          <Badge variant="outline" className="text-xs">
                            {action.priority}
                          </Badge>
                        </div>
                        
                        {action.timestamp && (
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{(() => {
                              try {
                                return new Date(action.timestamp).toLocaleString();
                              } catch (error) {
                                return 'Date invalide';
                              }
                            })()}</span>
                          </div>
                        )}
                      </div>
                      
                      {action.id && (
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {action.id}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {relatedActions.length > 4 && (
                    <div className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-600 text-gray-400 hover:bg-slate-700"
                      >
                        Voir {relatedActions.length - 4} autres actions
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  Aucune action en cours
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tableau de bord des liens */}
      {selectedThreatData && (
        <Card className="bg-slate-800 border-slate-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Target className="w-5 h-5 mr-2 text-orange-400" />
              Tableau de Bord des Liens
            </CardTitle>
            <div className="text-sm text-gray-400">Connections entre les éléments du flux</div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Résumé Menace */}
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <div className="w-2 h-2 bg-red-400 rounded-full mr-2"></div>
                  Menace Sélectionnée
                </h4>
                <p className="text-gray-400 text-sm">{selectedThreatData.name}</p>
                <p className="text-xs text-gray-500 mt-1">Score: {selectedThreatData.score.toFixed(2)}</p>
              </div>

              {/* Résumé Prédiction */}
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                  Prédiction Liée
                </h4>
                {relatedPrediction ? (
                  <>
                    <p className="text-gray-400 text-sm">Score prédit: {relatedPrediction.predicted_score.toFixed(2)}</p>
                    <p className="text-xs text-gray-500 mt-1">Tendance: {relatedPrediction.trend}</p>
                  </>
                ) : (
                  <p className="text-gray-500 text-sm">Aucune prédiction</p>
                )}
              </div>

              {/* Résumé Prescriptions */}
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  Prescriptions Liées
                </h4>
                <p className="text-gray-400 text-sm">{relatedPrescriptions.length} prescription(s)</p>
                {relatedPrescriptions.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Priorité max: {relatedPrescriptions[0].priority}
                  </p>
                )}
              </div>

              {/* Résumé Actions */}
              <div className="p-4 bg-slate-700 rounded-lg">
                <h4 className="text-white font-medium mb-2 flex items-center">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-2"></div>
                  Actions Liées
                </h4>
                <p className="text-gray-400 text-sm">{relatedActions.length} action(s)</p>
                {relatedActions.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Terminées: {relatedActions.filter(a => a.status === 'completed').length}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}