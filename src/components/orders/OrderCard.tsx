import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, XCircle, Clock, DollarSign, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Order } from '@/types/order';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: () => void;
  showActions?: boolean;
}

export default function OrderCard({ order, onStatusUpdate, showActions = true }: OrderCardProps) {
  const { toast } = useToast();

  const updateOrderStatus = async (newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Order ${newStatus} successfully`,
      });

      onStatusUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500';
      case 'approved':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.tracking_number}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
              {order.table_number && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  Table {order.table_number}
                </div>
              )}
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                ${order.total_price.toFixed(2)}
              </div>
              <span>{new Date(order.created_at).toLocaleString()}</span>
            </div>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-white flex items-center gap-1`}>
            {getStatusIcon(order.status)}
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Order Items:</h4>
          {order.order_items?.map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <span className="font-medium">{item.menu_items?.name || 'Unknown Item'}</span>
                <span className="text-muted-foreground ml-2">x{item.quantity}</span>
                {item.notes && (
                  <p className="text-xs text-muted-foreground mt-1">Note: {item.notes}</p>
                )}
              </div>
              <span className="font-semibold">
                ${((item.menu_items?.price || 0) * item.quantity).toFixed(2)}
              </span>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex justify-between items-center font-semibold">
            <span>Total:</span>
            <span>${order.total_price.toFixed(2)}</span>
          </div>

          {showActions && order.status === 'pending' && (
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={() => updateOrderStatus('approved')} 
                className="flex-1"
                variant="default"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button 
                onClick={() => updateOrderStatus('rejected')} 
                className="flex-1"
                variant="destructive"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}

          {showActions && order.status === 'approved' && (
            <Button 
              onClick={() => updateOrderStatus('completed')} 
              className="w-full"
              variant="outline"
            >
              Mark as Completed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}