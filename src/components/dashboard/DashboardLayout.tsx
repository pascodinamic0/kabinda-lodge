
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import {
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import DashboardSidebar from './DashboardSidebar';
import NotificationPopover from './NotificationPopover';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  console.log('🔧 DashboardLayout: Component rendering started');
  console.log('🔧 DashboardLayout: Props:', { title, subtitle, hasChildren: !!children });
  
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  console.log('🔧 DashboardLayout: Auth data:', { userEmail: user?.email, hasUser: !!user });

  const handleSignOut = async () => {
    console.log('🔧 DashboardLayout: Sign out initiated');
    await signOut();
    navigate('/');
  };

  console.log('🔧 DashboardLayout: Rendering layout structure');

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex h-16 items-center justify-between px-6">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                {title && (
                  <div>
                    {subtitle && <p className="text-sm text-muted-foreground">Welcome back, {user?.email}</p>}
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-3">
                <NotificationPopover />
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={handleSignOut} 
                    variant="outline" 
                    size="sm"
                    className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-700 hover:from-red-100 hover:to-red-200 hover:border-red-300 hover:text-red-800 transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Debug Info Panel */}
          <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2">
            <p className="text-yellow-800 text-sm">
              🔍 Debug: DashboardLayout rendered successfully | User: {user?.email || 'None'} | Has Children: {children ? 'Yes' : 'No'}
            </p>
          </div>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            {console.log('🔧 DashboardLayout: Rendering children')}
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
