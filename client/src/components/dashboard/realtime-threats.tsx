import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Clock, Eye, AlertTriangle, Shield, Activity, Search, Filter, Calendar, X, CalendarDays } from 'lucide-react';
import { formatDistanceToNow, isAfter, isBefore, subHours, subDays, subWeeks, subMonths, startOfDay, endOfDay, format } from 'date-fns';
import { useState } from 'react';

export function RealtimeThreats() {
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDateRange, setShowCustomDateRange] = useState<boolean>(false);
  
  const { data: threatsData, isLoading } = useQuery({
    queryKey: ['/api/threats/realtime'],
    queryFn: () => dashboardApi.getRealtimeThreats(10),
    refetchInterval: 5000,
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500 bg-opacity-20 text-red-400 border-red-500';
      case 'high':
        return 'bg-orange-500 bg-opacity-20 text-orange-400 border-orange-500';
      case 'medium':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400 border-yellow-500';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400 border-gray-500';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.75) return 'text-red-400';
    if (score >= 0.60) return 'text-orange-400';
    if (score >= 0.40) return 'text-yellow-400';
    return 'text-gray-400';
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

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Menaces en Temps Réel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border border-slate-700 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-6 bg-slate-700 rounded w-1/4 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const threats = threatsData?.threats || [];

  // Filtrer les menaces selon le terme de recherche et l'intervalle de temps
  const filteredThreats = threats.filter((threat) => {
    // Filtrage par texte
    const matchesSearch = searchTerm === '' || 
      threat.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      threat.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtrage par temps
    let matchesTime = true;
    
    if (timeFilter === 'custom' && (startDate || endDate)) {
      const threatDate = threat.timestamp ? new Date(threat.timestamp) : null;
      if (threatDate) {
        if (startDate && endDate) {
          matchesTime = isAfter(threatDate, new Date(startDate)) && isBefore(threatDate, new Date(endDate));
        } else if (startDate) {
          matchesTime = isAfter(threatDate, new Date(startDate));
        } else if (endDate) {
          matchesTime = isBefore(threatDate, new Date(endDate));
        }
      }
    } else if (timeFilter !== 'all') {
      const timeFilterDate = getTimeFilterDate(timeFilter);
      matchesTime = timeFilterDate === null || 
        (threat.timestamp && isAfter(new Date(threat.timestamp), timeFilterDate));
    }
    
    return matchesSearch && matchesTime;
  });

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Menaces en Temps Réel</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-gray-400">En Direct</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Barre de recherche/filtre */}
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
                ×
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
                      return `${startDate ? `du ${format(new Date(startDate), 'dd/MM/yyyy HH:mm')}` : ''}${startDate && endDate ? ' ' : ''}${endDate ? `au ${format(new Date(endDate), 'dd/MM/yyyy HH:mm')}` : ''}`;
                    } catch (e) {
                      return 'plage personnalisée';
                    }
                  })() : ''
              })`}
            </span>
          </div>
        )}

        <div className="space-y-4">
          {filteredThreats.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {searchTerm || timeFilter !== 'all' ? 
                'Aucune menace trouvée pour les filtres appliqués' : 
                'Aucune menace active détectée'
              }
              {timeFilter === 'custom' && (startDate || endDate) && (
                <div className="mt-2 text-sm text-gray-500">
                  {startDate && endDate ? 
                    `Période recherchée: du ${format(new Date(startDate), 'dd/MM/yyyy HH:mm')} au ${format(new Date(endDate), 'dd/MM/yyyy HH:mm')}` :
                    startDate ? 
                      `Période recherchée: à partir du ${format(new Date(startDate), 'dd/MM/yyyy HH:mm')}` :
                      `Période recherchée: jusqu'au ${format(new Date(endDate), 'dd/MM/yyyy HH:mm')}`
                  }
                </div>
              )}
            </div>
          ) : (
            filteredThreats.map((threat) => (
              <div
                key={threat.id}
                className="border border-slate-700 rounded-lg p-4 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => setSelectedThreat(threat)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">
                    {threat.name || threat.id}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getSeverityColor(threat.severity)}`}
                    >
                      {threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1)}
                    </Badge>
                    <Eye className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div className={`text-2xl font-bold mb-2 ${getScoreColor(threat.score)}`}>
                  {threat.score.toFixed(2)}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(threat.timestamp), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      {/* Modal des détails de menace */}
      <Dialog open={!!selectedThreat} onOpenChange={() => setSelectedThreat(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
          <DialogHeader className="pb-4 border-b border-slate-700">
            <DialogTitle className="flex items-center space-x-3 text-xl">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <span className="text-white">Analyse Détaillée de la Menace</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedThreat && (
            <div className="space-y-6 pt-4">
              {/* En-tête de la menace - Redesign */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-6 border border-slate-600">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center">
                      <Shield className="w-6 h-6 mr-3 text-blue-400" />
                      {selectedThreat.name || selectedThreat.id}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Détecté le {formatDistanceToNow(new Date(selectedThreat.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`${getSeverityColor(selectedThreat.severity)} text-sm px-3 py-1`}
                  >
                    {selectedThreat.severity.charAt(0).toUpperCase() + selectedThreat.severity.slice(1)}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Score de Menace</p>
                    <p className={`text-3xl font-bold ${getScoreColor(selectedThreat.score)}`}>
                      {selectedThreat.score.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Statut</p>
                    <p className="text-white font-medium text-lg">{selectedThreat.status}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800 rounded-lg border border-slate-600">
                    <p className="text-sm text-gray-400 mb-1">Priorité</p>
                    <p className="text-orange-400 font-medium text-lg">HAUTE</p>
                  </div>
                </div>
              </div>

              {/* Informations détaillées - Utilise les données dynamiques */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-4 flex items-center text-lg">
                    <Activity className="w-5 h-5 mr-3 text-green-400" />
                    Chronologie d'Activité
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-gray-300 font-medium">Première détection:</span>
                      <span className="text-white">
                        {formatDistanceToNow(new Date(selectedThreat.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                    {selectedThreat.metadata?.processing_time && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-700">
                        <span className="text-gray-300 font-medium">Dernière mise à jour:</span>
                        <span className="text-white">
                          {formatDistanceToNow(new Date(selectedThreat.metadata.processing_time), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    {selectedThreat.evolution_prediction && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-300 font-medium">Évolution prédite:</span>
                        <span className={`font-bold ${selectedThreat.evolution_prediction.trend === 'increasing' ? 'text-red-400' : 'text-green-400'}`}>
                          {selectedThreat.evolution_prediction.trend === 'increasing' ? '↗' : '↘'} 
                          {selectedThreat.evolution_prediction.trend === 'increasing' ? 'Croissante' : 'Décroissante'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-800 border border-slate-600 rounded-xl p-5">
                  <h4 className="font-semibold text-white mb-4 flex items-center text-lg">
                    <Shield className="w-5 h-5 mr-3 text-blue-400" />
                    Classification Intelligence
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                      <span className="text-gray-300 font-medium">Type de menace:</span>
                      <span className="text-white">{selectedThreat.name || 'Non classifié'}</span>
                    </div>
                    {selectedThreat.raw_data?.location && (
                      <div className="flex justify-between items-center py-2 border-b border-slate-700">
                        <span className="text-gray-300 font-medium">Zone géographique:</span>
                        <span className="text-white">{selectedThreat.raw_data.location}</span>
                      </div>
                    )}
                    {selectedThreat.metadata?.confidence && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-300 font-medium">Niveau de confiance:</span>
                        <span className="text-yellow-400 font-bold">
                          {Math.round(selectedThreat.metadata.confidence * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Indicateurs de menace - Utilise les données réelles si disponibles */}
              {selectedThreat.deep_learning_analysis?.threat_indicators && (
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                  <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                    <AlertTriangle className="w-5 h-5 mr-3 text-orange-400" />
                    Indicateurs de Menace
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(selectedThreat.deep_learning_analysis.threat_indicators).map(([key, value], index) => {
                      const percentage = typeof value === 'number' ? Math.round(value * 100) : 0;
                      const color = percentage >= 75 ? 'text-red-400' : percentage >= 50 ? 'text-yellow-400' : 'text-green-400';
                      const bgColor = percentage >= 75 ? 'bg-red-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-green-500';
                      
                      return (
                        <div key={index} className="p-3 bg-slate-700 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-gray-300 font-medium capitalize">{key.replace('_', ' ')}</span>
                            <span className={`text-sm font-bold ${color}`}>{percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${bgColor}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Sources et contexte - Utilise les données réelles si disponibles */}
              {selectedThreat.raw_data?.sources && (
                <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                  <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                    <Eye className="w-5 h-5 mr-3 text-purple-400" />
                    Sources d'Intelligence
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedThreat.raw_data.sources.map((source, index) => (
                      <div key={index} className="p-4 bg-slate-700 rounded-lg border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline" className="text-xs px-2 py-1 bg-blue-500 bg-opacity-20">
                            {source.type || 'UNKNOWN'}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {source.reliability ? `${Math.round(source.reliability * 100)}%` : 'N/A'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 font-medium">{source.name || 'Source non identifiée'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions recommandées - Section simplifiée pour les données dynamiques */}
              <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
                <h4 className="font-semibold text-white mb-5 flex items-center text-lg">
                  <Activity className="w-5 h-5 mr-3 text-orange-400" />
                  Informations de Traitement
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-300 font-medium">ID de menace</span>
                    </div>
                    <span className="text-xs text-gray-400 font-mono">{selectedThreat.id}</span>
                  </div>
                  
                  {selectedThreat.metadata?.model_version && (
                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-300 font-medium">Version du modèle</span>
                      </div>
                      <span className="text-sm text-white">{selectedThreat.metadata.model_version}</span>
                    </div>
                  )}
                  
                  {selectedThreat.metadata?.quality_score && (
                    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-lg border border-slate-600">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-300 font-medium">Score de qualité</span>
                      </div>
                      <span className="text-sm text-white">
                        {Math.round(selectedThreat.metadata.quality_score * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
