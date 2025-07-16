import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Clipboard, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  ArrowRight,
  Eye,
  User,
  Calendar,
  Target,
  Activity
} from "lucide-react";
import { Link } from "wouter";

interface PrescriptionSummary {
  total: number;
  pending: number;
  in_progress: number;
  completed: number;
  critical_pending: number;
  latest_prescriptions: Array<{
    id: string;
    title: string;
    priority: string;
    category: string;
    status: string;
    created_at: string;
  }>;
}

export function PrescriptionSummary() {
  const [summary, setSummary] = useState<PrescriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [prescriptionDetails, setPrescriptionDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchPrescriptionSummary();
    const interval = setInterval(fetchPrescriptionSummary, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPrescriptionSummary = async () => {
    try {
      const authHeaders = {
        'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`,
        'Content-Type': 'application/json'
      };
      
      const [prescriptionsResponse, statsResponse] = await Promise.all([
        fetch('/api/prescriptions', { headers: authHeaders }),
        fetch('/api/prescriptions/statistics', { headers: authHeaders })
      ]);

      if (prescriptionsResponse.ok && statsResponse.ok) {
        const prescriptionsData = await prescriptionsResponse.json();
        const statsData = await statsResponse.json();
        
        const prescriptions = prescriptionsData.prescriptions || [];
        const stats = statsData.statistics || {};
        
        // Calculate summary data
        const summaryData: PrescriptionSummary = {
          total: stats.total || 0,
          pending: stats.by_status?.pending || 0,
          in_progress: stats.by_status?.in_progress || 0,
          completed: stats.by_status?.completed || 0,
          critical_pending: prescriptions.filter((p: any) => 
            p.priority === 'critical' && p.status === 'pending'
          ).length,
          latest_prescriptions: prescriptions
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 3)
        };
        
        setSummary(summaryData);
      }
    } catch (error) {
      console.error('Error fetching prescription summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrescriptionDetails = async (prescriptionId: string) => {
    setDetailsLoading(true);
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPrescriptionDetails(data);
      }
    } catch (error) {
      console.error('Error fetching prescription details:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewDetails = (prescription: any) => {
    setSelectedPrescription(prescription);
    fetchPrescriptionDetails(prescription.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 bg-opacity-20 text-red-400';
      case 'high': return 'bg-orange-500 bg-opacity-20 text-orange-400';
      case 'medium': return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'low': return 'bg-green-500 bg-opacity-20 text-green-400';
      default: return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'security': return '🛡️';
      case 'investigation': return '🔍';
      case 'mitigation': return '⚠️';
      case 'response': return '🚨';
      default: return '📋';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      if (!dateString) return 'Date inconnue';
      
      const date = new Date(dateString);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'À l\'instant';
      if (diffInMinutes < 60) return `${diffInMinutes}min`;
      if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
      return `${Math.floor(diffInMinutes / 1440)}j`;
    } catch (error) {
      console.error('Error formatting time:', error, dateString);
      return 'Date invalide';
    }
  };

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span>Chargement...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <Clipboard className="w-8 h-8 mx-auto mb-2" />
            <p>Aucune donnée de prescription disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Clipboard className="w-5 h-5 mr-2 text-blue-400" />
            Prescriptions Automatisées
          </CardTitle>
          {summary.critical_pending > 0 && (
            <Badge className="bg-red-500 bg-opacity-20 text-red-400 animate-pulse">
              {summary.critical_pending} Critique{summary.critical_pending > 1 ? 's' : ''}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Overview */}
        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-3 bg-slate-700 rounded-lg">
            <div className="text-xl font-bold text-white">{summary.total}</div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
          <div className="text-center p-3 bg-slate-700 rounded-lg">
            <div className="text-xl font-bold text-yellow-400">{summary.pending}</div>
            <div className="text-xs text-gray-400">En attente</div>
          </div>
          <div className="text-center p-3 bg-slate-700 rounded-lg">
            <div className="text-xl font-bold text-blue-400">{summary.in_progress}</div>
            <div className="text-xs text-gray-400">En cours</div>
          </div>
          <div className="text-center p-3 bg-slate-700 rounded-lg">
            <div className="text-xl font-bold text-green-400">{summary.completed}</div>
            <div className="text-xs text-gray-400">Terminées</div>
          </div>
        </div>

        {/* Latest Prescriptions */}
        {summary.latest_prescriptions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300 mb-3">Prescriptions récentes</h4>
            {summary.latest_prescriptions.map((prescription) => (
              <div 
                key={prescription.id} 
                className="flex items-center justify-between p-3 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{getCategoryIcon(prescription.category)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {prescription.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={`text-xs ${getPriorityColor(prescription.priority)}`}>
                        {prescription.priority.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(prescription.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(prescription)}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-slate-800 border-slate-700 text-white">
                      <DialogHeader>
                        <DialogTitle className="flex items-center space-x-2">
                          <span className="text-lg">{getCategoryIcon(selectedPrescription?.category)}</span>
                          <span>Détails de la Prescription</span>
                        </DialogTitle>
                      </DialogHeader>
                      
                      {detailsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : prescriptionDetails ? (
                        <div className="space-y-6">
                          {/* En-tête de la prescription */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white">
                                {prescriptionDetails.title}
                              </h3>
                              <p className="text-sm text-gray-300 mt-1">
                                {prescriptionDetails.description}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <Badge className={`${getPriorityColor(prescriptionDetails.priority)}`}>
                                {prescriptionDetails.priority?.toUpperCase()}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {prescriptionDetails.category}
                              </Badge>
                            </div>
                          </div>

                          {/* Informations générales */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm">
                                <User className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">Assigné à:</span>
                                <span className="text-white">{prescriptionDetails.assigned_to || 'Non assigné'}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">Créé le:</span>
                                <span className="text-white">
                                  {prescriptionDetails.created_at ? 
                                    (() => {
                                      try {
                                        return new Date(prescriptionDetails.created_at).toLocaleDateString('fr-FR');
                                      } catch (error) {
                                        return 'Date invalide';
                                      }
                                    })() : 
                                    'Non définie'
                                  }
                                </span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2 text-sm">
                                <Activity className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">Statut:</span>
                                <span className="text-white">{prescriptionDetails.status}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Target className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-400">Échéance:</span>
                                <span className="text-white">
                                  {prescriptionDetails.due_date ? 
                                    (() => {
                                      try {
                                        return new Date(prescriptionDetails.due_date).toLocaleDateString('fr-FR');
                                      } catch (error) {
                                        return 'Date invalide';
                                      }
                                    })() : 
                                    'Non définie'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          {prescriptionDetails.actions && prescriptionDetails.actions.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-sm font-medium text-gray-300">Actions requises</h4>
                              <div className="space-y-2">
                                {prescriptionDetails.actions.map((action: any, index: number) => (
                                  <div key={index} className="flex items-center space-x-3 p-3 bg-slate-700 rounded-lg">
                                    <div className={`w-2 h-2 rounded-full ${action.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                    <div className="flex-1">
                                      <p className="text-sm text-white">{action.description}</p>
                                      <p className="text-xs text-gray-400 mt-1">
                                        Estimé: {action.estimated_time} | Ressources: {action.resources}
                                      </p>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {action.completed ? 'Terminé' : 'En attente'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Progression */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Progression</span>
                              <span className="text-white">{prescriptionDetails.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${prescriptionDetails.progress || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <p>Impossible de charger les détails de la prescription</p>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {prescription.status === 'pending' && (
                    <Clock className="w-4 h-4 text-yellow-400" />
                  )}
                  {prescription.status === 'in_progress' && (
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  )}
                  {prescription.status === 'completed' && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Critical Actions */}
        {summary.critical_pending > 0 && (
          <div className="p-3 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">
                Actions critiques requises
              </span>
            </div>
            <p className="text-xs text-gray-300 mb-3">
              {summary.critical_pending} prescription{summary.critical_pending > 1 ? 's' : ''} critique{summary.critical_pending > 1 ? 's' : ''} en attente d'attention immédiate
            </p>
          </div>
        )}

        {/* View All Button */}
        <Link href="/prescriptions">
          <Button 
            variant="outline" 
            className="w-full border-slate-600 text-gray-300 hover:bg-slate-700"
          >
            Voir toutes les prescriptions
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}