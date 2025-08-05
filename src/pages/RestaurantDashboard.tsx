
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  UtensilsCrossed, 
  Clock, 
  Users,
  Table,
  Gift,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import TableStatusManager from '@/components/restaurant/TableStatusManager';

interface DashboardStats {
  pendingOrders: number;
  activeMenuItems: number;
  availableTables: number;
  occupiedTables: number;
  totalRevenue: number;
  averageOrderValue: number;
}

interface ActivePromotion {
  id: number;
  title: string;
  description: string | null;
  discount_percent: number;
}

interface RecentOrder {
  id: number;
  tracking_number: string;
  status: string;
  total_price: number;
  table_number: string;
  created_at: string;
}

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats>({
    pendingOrders: 0,
    activeMenuItems: 0,
    availableTables: 0,
    occupiedTables: 0,
    totalRevenue: 0,
    averageOrderValue: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [activePromotion, setActivePromotion] = useState<ActivePromotion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    setupRealtimeSubscriptions();
  }, []);

  const setupRealtimeSubscriptions = () => {
    // Set up real-time subscription for restaurant tables
    const tablesChannel = supabase
      .channel('restaurant-tables-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables'
        },
        () => {
          loadTableStats();
        }
      )
      .subscribe();

    // Set up real-time subscription for orders
    const ordersChannel = supabase
      .channel('orders-dashboard')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          loadDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tablesChannel);
      supabase.removeChannel(ordersChannel);
    };
  };

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadOrderStats(),
        loadMenuStats(),
        loadTableStats(),
        loadRecentOrders(),
        loadActivePromotion()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderStats = async () => {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('status, total_price, created_at');

      if (orders) {
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total_price || 0), 0);
        const averageOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

        setStats(prev => ({
          ...prev,
          pendingOrders,
          totalRevenue,
          averageOrderValue
        }));
      }
    } catch (error) {
      console.error('Error loading order stats:', error);
    }
  };

  const loadMenuStats = async () => {
    try {
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('id')
        .eq('is_available', true);

      if (menuItems) {
        setStats(prev => ({ ...prev, activeMenuItems: menuItems.length }));
      }
    } catch (error) {
      console.error('Error loading menu stats:', error);
    }
  };

  const loadTableStats = async () => {
    try {
      const { data: tables } = await supabase
        .from('restaurant_tables')
        .select('status');

      if (tables) {
        const availableTables = tables.filter(table => table.status === 'available').length;
        const occupiedTables = tables.filter(table => table.status === 'occupied').length;

        setStats(prev => ({
          ...prev,
          availableTables,
          occupiedTables
        }));
      }
    } catch (error) {
      console.error('Error loading table stats:', error);
    }
  };

  const loadRecentOrders = async () => {
    try {
      const { data: recent } = await supabase
        .from('orders')
        .select(`
          id,
          tracking_number,
          status,
          total_price,
          table_number,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recent) {
        setRecentOrders(recent);
      }
    } catch (error) {
      console.error('Error loading recent orders:', error);
    }
  };

  const loadActivePromotion = async () => {
    try {
      const { data: settingData, error: settingError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'receipt_promotion')
        .eq('category', 'restaurant')
        .maybeSingle();

      if (settingError && settingError.code !== 'PGRST116') throw settingError;

      if (settingData) {
        const setting = settingData.value as any;
        if (setting.enabled && setting.promotion_id) {
          const { data: promoData, error: promoError } = await supabase
            .from('promotions')
            .select('id, title, description, discount_percent')
            .eq('id', setting.promotion_id)
            .single();

          if (promoError) throw promoError;
          setActivePromotion(promoData);
        } else {
          setActivePromotion(null);
        }
      } else {
        setActivePromotion(null);
      }
    } catch (error) {
      console.error('Error loading active promotion:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'preparing':
        return 'bg-blue-100 text-blue-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'preparing':
        return <UtensilsCrossed className="h-4 w-4 text-blue-600" />;
      case 'ready':
        return <AlertCircle className="h-4 w-4 text-green-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const statCards = [
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: 'Orders awaiting preparation'
    },
    {
      title: 'Available Tables',
      value: stats.availableTables,
      icon: Table,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Tables ready for guests'
    },
    {
      title: 'Active Menu Items',
      value: stats.activeMenuItems,
      icon: UtensilsCrossed,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Items available for ordering'
    },
    {
      title: 'Today\'s Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Total revenue from orders'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title={t('restaurant.dashboard', 'Restaurant Dashboard')}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('restaurant.dashboard', 'Restaurant Dashboard')}>
      <div className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Dashboard</h1>
          <p className="text-gray-600">Monitor orders, tables, and restaurant performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className={`${stat.bgColor} border-0 shadow-sm`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <IconComponent className={`h-8 w-8 ${stat.color}`} />
                    <Badge variant="secondary" className="text-xs">
                      {stat.description}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Table Management & Active Promotion */}
          <div className="lg:col-span-2 space-y-8">
            {/* Table Status Manager */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Table className="h-5 w-5" />
                  Table Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TableStatusManager />
              </CardContent>
            </Card>

            {/* Active Promotion */}
            {activePromotion && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-800">
                    <Gift className="h-5 w-5" />
                    Active Promotion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-green-900">{activePromotion.title}</h4>
                      {activePromotion.description && (
                        <p className="text-sm text-green-700 mt-1">{activePromotion.description}</p>
                      )}
                      <p className="text-sm text-green-600 mt-2">
                        {activePromotion.discount_percent}% discount • Shown on receipts
                      </p>
                    </div>
                    <Badge variant="outline" className="text-green-700 border-green-300">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Recent Orders */}
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No recent orders</p>
                    <p className="text-sm text-gray-400">Orders will appear here as they come in</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(order.status)}
                          <div>
                            <div className="font-medium text-sm">{order.tracking_number}</div>
                            <div className="text-xs text-gray-600">
                              Table {order.table_number} • {new Date(order.created_at).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">${Number(order.total_price).toFixed(2)}</div>
                          <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Average Order Value</span>
                  <span className="font-semibold">${stats.averageOrderValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Occupied Tables</span>
                  <span className="font-semibold">{stats.occupiedTables}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Table Utilization</span>
                  <span className="font-semibold">
                    {stats.availableTables + stats.occupiedTables > 0 
                      ? Math.round((stats.occupiedTables / (stats.availableTables + stats.occupiedTables)) * 100)
                      : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
