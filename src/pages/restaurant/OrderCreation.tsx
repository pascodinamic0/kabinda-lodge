
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Plus, Minus, CheckCircle } from 'lucide-react';
import TableSelection from '@/components/restaurant/TableSelection';
import MenuItemsList from '@/components/restaurant/MenuItemsList';
import OrderSummary from '@/components/restaurant/OrderSummary';
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

  // Fetch menu items on component mount
  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category', { ascending: true });

      if (error) throw error;
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

      toast({
        title: "Success",
        description: `Order ${trackingNumber} created successfully!`,
      });

      // Reset form
      setSelectedTable(null);
      setOrderItems([]);
      
      // Navigate back to dashboard
      navigate('/restaurant-dashboard');
      
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
      </div>
    </DashboardLayout>
  );
}
