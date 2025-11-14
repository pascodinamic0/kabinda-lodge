import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, ClipboardList } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import OrderCard from '@/components/orders/OrderCard';
import OrderStatusCards from '@/components/orders/OrderStatusCards';
import { Order } from '@/types/order';

export default function OrderApproval() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (name, price)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const confirmedOrders = orders.filter(order => order.status === 'confirmed');
  const completedOrders = orders.filter(order => order.status === 'completed');
  const cancelledOrders = orders.filter(order => order.status === 'cancelled');

  if (loading) {
    return (
      <DashboardLayout title="Order Management" subtitle="Review and approve restaurant orders">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Order Management" subtitle="Review and approve restaurant orders">
      <div className="space-y-6 p-6">
        {/* Actions Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold">Restaurant Orders</h1>
          </div>
          <Button onClick={fetchOrders} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Status Overview Cards */}
        <OrderStatusCards orders={orders} />

        {/* Orders Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pending" className="relative">
              Pending
              {pendingOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="confirmed">Confirmed ({confirmedOrders.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedOrders.length})</TabsTrigger>
            <TabsTrigger value="cancelled">Cancelled ({cancelledOrders.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-6">
            {pendingOrders.length === 0 ? (
              <Card className="bg-gradient-to-br from-muted/50 to-background border-dashed">
                <CardContent className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No pending orders</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    All orders have been processed or no new orders have been placed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={fetchOrders} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="confirmed" className="space-y-4 mt-6">
            {confirmedOrders.length === 0 ? (
              <Card className="bg-gradient-to-br from-muted/50 to-background border-dashed">
                <CardContent className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No confirmed orders</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Orders will appear here once they are confirmed for preparation.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {confirmedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={fetchOrders} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-6">
            {completedOrders.length === 0 ? (
              <Card className="bg-gradient-to-br from-muted/50 to-background border-dashed">
                <CardContent className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No completed orders</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Completed orders will be displayed here for review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={fetchOrders} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="cancelled" className="space-y-4 mt-6">
            {cancelledOrders.length === 0 ? (
              <Card className="bg-gradient-to-br from-muted/50 to-background border-dashed">
                <CardContent className="text-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No cancelled orders</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Orders that were declined will appear here for reference.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {cancelledOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onStatusUpdate={fetchOrders} showActions={false} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}