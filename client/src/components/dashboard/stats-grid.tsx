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
          <Card key={i} className="bg-dark-surface border-dark-border">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-4" />
                <div className="h-8 bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-700 rounded w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Active Threats',
      value: stats?.active_threats || 0,
      icon: AlertTriangle,
      trend: { value: '+5 from last hour', positive: false },
      color: 'text-error',
    },
    {
      title: 'Avg Threat Score',
      value: stats?.avg_score?.toFixed(2) || '0.00',
      icon: TrendingUp,
      trend: { value: '+0.12 from baseline', positive: false },
      color: 'text-warning',
    },
    {
      title: 'Data Sources',
      value: stats?.data_sources || 0,
      icon: Database,
      trend: { value: 'All operational', positive: true },
      color: 'text-success',
    },
    {
      title: 'False Positives',
      value: `${((stats?.false_positive_rate || 0) * 100).toFixed(1)}%`,
      icon: Percent,
      trend: { value: '-1.8% improvement', positive: true },
      color: 'text-accent-orange',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="bg-dark-surface border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400">{stat.title}</h3>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div className={`text-2xl font-bold text-white mb-2`}>
                {stat.value}
              </div>
              <p className={`text-sm flex items-center ${
                stat.trend.positive ? 'text-success' : 'text-error'
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
