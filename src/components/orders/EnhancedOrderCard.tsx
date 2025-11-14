import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Clock, 
  Users, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Printer,
  CreditCard,
  Banknote,
  Smartphone,
  ChefHat
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface EnhancedOrderCardProps {
  order: Order;
  onStatusUpdate?: () => void;
  showKitchenActions?: boolean;
}

export default function EnhancedOrderCard({ 
  order, 
  onStatusUpdate,
  showKitchenActions = false 
}: EnhancedOrderCardProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(order.status);
  const [kitchenNotes, setKitchenNotes] = useState(order.kitchen_notes || '');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
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
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'preparing':
        return <ChefHat className="h-4 w-4" />;
      case 'ready':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <Banknote className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'mobile_money':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const updateOrderStatus = async () => {
    if (newStatus === order.status && kitchenNotes === order.kitchen_notes) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          status: newStatus,
          kitchen_notes: kitchenNotes || null,
          ...(newStatus === 'ready' && !order.estimated_completion_time 
            ? { estimated_completion_time: new Date().toISOString() }
            : {})
        })
        .eq('id', order.id);

      if (error) throw error;

      // Add status history entry
      await supabase
        .from('order_status_history')
        .insert({
          order_id: order.id,
          status: newStatus,
          notes: `Status updated${kitchenNotes ? ` with notes: ${kitchenNotes}` : ''}`
        });

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      onStatusUpdate?.();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const sendToKitchen = async () => {
    try {
      setIsUpdating(true);
      
      const { error } = await supabase.functions.invoke('kitchen-printer', {
        body: {
          orderId: order.id,
          printerIds: ['kitchen-main'] // This would come from table configuration
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order sent to kitchen printer",
      });

      // Update status to confirmed
      setNewStatus('confirmed');
      await updateOrderStatus();
    } catch (error) {
      console.error('Error sending to kitchen:', error);
      toast({
        title: "Error",
        description: "Failed to send order to kitchen",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{order.tracking_number}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {order.table_number ? `Table ${order.table_number}` : 'Takeaway'}
              <span>•</span>
              <span>{new Date(order.created_at).toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(order.status)}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Items */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Items:</h4>
          <div className="space-y-1">
            {order.order_items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.menu_items?.name}
                  {item.notes && <span className="text-muted-foreground"> ({item.notes})</span>}
                </span>
                <span>${((item.menu_items?.price || 0) * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Payment & Total */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm">
            {getPaymentMethodIcon(order.payment_method || 'cash')}
            <span className="capitalize">{order.payment_method || 'Cash'}</span>
          </div>
          <div className="font-semibold">
            Total: ${order.total_price.toFixed(2)}
          </div>
        </div>

        {showKitchenActions && (
          <>
            <Separator />
            
            {/* Kitchen Actions */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="status" className="text-sm">Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="preparing">Preparing</SelectItem>
                      <SelectItem value="ready">Ready</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="kitchen-notes" className="text-sm">Kitchen Notes</Label>
                <Textarea
                  id="kitchen-notes"
                  placeholder="Add notes for the kitchen..."
                  value={kitchenNotes}
                  onChange={(e) => setKitchenNotes(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex gap-2">
                {order.status === 'pending' && (
                  <Button
                    onClick={sendToKitchen}
                    disabled={isUpdating}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    Send to Kitchen
                  </Button>
                )}
                
                <Button
                  onClick={updateOrderStatus}
                  disabled={isUpdating || (newStatus === order.status && kitchenNotes === order.kitchen_notes)}
                  size="sm"
                  className="flex-1"
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}