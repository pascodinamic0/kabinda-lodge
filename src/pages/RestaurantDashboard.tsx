
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShoppingCart, 
  UtensilsCrossed, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Users
} from 'lucide-react';

interface DashboardStats {
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  activeMenuItems: number;
}

export default function RestaurantDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    pendingOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    activeMenuItems: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Fetch orders statistics
      const { data: orders } = await supabase
        .from('orders')
        .select('status, total_price, created_at');

      if (orders) {
        const pendingOrders = orders.filter(order => order.status === 'pending').length;
        const completedOrders = orders.filter(order => order.status === 'completed').length;
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0);

        setStats(prev => ({
          ...prev,
          pendingOrders,
          completedOrders,
          totalRevenue
        }));
      }

      // Fetch menu items count
      const { data: menuItems } = await supabase
        .from('menu_items')
        .select('id')
        .eq('is_available', true);

      if (menuItems) {
        setStats(prev => ({ ...prev, activeMenuItems: menuItems.length }));
      }

      // Fetch recent orders
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
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
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

  const statCards = [
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Completed Orders',
      value: stats.completedOrders,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-blue-600'
    },
    {
      title: 'Menu Items',
      value: stats.activeMenuItems,
      icon: UtensilsCrossed,
      color: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Restaurant Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Restaurant Dashboard">
      <div className="container mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">
                        {stat.value}
                      </p>
                    </div>
                    <IconComponent className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-6">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link to="/restaurant/order">
                <ShoppingCart className="h-4 w-4 mr-2" />
                New Order
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/restaurant/orders">
                <CheckCircle className="h-4 w-4 mr-2" />
                Manage Orders
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/admin/menu">
                <UtensilsCrossed className="h-4 w-4 mr-2" />
                Update Menu
              </Link>
            </Button>
          </div>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-gray-500">No recent orders</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between items-center p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{order.tracking_number}</div>
                      <div className="text-sm text-gray-600">
                        Table {order.table_number} • {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">${Number(order.total_price).toFixed(2)}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
