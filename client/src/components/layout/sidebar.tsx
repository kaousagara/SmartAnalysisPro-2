import { Link, useLocation } from 'wouter';
import { Brain, ChartLine, AlertTriangle, Upload, Table, BarChart, FileText, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartLine },
  { name: 'Threat Detection', href: '/threats', icon: AlertTriangle },
  { name: 'Data Ingestion', href: '/ingestion', icon: Upload },
  { name: 'Scenarios', href: '/scenarios', icon: Table },
  { name: 'Analytics', href: '/analytics', icon: BarChart },
  { name: 'Reports', href: '/reports', icon: FileText },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-dark-surface border-r border-dark-border">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <Brain className="text-primary text-2xl" />
          <div>
            <h1 className="text-lg font-semibold text-white">Intel Analysis</h1>
            <p className="text-xs text-gray-400">v2.0 Secure</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <a
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary bg-opacity-20 text-primary'
                      : 'text-gray-300 hover:bg-dark-elevated hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 w-64 p-6 border-t border-dark-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="text-white text-sm" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {user?.name || 'Unknown User'}
            </p>
            <p className="text-xs text-gray-400">
              Level {user?.clearance_level || 0} Clearance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
