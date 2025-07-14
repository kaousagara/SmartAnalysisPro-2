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

  // Générer des données basées sur le filtre temporel
  const generateTimeBasedData = (filter: TimeFilter) => {
    let dataPoints: number;
    let labels: string[];
    
    switch (filter) {
      case '24H':
        dataPoints = 24;
        labels = Array.from({ length: 24 }, (_, i) => {
          const hour = String(i).padStart(2, '0');
          return `${hour}:00`;
        });
        break;
      case '7J':
        dataPoints = 7;
        labels = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toLocaleDateString('fr-FR', { weekday: 'short' });
        });
        break;
      case '30J':
        dataPoints = 30;
        labels = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
        });
        break;
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Score de Menace',
          data: Array.from({ length: dataPoints }, (_, i) => {
            // Simulation de données plus réalistes selon le filtre
            const base = 0.4 + Math.sin(i * 0.5) * 0.2;
            const noise = (Math.random() - 0.5) * 0.1;
            return Math.max(0, Math.min(1, base + noise));
          }),
          borderColor: '#FF6B35',
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Seuil Critique',
          data: Array.from({ length: dataPoints }, () => 0.75),
          borderColor: '#DC2626',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          fill: false
        },
        {
          label: 'Baseline',
          data: Array.from({ length: dataPoints }, () => 0.5),
          borderColor: '#424242',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          fill: false
        }
      ]
    };
  };

  const defaultData = generateTimeBasedData(timeFilter);

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

  // Utiliser les données reçues ou les données par défaut
  const data = chartData && chartData.datasets && Array.isArray(chartData.datasets) ? chartData : defaultData;

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
          <Line data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
