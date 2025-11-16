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
  TrendingDown,
  AlertTriangle,
  Shield,
  Database,
  BedDouble,
  LogIn,
  LogOut,
  Clock
} from 'lucide-react';

type RevenueRangeOption = 'all' | 'today' | '7d' | '30d';

const revenueRangeLabels: Record<RevenueRangeOption, string> = {
  all: 'Total Revenue (All Time)',
  today: 'Revenue (Today)',
  '7d': 'Revenue (Last 7 Days)',
  '30d': 'Revenue (Last 30 Days)'
};

const revenueRangeShortLabels: Record<RevenueRangeOption, string> = {
  all: 'All Time',
  today: 'Today',
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days'
};

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const [revenueRange, setRevenueRange] = useState<RevenueRangeOption>('today');
  const [isChangingRange, setIsChangingRange] = useState(false);
  const superAdminStats = useSuperAdminStats({ revenueRange });
  const [extendedStats, setExtendedStats] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    todayCheckIns: 0,
    todayCheckOuts: 0,
    pendingBookings: 0,
    activeBookings: 0,
    todayOrders: 0,
    totalTables: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExtendedStats();
  }, []);

  // Track when revenue range changes and stats are loading
  useEffect(() => {
    if (superAdminStats.loading) {
      setIsChangingRange(true);
    } else {
      setIsChangingRange(false);
    }
  }, [superAdminStats.loading]);

  const loadExtendedStats = async () => {
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const todayDateString = todayStart.toLocaleDateString('en-CA'); // YYYY-MM-DD format

      // Load rooms data
      const { count: roomsCount } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true });

      // Get occupied rooms (current bookings)
      const { data: currentBookings } = await supabase
        .from('bookings')
        .select('room_id')
        .in('status', ['booked', 'confirmed', 'checked_in'])
        .lte('start_date', todayDateString)
        .gte('end_date', todayDateString);

      const occupiedRooms = new Set(currentBookings?.map(b => b.room_id)).size;
      const availableRooms = (roomsCount || 0) - occupiedRooms;

      // Get today's check-ins
      // @ts-ignore - Type instantiation depth issue with Supabase query builder
      const checkInsResponse = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('start_date', todayDateString)
        .in('status', ['booked', 'confirmed', 'pending_payment']);
      const checkInsCount = checkInsResponse.count;

      // Get today's check-outs
      // @ts-ignore - Type instantiation depth issue with Supabase query builder
      const checkOutsResponse = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('end_date', todayDateString)
        .in('status', ['checked_in', 'booked', 'confirmed']);
      const checkOutsCount = checkOutsResponse.count;

      // Get pending bookings (not confirmed)
      const { count: pendingCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
        .gte('end_date', todayDateString);

      // Get active bookings
      const { count: activeCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('status', ['booked', 'confirmed', 'checked_in'])
        .gte('end_date', todayDateString);

      // Get today's orders
      const { count: todayOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString())
        .lt('created_at', todayEnd.toISOString());

      // Get total tables
      const { count: tablesCount } = await supabase
        .from('restaurant_tables')
        .select('*', { count: 'exact', head: true });

      setExtendedStats({
        totalRooms: roomsCount || 0,
        occupiedRooms,
        availableRooms,
        todayCheckIns: checkInsCount || 0,
        todayCheckOuts: checkOutsCount || 0,
        pendingBookings: pendingCount || 0,
        activeBookings: activeCount || 0,
        todayOrders: todayOrdersCount || 0,
        totalTables: tablesCount || 0
      });
    } catch (error) {
      console.error('Error loading extended stats:', error);
    } finally {
      setLoading(false);
    }
  };



  // Calculate month-over-month growth
  const monthGrowth = superAdminStats.lastMonthRevenue > 0
    ? ((superAdminStats.monthRevenue - superAdminStats.lastMonthRevenue) / superAdminStats.lastMonthRevenue) * 100
    : 0;

  // Filtered Revenue Card (affected by revenue range selector)
  const filteredRevenueCard = {
    title: revenueRangeLabels[revenueRange],
    value: `$${superAdminStats.totalRevenue.toFixed(2)}`,
    subtitle: `Filtered by: ${revenueRangeShortLabels[revenueRange]}`,
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    isFiltered: true,
    loading: isChangingRange
  };

  // Static metrics cards (NOT affected by revenue range selector)
  const currentStateCards = [
    {
      title: 'Current Occupancy',
      value: `${extendedStats.occupiedRooms}/${extendedStats.totalRooms}`,
      subtitle: 'rooms occupied',
      icon: BedDouble,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      priority: 1
    },
    {
      title: 'Available Rooms',
      value: extendedStats.availableRooms,
      icon: Hotel,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      priority: 1
    },
    {
      title: 'This Month',
      value: `$${superAdminStats.monthRevenue.toFixed(2)}`,
      subtitle: monthGrowth !== 0 ? `${monthGrowth > 0 ? '+' : ''}${monthGrowth.toFixed(1)}% vs last month` : '',
      icon: monthGrowth >= 0 ? TrendingUp : TrendingDown,
      color: monthGrowth >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: monthGrowth >= 0 ? 'bg-green-50' : 'bg-red-50',
      priority: 1
    }
  ];

  // Today's operational metrics
  const todayOperationsCards = [
    {
      title: "Today's Revenue",
      value: `$${superAdminStats.todayRevenue.toFixed(2)}`,
      subtitle: 'actual earnings today',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      priority: 2
    },
    {
      title: "Today's Check-ins",
      value: extendedStats.todayCheckIns,
      icon: LogIn,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      priority: 2
    },
    {
      title: "Today's Check-outs",
      value: extendedStats.todayCheckOuts,
      icon: LogOut,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      priority: 2
    },
    {
      title: 'Pending Bookings',
      value: extendedStats.pendingBookings,
      subtitle: 'awaiting confirmation',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      priority: 2,
      alert: extendedStats.pendingBookings > 0
    },
    {
      title: "Today's Orders",
      value: extendedStats.todayOrders,
      icon: UtensilsCrossed,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      priority: 2
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
            <p className="text-muted-foreground">Real-time operational overview</p>
            <div className="flex items-center gap-2">
              <label htmlFor="revenue-range" className="text-sm text-muted-foreground font-medium">
                Revenue Filter:
              </label>
              <select
                id="revenue-range"
                className="border rounded-md px-3 py-1.5 text-sm bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                value={revenueRange}
                onChange={(e) => setRevenueRange(e.target.value as RevenueRangeOption)}
                disabled={isChangingRange}
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
          
          {/* Priority Statistics Cards */}
          <div className="space-y-6">
            {/* Filtered Revenue Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Filtered Revenue
                </h3>
                <Badge variant="outline" className="text-xs">
                  Changes with filter
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Filtered Revenue Card */}
                <Card className={`${filteredRevenueCard.bgColor} border-2 ${isChangingRange ? 'border-blue-400' : 'border-green-500'} relative transition-all duration-300`}>
                  {isChangingRange && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-lg z-10">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                        <span>Updating...</span>
                      </div>
                    </div>
                  )}
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600">{filteredRevenueCard.title}</p>
                        <p className={`text-2xl font-bold ${filteredRevenueCard.color} mt-1`}>
                          {filteredRevenueCard.value}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{filteredRevenueCard.subtitle}</p>
                      </div>
                      <div className={`p-3 rounded-full ${filteredRevenueCard.bgColor}`}>
                        <filteredRevenueCard.icon className={`h-6 w-6 ${filteredRevenueCard.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current State Cards */}
                {currentStateCards.map((stat, index) => (
                  <Card key={index} className={`${stat.bgColor} border-0 relative`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                          {stat.subtitle && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              {stat.subtitle}
                            </p>
                          )}
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

            {/* Today's Operations Section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  Today's Operations
                </h3>
                <Badge variant="outline" className="text-xs">
                  Live Data
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                {todayOperationsCards.map((stat, index) => (
                  <Card key={index} className={`${stat.bgColor} border-0 relative`}>
                    {stat.alert && (
                      <div className="absolute top-2 right-2">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                        </span>
                      </div>
                    )}
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
                          {stat.subtitle && (
                            <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                          )}
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
          </div>
        </div>
      </DashboardLayout>
  );
}