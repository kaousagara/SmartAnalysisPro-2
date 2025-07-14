import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '@/lib/api';
import { Line } from 'react-chartjs-2';
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

export function ThreatChart() {
  const { data: chartData, isLoading, error } = useQuery({
    queryKey: ['/api/threats/evolution'],
    queryFn: dashboardApi.getThreatEvolution,
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

  // Créer des données par défaut si nécessaire
  const defaultData = {
    labels: Array.from({ length: 24 }, (_, i) => {
      const hour = String(i).padStart(2, '0');
      return `${hour}:00`;
    }),
    datasets: [
      {
        label: 'Score de Menace',
        data: Array.from({ length: 24 }, (_, i) => Math.random() * 0.8 + 0.1),
        borderColor: '#FF6B35',
        backgroundColor: 'rgba(255, 107, 53, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Baseline',
        data: Array.from({ length: 24 }, () => 0.5),
        borderColor: '#424242',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        fill: false
      }
    ]
  };

  if (isLoading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Évolution des Scores de Menace</CardTitle>
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
          <CardTitle className="text-white">Évolution des Scores de Menace</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>Erreur lors du chargement des données</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Utiliser les données reçues ou les données par défaut
  const data = chartData && chartData.datasets && Array.isArray(chartData.datasets) ? chartData : defaultData;

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white">Évolution des Scores de Menace</CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-600 bg-opacity-20 text-blue-400 border-blue-600 hover:bg-blue-600 hover:text-white"
            >
              24H
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              7J
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              30J
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Line data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
