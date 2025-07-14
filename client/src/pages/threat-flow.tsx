import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  Users
} from "lucide-react";

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
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFlowData();
  }, []);

  const fetchFlowData = async () => {
    try {
      const [threatsResponse, predictionsResponse, prescriptionsResponse] = await Promise.all([
        fetch('/api/threats/realtime'),
        fetch('/api/prescriptions/trends'),
        fetch('/api/prescriptions')
      ]);

      if (threatsResponse.ok) {
        const threatsData = await threatsResponse.json();
        setThreats(threatsData.threats || []);
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
      }

      if (prescriptionsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json();
        setPrescriptions(prescriptionsData.prescriptions || []);
      }

      if (threats.length > 0) {
        setSelectedThreat(threats[0].id);
      }
    } catch (error) {
      console.error('Error fetching flow data:', error);
    } finally {
      setLoading(false);
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

  const selectedThreatData = threats.find(t => t.id === selectedThreat);
  const relatedPrediction = selectedThreat ? predictions[selectedThreat] : null;
  const relatedPrescriptions = prescriptions.filter(p => p.threat_id === selectedThreat);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {threats.map((threat) => (
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
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Flux de traitement hiérarchique horizontal */}
      {selectedThreatData && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
          <Card className="bg-slate-800 border-slate-700">
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
          </Card>
        </div>
      )}
    </div>
  );
}