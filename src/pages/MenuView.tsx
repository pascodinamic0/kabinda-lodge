import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Minus, ShoppingCart, ArrowLeft } from 'lucide-react';

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  is_available: boolean;
}

interface CartItem extends MenuItem {
  quantity: number;
  notes?: string;
}

const MenuView = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableNumber, setTableNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

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
      toast({
        title: "Error",
        description: "Failed to fetch menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.id === itemId);
      if (existingItem && existingItem.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prev.filter(cartItem => cartItem.id !== itemId);
    });
  };

  const updateCartItemNotes = (itemId: number, notes: string) => {
    setCart(prev =>
      prev.map(cartItem =>
        cartItem.id === itemId
          ? { ...cartItem, notes }
          : cartItem
      )
    );
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const generateTrackingNumber = () => {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  };

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Your cart is empty",
        variant: "destructive",
      });
      return;
    }

    if (!tableNumber) {
      toast({
        title: "Error", 
        description: "Please enter a table number",
        variant: "destructive",
      });
      return;
    }

    try {
      const trackingNumber = generateTrackingNumber();
      const totalPrice = getTotalPrice();

      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          tracking_number: trackingNumber,
          table_number: parseInt(tableNumber),
          total_price: totalPrice,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.id,
        quantity: item.quantity,
        notes: item.notes || null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Order Placed Successfully!",
        description: `Your order ${trackingNumber} has been placed. Please wait for confirmation.`,
      });

      // Clear cart and form
      setCart([]);
      setTableNumber('');
      setOrderNotes('');

      // Navigate back to dining page
      navigate('/dining');
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const categories = [...new Set(menuItems.map(item => item.category))];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading menu...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/dining')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dining
            </Button>
            <div>
              <h1 className="font-elegant text-3xl font-bold">Restaurant Menu</h1>
              <p className="text-muted-foreground">Select items to add to your order</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span className="font-medium">{cart.length} items</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Menu Items */}
          <div className="lg:col-span-2 space-y-8">
            {categories.map(category => (
              <div key={category}>
                <h2 className="text-2xl font-bold mb-4 text-primary">{category}</h2>
                <div className="grid gap-4">
                  {menuItems
                    .filter(item => item.category === category)
                    .map(item => (
                      <Card key={item.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                              <p className="text-muted-foreground mb-3">{item.description}</p>
                              <div className="flex items-center space-x-2">
                                <Badge variant="secondary">${item.price}</Badge>
                                <Badge variant="outline">{category}</Badge>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 ml-4">
                              {cart.find(cartItem => cartItem.id === item.id) ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </Button>
                                  <span className="font-medium min-w-[2ch] text-center">
                                    {cart.find(cartItem => cartItem.id === item.id)?.quantity || 0}
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addToCart(item)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <Button onClick={() => addToCart(item)}>
                                  Add to Cart
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>

          {/* Cart & Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ShoppingCart className="h-5 w-5" />
                  <span>Your Order</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-3">
                      {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-start space-x-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              ${item.price} × {item.quantity}
                            </p>
                            <Input
                              placeholder="Special instructions..."
                              value={item.notes || ''}
                              onChange={(e) => updateCartItemNotes(item.id, e.target.value)}
                              className="mt-1 text-xs"
                            />
                          </div>
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total:</span>
                        <span>${getTotalPrice()}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="tableNumber">Table Number *</Label>
                        <Input
                          id="tableNumber"
                          type="number"
                          placeholder="Enter table number"
                          value={tableNumber}
                          onChange={(e) => setTableNumber(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="orderNotes">Order Notes (Optional)</Label>
                        <Textarea
                          id="orderNotes"
                          placeholder="Any special requests..."
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                        />
                      </div>

                      <Button 
                        onClick={placeOrder} 
                        className="w-full"
                        disabled={cart.length === 0 || !tableNumber}
                      >
                        Place Order
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuView;