import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  Target,
  Eye,
  Database
} from "lucide-react";

interface Signal {
  id: string;
  description: string;
  score: number;
  confidence: number;
  entities: string[];
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface PredictionTrend {
  recent_trend: number;
  overall_trend: number;
  current_score: number;
  volatility: number;
}

interface CollectionRequest {
  id: string;
  objective: string;
  collection_type: string;
  urgency: string;
  created_at: string;
  status: string;
}

export default function Analytics() {
  const [signals, setSignals] = useState<{
    weak_signals: Signal[];
    strong_signals: Signal[];
  } | null>(null);
  const [trends, setTrends] = useState<Record<string, PredictionTrend>>({});
  const [collectionRequests, setCollectionRequests] = useState<CollectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const [signalsResponse, trendsResponse, requestsResponse] = await Promise.all([
        fetch('/api/prescriptions/signals'),
        fetch('/api/prescriptions/trends'),
        fetch('/api/prescriptions/collection-requests')
      ]);

      if (signalsResponse.ok) {
        const signalsData = await signalsResponse.json();
        setSignals(signalsData);
      }

      if (trendsResponse.ok) {
        const trendsData = await trendsResponse.json();
        setTrends(trendsData.trends || {});
      }

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setCollectionRequests(requestsData.collection_requests || []);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const validatePrediction = async (threatId: string, outcome: boolean) => {
    try {
      const response = await fetch(`/api/prescriptions/validate/${threatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actual_outcome: outcome }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Validation result:', result);
        // Refresh data after validation
        fetchAnalyticsData();
      }
    } catch (error) {
      console.error('Error validating prediction:', error);
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'decreasing':
        return <TrendingDown className="w-4 h-4 text-green-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSignalColor = (score: number) => {
    if (score >= 0.7) return 'bg-red-500 bg-opacity-20 text-red-400';
    if (score >= 0.4) return 'bg-orange-500 bg-opacity-20 text-orange-400';
    return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critique':
        return 'bg-red-500 bg-opacity-20 text-red-400';
      case 'haute':
        return 'bg-orange-500 bg-opacity-20 text-orange-400';
      case 'moyenne':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'faible':
        return 'bg-green-500 bg-opacity-20 text-green-400';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Il y a moins d\'une heure';
    if (diffInHours < 24) return `Il y a ${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `Il y a ${diffInDays}j`;
  };

  const validatePrediction = async (threatId: string, outcome: boolean) => {
    try {
      const response = await fetch(`/api/prescriptions/validation/${threatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ outcome })
      });
      
      if (response.ok) {
        console.log(`Prédiction validée pour ${threatId}: ${outcome ? 'Confirmée' : 'Infirmée'}`);
        fetchAnalyticsData(); // Refresh data
      }
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2 text-gray-400">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Chargement de l'analyse prédictive...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Analyse Prédictive</h1>
        <Button
          onClick={fetchAnalyticsData}
          variant="outline"
          className="border-slate-600 text-gray-300 hover:bg-slate-700"
        >
          <Activity className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="signals" className="text-gray-300">
            <Target className="w-4 h-4 mr-2" />
            Signaux
          </TabsTrigger>
          <TabsTrigger value="trends" className="text-gray-300">
            <TrendingUp className="w-4 h-4 mr-2" />
            Tendances
          </TabsTrigger>
          <TabsTrigger value="collection" className="text-gray-300">
            <Database className="w-4 h-4 mr-2" />
            Collecte
          </TabsTrigger>
          <TabsTrigger value="validation" className="text-gray-300">
            <Brain className="w-4 h-4 mr-2" />
            Validation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Signaux Faibles */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-yellow-400" />
                  Signaux Faibles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {signals?.weak_signals?.map((signal) => (
                  <div key={signal.id} className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white font-medium">{signal.description}</p>
                      {getTrendIcon(signal.trend)}
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getSignalColor(signal.score)}>
                        Score: {signal.score.toFixed(2)}
                      </Badge>
                      <Badge className="bg-blue-500 bg-opacity-20 text-blue-400">
                        Confiance: {signal.confidence.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {signal.entities.map((entity, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-gray-400">
                          {entity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Signaux Forts */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                  Signaux Forts
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {signals?.strong_signals?.map((signal) => (
                  <div key={signal.id} className="p-4 bg-slate-700 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-white font-medium">{signal.description}</p>
                      {getTrendIcon(signal.trend)}
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge className={getSignalColor(signal.score)}>
                        Score: {signal.score.toFixed(2)}
                      </Badge>
                      <Badge className="bg-blue-500 bg-opacity-20 text-blue-400">
                        Confiance: {signal.confidence.toFixed(2)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {signal.entities.map((entity, index) => (
                        <Badge key={index} variant="outline" className="text-xs text-gray-400">
                          {entity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {Object.entries(trends).map(([threatId, trend]) => (
              <Card key={threatId} className="bg-slate-800 border-slate-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white text-sm">{threatId}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Score actuel</span>
                    <Badge className={getSignalColor(trend.current_score)}>
                      {trend.current_score.toFixed(2)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Tendance récente</span>
                    <div className="flex items-center space-x-1">
                      {trend.recent_trend > 0 ? (
                        <TrendingUp className="w-4 h-4 text-red-400" />
                      ) : trend.recent_trend < 0 ? (
                        <TrendingDown className="w-4 h-4 text-green-400" />
                      ) : (
                        <Minus className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-400">
                        {trend.recent_trend > 0 ? '+' : ''}{trend.recent_trend.toFixed(3)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Volatilité</span>
                    <Badge className="bg-purple-500 bg-opacity-20 text-purple-400">
                      {trend.volatility.toFixed(3)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="collection" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Requêtes de Collecte Automatisées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collectionRequests.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Aucune requête de collecte active</p>
                ) : (
                  collectionRequests.map((request) => (
                    <div key={request.id} className="p-4 bg-slate-700 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-white font-medium">{request.objective}</h3>
                        <Badge className={getUrgencyColor(request.urgency)}>
                          {request.urgency.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Type: {request.collection_type}</span>
                        <span>Créé: {formatTimeAgo(request.created_at)}</span>
                        <Badge variant="outline" className="text-xs">
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Validation des Prédictions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(trends).map(([threatId, trend]) => (
                  <div key={threatId} className="p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-white font-medium">{threatId}</h3>
                        <p className="text-sm text-gray-400">
                          Score prédit: {trend.current_score.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() => validatePrediction(threatId, true)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Confirmé
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => validatePrediction(threatId, false)}
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Infirmé
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      Utilisez ces boutons pour valider si la prédiction s'est avérée correcte
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}