import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Database, Percent, ArrowUp, ArrowDown, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';

export function StatsGrid() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 10000,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-4" />
                <div className="h-8 bg-slate-700 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-700 rounded w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Menaces Actives',
      value: stats?.active_threats || 0,
      icon: AlertTriangle,
      trend: { value: '+5 depuis la dernière heure', positive: false },
      color: 'text-red-400',
    },
    {
      title: 'Score Moyen',
      value: stats?.avg_score?.toFixed(2) || '0.00',
      icon: TrendingUp,
      trend: { value: '+0.12 depuis la baseline', positive: false },
      color: 'text-orange-400',
    },
    {
      title: 'Sources de Données',
      value: stats?.data_sources || 0,
      icon: Database,
      trend: { value: 'Toutes opérationnelles', positive: true },
      color: 'text-green-400',
    },
    {
      title: 'Faux Positifs',
      value: `${((stats?.false_positive_rate || 0) * 100).toFixed(1)}%`,
      icon: Percent,
      trend: { value: '-1.8% amélioration', positive: true },
      color: 'text-blue-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">{stat.title}</h3>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold text-white mb-2`}>
                {stat.value}
              </div>
              <p className={`text-sm flex items-center ${
                stat.trend.positive ? 'text-green-400' : 'text-red-400'
              }`}>
                {stat.trend.positive ? (
                  <ArrowDown className="w-3 h-3 mr-1" />
                ) : (
                  <ArrowUp className="w-3 h-3 mr-1" />
                )}
                {stat.trend.value}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
