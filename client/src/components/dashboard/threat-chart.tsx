import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Line } from 'react-chartjs-2';
import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type TimeFilter = '24H' | '7J' | '30J';

export function ThreatChart() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('24H');
  
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['/api/threats/evolution', timeFilter],
    queryFn: () => fetch(`/api/threats/evolution?filter=${timeFilter}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('local_auth_token')}`,
        'Content-Type': 'application/json'
      }
    }).then(res => res.json()),
    refetchInterval: 30000,
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#9CA3AF',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 30, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: '#333333',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
      y: {
        beginAtZero: true,
        max: 1,
        grid: {
          color: '#333333',
        },
        ticks: {
          color: '#9CA3AF',
        },
      },
    },
  };



  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Évolution des Scores de Menace</CardTitle>
            <div className="flex space-x-2">
              {(['24H', '7J', '30J'] as TimeFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant={timeFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter(filter)}
                  className="text-xs"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-slate-700 animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Évolution des Scores de Menace</CardTitle>
            <div className="flex space-x-2">
              {(['24H', '7J', '30J'] as TimeFilter[]).map((filter) => (
                <Button
                  key={filter}
                  variant={timeFilter === filter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeFilter(filter)}
                  className="text-xs"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>Erreur lors du chargement des données</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Utiliser les données reçues de l'API ou afficher une erreur
  const data = chartData && chartData.datasets && Array.isArray(chartData.datasets) ? chartData : null;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Évolution des Scores de Menace</CardTitle>
          <div className="flex space-x-2">
            {(['24H', '7J', '30J'] as TimeFilter[]).map((filter) => (
              <Button
                key={filter}
                variant={timeFilter === filter ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeFilter(filter)}
                className="text-xs"
              >
                {filter}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          {data ? (
            <Line data={data} options={options} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>Aucune donnée disponible pour le graphique</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
