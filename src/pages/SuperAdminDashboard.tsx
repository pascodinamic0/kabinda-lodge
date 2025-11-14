import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, 
  Hotel, 
  UtensilsCrossed, 
  Calendar, 
  DollarSign, 
  TrendingUp,
  AlertTriangle,
  Shield,
  Database
} from 'lucide-react';

type RevenueRangeOption = 'all' | 'today' | '7d' | '30d';

const revenueRangeLabels: Record<RevenueRangeOption, string> = {
  all: 'Total Revenue (All Time)',
  today: 'Revenue (Today)',
  '7d': 'Revenue (Last 7 Days)',
  '30d': 'Revenue (Last 30 Days)'
};

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [revenueRange, setRevenueRange] = useState<RevenueRangeOption>('all');
  const superAdminStats = useSuperAdminStats({ revenueRange });
  const [extendedStats, setExtendedStats] = useState({
    totalRooms: 0,
    totalBookings: 0,
    totalOrders: 0,
    totalTables: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExtendedStats();
  }, []);

  const loadExtendedStats = async () => {
    try {
      // Load additional stats that aren't in the useSuperAdminStats hook
      const [
        { count: roomsCount },
        { count: bookingsCount },
        { count: ordersCount },
        { count: tablesCount }
      ] = await Promise.all([
        supabase.from('rooms').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('restaurant_tables').select('*', { count: 'exact', head: true })
      ]);

      setExtendedStats({
        totalRooms: roomsCount || 0,
        totalBookings: bookingsCount || 0,
        totalOrders: ordersCount || 0,
        totalTables: tablesCount || 0
      });
    } catch (error) {
      console.error('Error loading extended stats:', error);
    } finally {
      setLoading(false);
    }
  };



  const statCards = [
    {
      title: 'Total Users',
      value: superAdminStats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Admin Users',
      value: superAdminStats.totalAdmins,
      icon: Shield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Total Rooms',
      value: extendedStats.totalRooms,
      icon: Hotel,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Restaurant Tables',
      value: extendedStats.totalTables,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Active Bookings',
      value: extendedStats.totalBookings,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Restaurant Orders',
      value: extendedStats.totalOrders,
      icon: UtensilsCrossed,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: revenueRangeLabels[revenueRange],
      value: `$${superAdminStats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'System Tables',
      value: superAdminStats.systemTables,
      icon: Database,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  if (loading || superAdminStats.loading) {
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
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">Organization-wide overview</p>
            <div className="flex items-center gap-2">
              <label htmlFor="revenue-range" className="text-sm text-muted-foreground">Revenue range</label>
              <select
                id="revenue-range"
                className="border rounded-md px-2 py-1 text-sm bg-background"
                value={revenueRange}
                onChange={(e) => setRevenueRange(e.target.value as RevenueRangeOption)}
                aria-label="Select revenue range"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>
          </div>
          {superAdminStats.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="h-5 w-5" />
                <p>Error loading statistics: {superAdminStats.error}</p>
              </div>
            </div>
          )}
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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



      </div>
    </DashboardLayout>
  );
}