
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
import { PersistentNotificationPopover } from './PersistentNotificationPopover';
import ErrorBoundary from '../ErrorBoundary';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ErrorBoundary>
          <DashboardSidebar />
        </ErrorBoundary>
        
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shrink-0">
            <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <SidebarTrigger className="touch-manipulation" />
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-3">
                <ErrorBoundary>
                  <PersistentNotificationPopover />
                </ErrorBoundary>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Button 
                    onClick={handleSignOut} 
                    variant="outline" 
                    size="sm"
                    className="bg-gradient-to-r from-red-50 to-red-100 border-red-200 text-red-700 hover:from-red-100 hover:to-red-200 hover:border-red-300 hover:text-red-800 transition-all duration-200 touch-manipulation"
                  >
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline ml-1">Sign Out</span>
                  </Button>
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="container-responsive py-4 sm:py-6">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
