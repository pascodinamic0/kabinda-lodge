
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Calendar, 
  CreditCard, 
  UserCheck, 
  Receipt,
  Upload,
  Download,
  Hotel,
  DollarSign,
  CheckCircle,
  LogOut,
  MessageSquare,
  Star,
  Users,
  Bed,
  ClipboardList,
  AlertTriangle,
  Sparkles,
  KeyRound,
  Wrench,
  Search,
  Phone,
  ShoppingCart,
  Power,
  RefreshCw
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useLanguage } from '@/contexts/LanguageContext';
import { checkBridgeServiceStatus, getReaderStatus } from '@/services/cardProgrammingService';
import { useToast } from '@/hooks/use-toast';

export default function ReceptionDashboard() {
  const { 
    loading, 
    error 
  } = useDashboardStats();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [bridgeServiceStatus, setBridgeServiceStatus] = useState<{
    available: boolean | null;
    readerConnected: boolean | null;
    checking: boolean;
  }>({
    available: null,
    readerConnected: null,
    checking: false
  });

  // Check bridge service status on mount and periodically
  useEffect(() => {
    checkServiceStatus();
    // Check every 30 seconds
    const interval = setInterval(checkServiceStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkServiceStatus = async () => {
    setBridgeServiceStatus(prev => ({ ...prev, checking: true }));
    try {
      const available = await checkBridgeServiceStatus();
      let readerConnected = false;
      
      if (available) {
        try {
          const readerStatus = await getReaderStatus();
          readerConnected = readerStatus.connected;
        } catch (error: any) {
          // Only log unexpected errors, not service unavailable errors
          if (error.message !== 'Bridge service is not available') {
            console.error('Error checking reader status:', error);
          }
        }
      }
      
      setBridgeServiceStatus({
        available,
        readerConnected,
        checking: false
      });
    } catch (error) {
      setBridgeServiceStatus({
        available: false,
        readerConnected: false,
        checking: false
      });
    }
  };

  const dashboardItems = [
    {
      title: "Guest Management",
      description: "Manage guest profiles and information",
      icon: Users,
      href: '/reception/guests',
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      title: "Room Status",
      description: "Monitor and update room availability",
      icon: Bed,
      href: '/reception/rooms',
      gradient: 'from-green-500 to-green-600'
    },
    {
      title: "Guest Services",
      description: "Handle guest requests and services",
      icon: ClipboardList,
      href: '/reception/services',
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      title: "Incident Reporting",
      description: "Report and manage security incidents",
      icon: AlertTriangle,
      href: '/reception/incidents',
      gradient: 'from-red-500 to-red-600'
    },
    {
      title: "Housekeeping",
      description: "Coordinate housekeeping tasks",
      icon: Sparkles,
      href: '/reception/housekeeping',
      gradient: 'from-cyan-500 to-cyan-600'
    },
    {
      title: "Key Card Management",
      description: "Manage room key cards and access",
      icon: KeyRound,
      href: '/reception/key-cards',
      gradient: 'from-orange-500 to-orange-600'
    },
    {
      title: "Maintenance Requests",
      description: "Track facility maintenance issues",
      icon: Wrench,
      href: '/reception/maintenance',
      gradient: 'from-amber-500 to-amber-600'
    },
    {
      title: "Lost & Found",
      description: "Manage lost and found items",
      icon: Search,
      href: '/reception/lost-found',
      gradient: 'from-pink-500 to-pink-600'
    },
    {
      title: "Review Management",
      description: "Send review requests to guests",
      icon: Star,
      href: '/reception/reviews',
      gradient: 'from-yellow-500 to-yellow-600'
    }
  ];

  if (error) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Error loading dashboard: {error}</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        {/* Card Reader Service Status Banner */}
        {bridgeServiceStatus.available === false && (
          <Alert className="mb-6 border-orange-500 bg-orange-50 dark:bg-orange-950">
            <KeyRound className="h-4 w-4" />
            <AlertTitle>Card Reader Service Not Running</AlertTitle>
            <AlertDescription className="mt-2">
              <p className="mb-3">
                The card reader bridge service is required for programming key cards. 
                Please start the service to enable card programming features.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkServiceStatus}
                  disabled={bridgeServiceStatus.checking}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${bridgeServiceStatus.checking ? 'animate-spin' : ''}`} />
                  {bridgeServiceStatus.checking ? 'Checking...' : 'Check Again'}
                </Button>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <span>To start the service, run:</span>
                  <code className="px-2 py-1 bg-muted rounded text-xs">
                    cd services/card-reader-bridge && bun start
                  </code>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {bridgeServiceStatus.available === true && (
          <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800 dark:text-green-200">
              Card Reader Service Running
            </AlertTitle>
            <AlertDescription className="text-green-700 dark:text-green-300">
              {bridgeServiceStatus.readerConnected 
                ? 'Card reader is connected and ready for programming.'
                : 'Service is running, but card reader is not connected. Please check USB connection.'}
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-6 text-foreground">{t('quick_actions', 'Quick Actions')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href}>
                  <Card className="group hover:shadow-lg transition-all duration-300 border-border hover:border-primary/20 cursor-pointer">
                    <CardHeader>
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${item.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground">
                        {item.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        {item.title}
                      </Button>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
