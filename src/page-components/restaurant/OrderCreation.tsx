
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus, CheckCircle } from 'lucide-react';
import TableSelection from '@/components/restaurant/TableSelection';
import MenuItemsList from '@/components/restaurant/MenuItemsList';
import OrderSummary from '@/components/restaurant/OrderSummary';
import PaymentStep from '@/components/restaurant/PaymentStep';
import ConfirmationStep from '@/components/restaurant/ConfirmationStep';
import { MenuItem, RestaurantTable } from '@/types/restaurant';

interface OrderItem {
  menu_item_id: number;
  menu_item: MenuItem;
  quantity: number;
  notes?: string;
}

export default function OrderCreation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: order creation, 2: payment, 3: confirmation
  const [createdOrderId, setCreatedOrderId] = useState<number | null>(null);

  // Fetch menu items on component mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      console.log('Fetching menu items for order creation...');
      
      // First, let's fetch all available menu items without restaurant filter to debug
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (error) throw error;
      
      console.log('Menu items fetched:', data?.length || 0, 'items');
      console.log('Menu items data:', data);
      
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Prefill order from Restaurant page cart (if available)
  useEffect(() => {
    const PENDING_ORDER_KEY = 'restaurant_pending_order';
    try {
      if (menuItems.length === 0) return;
      const stored = localStorage.getItem(PENDING_ORDER_KEY);
      if (!stored) return;
      const payload: { menu_item_id: number; quantity: number }[] = JSON.parse(stored);
      const prefilled: OrderItem[] = [];

      payload.forEach(({ menu_item_id, quantity }) => {
        const found = menuItems.find(mi => mi.id === menu_item_id);
        if (found) {
          prefilled.push({ menu_item_id, menu_item: found, quantity, notes: '' });
        }
      });

      if (prefilled.length > 0) {
        setOrderItems(prefilled);
      }

      localStorage.removeItem(PENDING_ORDER_KEY);
    } catch (e) {
      console.warn('Failed to prefill order from pending cart');
    }
  }, [menuItems]);
  const addToOrder = (menuItem: MenuItem, quantity = 1) => {
    setOrderItems(prev => {
      const existingItem = prev.find(item => item.menu_item_id === menuItem.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.menu_item_id === menuItem.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        return [...prev, {
          menu_item_id: menuItem.id,
          menu_item: menuItem,
          quantity,
          notes: ''
        }];
      }
    });
  };

  const updateQuantity = (menuItemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromOrder(menuItemId);
      return;
    }

    setOrderItems(prev =>
      prev.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeFromOrder = (menuItemId: number) => {
    setOrderItems(prev => prev.filter(item => item.menu_item_id !== menuItemId));
  };

  const updateNotes = (menuItemId: number, notes: string) => {
    setOrderItems(prev =>
      prev.map(item =>
        item.menu_item_id === menuItemId
          ? { ...item, notes }
          : item
      )
    );
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.menu_item.price * item.quantity);
    }, 0);
  };

  const generateTrackingNumber = () => {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  };

  const printOrder = (orderData: { tracking_number: string }) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const orderItemsList = orderItems.map(item => 
      `${item.quantity}x ${item.menu_item.name} - $${(item.menu_item.price * item.quantity).toFixed(2)}${item.notes ? ` (${item.notes})` : ''}`
    ).join('\n');

    const printContent = `
      <html>
        <head>
          <title>Restaurant Order - ${orderData.tracking_number}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .order-info { margin-bottom: 20px; }
            .items { margin: 20px 0; }
            .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Restaurant Order</h1>
            <h2>Order #${orderData.tracking_number}</h2>
          </div>
          
          <div class="order-info">
            <p><strong>Table:</strong> ${selectedTable?.table_number}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            <p><strong>Payment Method:</strong> Cash</p>
            <p><strong>Status:</strong> Confirmed</p>
          </div>
          
          <div class="items">
            <h3>Order Items:</h3>
            <pre>${orderItemsList}</pre>
          </div>
          
          <div class="total">
            <p>Total: $${calculateTotal().toFixed(2)}</p>
          </div>
          
          <div class="footer">
            <p>Thank you for your order!</p>
            <p>Please keep this receipt for your records.</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const submitOrder = async () => {
    if (!selectedTable) {
      toast({
        title: "Error",
        description: "Please select a table",
        variant: "destructive"
      });
      return;
    }

    if (orderItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add items to your order",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);

    try {
      const trackingNumber = generateTrackingNumber();
      const totalPrice = calculateTotal();

      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          tracking_number: trackingNumber,
          table_number: parseInt(selectedTable.table_number),
          waiter_id: user?.id,
          total_price: totalPrice,
          payment_method: paymentMethod,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItemsData = orderItems.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        notes: item.notes || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsData);

      if (itemsError) throw itemsError;

      // Update table status to occupied
      await supabase
        .from('restaurant_tables')
        .update({ status: 'occupied' })
        .eq('id', selectedTable.id);

      setCreatedOrderId(orderData.id);

      // Handle different payment methods
      if (paymentMethod === 'cash') {
        // For cash orders, confirm immediately and print
        await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', orderData.id);

        // Create payment record
        await supabase
          .from('payments')
          .insert({
            order_id: orderData.id,
            amount: totalPrice,
            method: 'cash',
            transaction_ref: `CASH-${Date.now()}`,
            status: 'completed'
          });

        toast({
          title: "Success",
          description: `Order ${trackingNumber} created and confirmed! Printing receipt...`,
        });

        // Print the order
        printOrder(orderData);

        // Reset form and go back to dashboard
        setTimeout(() => {
          setSelectedTable(null);
          setOrderItems([]);
          navigate('/kabinda-lodge/restaurant-dashboard');
        }, 2000);
      } else {
        // For card/mobile payments, go to payment step
        setStep(2);
        toast({
          title: "Order Created",
          description: `Order ${trackingNumber} created! Please complete payment.`,
        });
      }
      
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const submitPayment = async (paymentData: { transactionRef: string }) => {
    if (!createdOrderId) return;

    setSubmitting(true);
    try {
      // Create payment record
      await supabase
        .from('payments')
        .insert({
          order_id: createdOrderId,
          amount: calculateTotal(),
          method: paymentMethod,
          transaction_ref: paymentData.transactionRef,
          status: 'pending_verification'
        });

      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'pending' })
        .eq('id', createdOrderId);

      setStep(3);
      toast({
        title: "Payment Submitted",
        description: "Your payment is being verified. You'll receive confirmation shortly.",
      });
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast({
        title: "Error",
        description: "Failed to submit payment information",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Create New Order">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Create New Order">
      <div className="container mx-auto px-6 py-8">
        {/* Step Indicator */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Create New Order</h1>
          <div className="flex items-center gap-2">
            <Badge variant={step === 1 ? "default" : step > 1 ? "secondary" : "outline"}>
              1. Order Details
            </Badge>
            <Badge variant={step === 2 ? "default" : step > 2 ? "secondary" : "outline"}>
              2. Payment
            </Badge>
            <Badge variant={step === 3 ? "default" : "outline"}>
              3. Confirmation
            </Badge>
          </div>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Table Selection */}
            <div className="lg:col-span-1">
              <TableSelection
                selectedTable={selectedTable}
                onTableSelect={setSelectedTable}
              />
            </div>

            {/* Menu Items */}
            <div className="lg:col-span-1">
              <MenuItemsList
                menuItems={menuItems}
                onAddToOrder={addToOrder}
              />
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <OrderSummary
                orderItems={orderItems}
                selectedTable={selectedTable}
                paymentMethod={paymentMethod}
                onUpdateQuantity={updateQuantity}
                onRemoveItem={removeFromOrder}
                onUpdateNotes={updateNotes}
                onPaymentMethodChange={setPaymentMethod}
                onSubmitOrder={submitOrder}
                calculateTotal={calculateTotal}
                submitting={submitting}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <PaymentStep 
            paymentMethod={paymentMethod}
            totalAmount={calculateTotal()}
            onSubmitPayment={submitPayment}
            onBack={() => setStep(1)}
            submitting={submitting}
          />
        )}

        {step === 3 && (
          <ConfirmationStep 
            orderId={createdOrderId}
            paymentMethod={paymentMethod}
            onNewOrder={() => {
              setStep(1);
              setSelectedTable(null);
              setOrderItems([]);
              setCreatedOrderId(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
