import { Link, useLocation } from 'wouter';
import { Brain, ChartLine, AlertTriangle, Upload, Table, BarChart, FileText, User, Settings, Clipboard, Target } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartLine },
  { name: 'Menaces', href: '/threats', icon: AlertTriangle },
  { name: 'Ingestion', href: '/ingestion', icon: Upload },
  { name: 'Scénarios', href: '/scenarios', icon: Table },
  { name: 'Analyse Prédictive', href: '/analytics', icon: Brain },
  { name: 'Prescriptions', href: '/prescriptions', icon: Clipboard },
  { name: 'Requêtes de Collecte', href: '/collection-requests', icon: Target },
  { name: 'Rapports', href: '/reports', icon: FileText },
  { name: 'Administration', href: '/admin', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-slate-900 border-r border-slate-700">
      <div className="p-6">
        <div className="flex items-center space-x-3 mb-8">
          <Brain className="text-blue-400 text-2xl" />
          <div>
            <h1 className="text-lg font-semibold text-white">Analyse Intel</h1>
            <p className="text-xs text-gray-400">v2.0 Sécurisé</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 bg-opacity-20 text-blue-400'
                      : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 w-64 p-6 border-t border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="text-white text-sm" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              {user?.name || 'Utilisateur Inconnu'}
            </p>
            <p className="text-xs text-gray-400">
              Niveau {user?.clearance_level || 0} Clearance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
