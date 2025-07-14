import { Link, useLocation } from 'wouter';
import { Brain, ChartLine, AlertTriangle, Upload, Table, BarChart, FileText, User, Settings } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: ChartLine },
  { name: 'Menaces', href: '/threats', icon: AlertTriangle },
  { name: 'Ingestion', href: '/ingestion', icon: Upload },
  { name: 'Scénarios', href: '/scenarios', icon: Table },
  { name: 'Analytics', href: '/analytics', icon: BarChart },
  { name: 'Rapports', href: '/reports', icon: FileText },
  { name: 'Administration', href: '/admin', icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-card border-r border-border">
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Brain className="text-primary text-2xl" />
            <div>
              <h1 className="text-lg font-semibold text-foreground">Analyse Intel</h1>
              <p className="text-xs text-muted-foreground">v2.0 Sécurisé</p>
            </div>
          </div>
          <ThemeToggle />
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
                      ? 'bg-primary/20 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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

      <div className="absolute bottom-0 w-64 p-6 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <User className="text-primary-foreground text-sm" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {user?.name || 'Utilisateur Inconnu'}
            </p>
            <p className="text-xs text-muted-foreground">
              Niveau {user?.clearance_level || 0} Clearance
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
