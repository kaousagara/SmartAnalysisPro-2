import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bell, Satellite, Sun, Moon, LogOut, User, Settings } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useQuery } from '@tanstack/react-query';
import { alertApi } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

interface TopBarProps {
  title?: string;
}

export function TopBar({ title = 'Threat Detection Dashboard' }: TopBarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  const { data: alertsData } = useQuery({
    queryKey: ['/api/alerts'],
    queryFn: () => alertApi.getAlerts(),
    refetchInterval: 5000,
  });

  const unreadAlerts = alertsData?.alerts?.filter(alert => !alert.isRead)?.length || 0;

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase();
  };

  const getClearanceColor = (level: number) => {
    if (level >= 5) return 'text-red-400';
    if (level >= 3) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getClearanceLabel = (level: number) => {
    if (level >= 5) return 'TOP SECRET';
    if (level >= 3) return 'SECRET';
    return 'CONFIDENTIAL';
  };

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

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user ? getUserInitials(user.name || user.username) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-dark-surface border-dark-border" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-white">
                    {user?.name || user?.username}
                  </p>
                  <p className="text-xs leading-none text-gray-400">
                    {user?.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getClearanceColor(user?.clearance_level || 1)}`}
                    >
                      {getClearanceLabel(user?.clearance_level || 1)}
                    </Badge>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-dark-border" />
              <DropdownMenuItem 
                className="text-gray-300 hover:text-white hover:bg-dark-elevated cursor-pointer"
                onClick={() => window.location.href = '/profile'}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-gray-300 hover:text-white hover:bg-dark-elevated cursor-pointer"
                onClick={() => window.location.href = '/settings'}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-dark-border" />
              <DropdownMenuItem 
                className="text-red-400 hover:text-red-300 hover:bg-red-950 cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}