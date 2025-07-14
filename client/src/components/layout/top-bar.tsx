import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Satellite, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useQuery } from '@tanstack/react-query';
import { alertApi } from '@/lib/api';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = 'Threat Detection Dashboard' }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  
  const { data: alertsData } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: () => alertApi.getAlerts(),
    refetchInterval: 5000,
  });

  const unreadAlerts = alertsData?.alerts?.filter(alert => !alert.isRead)?.length || 0;

  return (
    <div className="bg-dark-surface border-b border-dark-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">System Operational</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Real-time Status */}
          <div className="flex items-center space-x-2 bg-dark-elevated px-3 py-2 rounded-lg">
            <Satellite className="w-4 h-4 text-success" />
            <span className="text-sm text-gray-300">Live Feed</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              className="relative p-2 text-gray-400 hover:text-white"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts > 0 && (
                <Badge 
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {unreadAlerts}
                </Badge>
              )}
            </Button>
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 text-gray-400 hover:text-white"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
