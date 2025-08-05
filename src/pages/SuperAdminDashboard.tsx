import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Hotel, 
  UtensilsCrossed, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Shield
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalRooms: number;
  totalBookings: number;
  totalRevenue: number;
  totalOrders: number;
  totalTables: number;
}

export default function SuperAdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalRooms: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalOrders: 0,
    totalTables: 0
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Load all stats in parallel
      const [
        { count: usersCount },
        { count: roomsCount },
        { count: bookingsCount },
        { count: ordersCount },
        { count: tablesCount },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('rooms').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurant_tables').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_price')
      ]);

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalRooms: roomsCount || 0,
        totalBookings: bookingsCount || 0,
        totalRevenue,
        totalOrders: ordersCount || 0,
        totalTables: tablesCount || 0
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  

  const statCards = [
    {
      title: t('dashboard.total_users', 'Total Users'),
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: t('dashboard.total_rooms', 'Total Rooms'),
      value: stats.totalRooms,
      icon: Hotel,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: t('dashboard.total_bookings', 'Active Bookings'),
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: t('dashboard.total_revenue', 'Total Revenue'),
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: t('dashboard.pending_orders', 'Restaurant Orders'),
      value: stats.totalOrders,
      icon: UtensilsCrossed,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: t('dashboard.available_tables', 'Restaurant Tables'),
      value: stats.totalTables,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Super Admin Dashboard">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Super Admin Dashboard">
      <div className="container mx-auto px-6 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className={`${stat.bgColor} border-0`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Super Admin Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('system.overview', 'System Overview')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('system.status', 'Database Status')}</span>
                  <Badge variant="outline" className="text-green-600 border-green-300">
                    {t('system.operational', 'Operational')}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('system.last_reset', 'Last Reset')}</span>
                  <span className="text-sm text-gray-900">{t('system.never', 'Never')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{t('system.version', 'System Version')}</span>
                  <span className="text-sm text-gray-900">v1.0.0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                {t('system.important_notes', 'Important Notes')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• {t('system.reset_usage', 'Use the database reset feature only when starting operations')}</p>
                <p>• {t('system.data_cleared', 'All operational data will be cleared but system configuration preserved')}</p>
                <p>• {t('system.irreversible', 'This action is irreversible and requires confirmation')}</p>
                <p>• {t('system.backup', 'Consider backing up data before reset if needed')}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}