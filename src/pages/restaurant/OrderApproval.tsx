import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, RefreshCw, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OrderCard from '@/components/orders/OrderCard';

interface Order {
  id: number;
  tracking_number: string;
  status: string;
  table_number: number | null;
  total_price: number;
  created_at: string;
  order_items: any[];
}

export default function RestaurantOrderApproval() {
  const navigate = useNavigate();
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

  const printOrder = (order: Order) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Kitchen Order - ${order.tracking_number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .order-info { margin-bottom: 15px; }
              .items { margin-top: 15px; }
              .item { margin: 5px 0; }
              .notes { font-style: italic; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>KITCHEN ORDER</h2>
              <h3>Order #${order.tracking_number}</h3>
            </div>
            <div class="order-info">
              <p><strong>Table:</strong> ${order.table_number || 'N/A'}</p>
              <p><strong>Time:</strong> ${new Date(order.created_at).toLocaleString()}</p>
              <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
            </div>
            <div class="items">
              <h4>Items:</h4>
              ${order.order_items?.map(item => `
                <div class="item">
                  <strong>${item.quantity}x ${item.menu_items?.name || 'Unknown Item'}</strong>
                  ${item.notes ? `<div class="notes">Note: ${item.notes}</div>` : ''}
                </div>
              `).join('')}
            </div>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
    }
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const approvedOrders = orders.filter(order => order.status === 'approved');
  const activeOrders = orders.filter(order => ['approved', 'pending'].includes(order.status));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/restaurant')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Kitchen Orders</h1>
                <p className="text-muted-foreground">Manage and prepare restaurant orders</p>
              </div>
            </div>
            <Button onClick={fetchOrders} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="relative">
              Active Orders
              {activeOrders.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeOrders.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="pending">
              Pending Approval ({pendingOrders.length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Ready to Cook ({approvedOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {activeOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No active orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeOrders.map((order) => (
                  <div key={order.id} className="relative">
                    <OrderCard order={order} onStatusUpdate={fetchOrders} />
                    <Button
                      onClick={() => printOrder(order)}
                      className="absolute top-4 right-4"
                      size="sm"
                      variant="outline"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No pending orders</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="relative">
                    <OrderCard order={order} onStatusUpdate={fetchOrders} />
                    <Button
                      onClick={() => printOrder(order)}
                      className="absolute top-4 right-4"
                      size="sm"
                      variant="outline"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedOrders.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">No orders ready to cook</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {approvedOrders.map((order) => (
                  <div key={order.id} className="relative">
                    <OrderCard order={order} onStatusUpdate={fetchOrders} />
                    <Button
                      onClick={() => printOrder(order)}
                      className="absolute top-4 right-4"
                      size="sm"
                      variant="outline"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}