import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import EnhancedOrderCard from '@/components/orders/EnhancedOrderCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ChefHat, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Order {
  id: number;
  tracking_number: string;
  status: string;
  table_number?: number | null;
  total_price: number;
  payment_method?: string;
  kitchen_notes?: string;
  estimated_completion_time?: string;
  created_at: string;
  order_items: Array<{
    id: number;
    quantity: number;
    notes?: string;
    menu_items?: {
      name: string;
      price: number;
    };
  }>;
}

interface KitchenStats {
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  averageOrderTime: number;
}

export default function KitchenDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<KitchenStats>({
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    averageOrderTime: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for order updates
    const channel = supabase
      .channel('kitchen-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          console.log('Orders updated, refreshing...');
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setRefreshing(true);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            notes,
            menu_items (
              name,
              price
            )
          )
        `)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: true });

      if (error) throw error;

      setOrders(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateStats = (ordersData: Order[]) => {
    const pendingOrders = ordersData.filter(order => order.status === 'pending').length;
    const preparingOrders = ordersData.filter(order => 
      ['confirmed', 'preparing'].includes(order.status)
    ).length;
    const readyOrders = ordersData.filter(order => order.status === 'ready').length;

    // Calculate average order time for completed orders today
    const today = new Date().toDateString();
    const completedToday = ordersData.filter(order => 
      order.status === 'ready' && 
      order.estimated_completion_time &&
      new Date(order.created_at).toDateString() === today
    );

    let averageOrderTime = 0;
    if (completedToday.length > 0) {
      const totalTime = completedToday.reduce((sum, order) => {
        const start = new Date(order.created_at).getTime();
        const end = new Date(order.estimated_completion_time!).getTime();
        return sum + (end - start);
      }, 0);
      averageOrderTime = Math.round(totalTime / completedToday.length / 60000); // Convert to minutes
    }

    setStats({
      pendingOrders,
      preparingOrders,
      readyOrders,
      averageOrderTime
    });
  };

  const getOrdersByStatus = (status: string[]) => {
    return orders.filter(order => status.includes(order.status));
  };

  const statCards = [
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'In Preparation',
      value: stats.preparingOrders,
      icon: ChefHat,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Ready to Serve',
      value: stats.readyOrders,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Avg. Order Time',
      value: `${stats.averageOrderTime}m`,
      icon: AlertCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout title="Kitchen Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Kitchen Dashboard">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Kitchen Dashboard</h1>
            <p className="text-muted-foreground">Manage and track all kitchen orders</p>
          </div>
          <Button
            onClick={fetchOrders}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className={stat.bgColor}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} bg-white p-2 rounded-lg`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Orders Tabs */}
        <Tabs defaultValue="new" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new" className="relative">
              New Orders
              {stats.pendingOrders > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 px-2 py-1 text-xs">
                  {stats.pendingOrders}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing" className="relative">
              In Progress
              {stats.preparingOrders > 0 && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 px-2 py-1 text-xs">
                  {stats.preparingOrders}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="relative">
              Ready to Serve
              {stats.readyOrders > 0 && (
                <Badge variant="default" className="absolute -top-2 -right-2 px-2 py-1 text-xs">
                  {stats.readyOrders}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getOrdersByStatus(['pending']).map((order) => (
                <EnhancedOrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={fetchOrders}
                  showKitchenActions={true}
                />
              ))}
              {getOrdersByStatus(['pending']).length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No new orders to display
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preparing" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getOrdersByStatus(['confirmed', 'preparing']).map((order) => (
                <EnhancedOrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={fetchOrders}
                  showKitchenActions={true}
                />
              ))}
              {getOrdersByStatus(['confirmed', 'preparing']).length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No orders in preparation
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="ready" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getOrdersByStatus(['ready']).map((order) => (
                <EnhancedOrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={fetchOrders}
                  showKitchenActions={true}
                />
              ))}
              {getOrdersByStatus(['ready']).length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No orders ready to serve
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.map((order) => (
                <EnhancedOrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={fetchOrders}
                  showKitchenActions={true}
                />
              ))}
              {orders.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No orders to display
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}