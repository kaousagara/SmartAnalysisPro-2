import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Clipboard, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  ArrowRight
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

  useEffect(() => {
    fetchPrescriptionSummary();
    const interval = setInterval(fetchPrescriptionSummary, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchPrescriptionSummary = async () => {
    try {
      const [prescriptionsResponse, statsResponse] = await Promise.all([
        fetch('/api/prescriptions'),
        fetch('/api/prescriptions/statistics')
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
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'À l\'instant';
    if (diffInMinutes < 60) return `${diffInMinutes}min`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}j`;
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