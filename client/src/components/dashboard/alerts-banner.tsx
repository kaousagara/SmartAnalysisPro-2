import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { alertApi } from '@/lib/api';
import { AlertTriangle, Info, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AlertsBanner() {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [isAlertsUpdating, setIsAlertsUpdating] = useState(false);

  const { data: alertsData, isFetching } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: alertApi.getAlerts,
    refetchInterval: 3000, // Mise à jour plus fréquente pour les alertes
  });

  useEffect(() => {
    if (isFetching) {
      setIsAlertsUpdating(true);
      const timer = setTimeout(() => setIsAlertsUpdating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isFetching]);

  const alerts = alertsData?.alerts || [];
  const visibleAlerts = alerts
    .filter(alert => !dismissedAlerts.has(alert.id))
    .slice(0, 2); // Show maximum 2 alerts

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'error':
        return 'bg-red-500 bg-opacity-20 border-red-500 text-red-400';
      case 'warning':
        return 'bg-orange-500 bg-opacity-20 border-orange-500 text-orange-400';
      default:
        return 'bg-blue-500 bg-opacity-20 border-blue-500 text-blue-400';
    }
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Indicateur global des alertes */}
      {isAlertsUpdating && (
        <div className="flex items-center justify-center space-x-2 text-xs text-blue-400 mb-2">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>Vérification des nouvelles alertes...</span>
        </div>
      )}
      
      {visibleAlerts.map((alert, index) => (
        <div
          key={alert.id}
          style={{ animationDelay: `${index * 200}ms` }}
          className={`px-4 py-3 rounded-lg border ${getAlertColor(alert.severity)} transition-all duration-300 ${
            isAlertsUpdating ? 'animate-pulse ring-2 ring-blue-400 ring-opacity-30' : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getAlertIcon(alert.severity)}
              <div>
                <p className="font-medium">{alert.title}</p>
                <p className="text-sm opacity-90">{alert.message}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDismiss(alert.id)}
              className="hover:bg-transparent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
