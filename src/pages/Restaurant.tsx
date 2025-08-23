import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChefHat, Search, ShoppingCart, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContent } from '@/hooks/useContent';
import { Restaurant as RestaurantType, MenuItem } from '@/types/restaurant';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import FloatingCart, { FloatingCartItem } from '@/components/restaurant/FloatingCart';

interface MenuItemWithRestaurant extends MenuItem {
  restaurant: RestaurantType;
}

const Restaurant = () => {
  const { t } = useLanguage();
  const { content } = useContent('restaurant');
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  const CART_KEY = 'restaurant_cart';
  const PENDING_ORDER_KEY = 'restaurant_pending_order';

  const [restaurants, setRestaurants] = useState<RestaurantType[]>([]);
  const [allMenuItems, setAllMenuItems] = useState<MenuItemWithRestaurant[]>([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState<MenuItemWithRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [cart, setCart] = useState<{ [key: number]: number }>({});

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) setCart(JSON.parse(stored));
    } catch (e) {
      console.warn('Failed to parse stored cart');
    }
  }, []);

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Failed to persist cart');
    }
  }, [cart]);

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      
      // Fetch all restaurants
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (restaurantError) throw restaurantError;

      // Fetch all menu items with restaurant information
      const { data: menuItemsData, error: menuError } = await supabase
        .from('menu_items')
        .select(`
          *,
          restaurants (*)
        `)
        .eq('is_available', true)
        .order('name');

      if (menuError) throw menuError;

      // Transform menu items to include restaurant data
      const menuItemsWithRestaurant: MenuItemWithRestaurant[] = (menuItemsData || []).map(item => ({
        ...item,
        restaurant: item.restaurants as RestaurantType
      }));

      setRestaurants(restaurantData || []);
      setAllMenuItems(menuItemsWithRestaurant);
      setFilteredMenuItems(menuItemsWithRestaurant);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter menu items based on search and filters
  useEffect(() => {
    let filtered = allMenuItems;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      const [min, max] = selectedPriceRange.split('-').map(Number);
      filtered = filtered.filter(item => {
        if (max) {
          return item.price >= min && item.price <= max;
        } else {
          return item.price >= min;
        }
      });
    }

    setFilteredMenuItems(filtered);
  }, [allMenuItems, searchTerm, selectedCategory, selectedPriceRange]);

  const addToCart = (menuItem: MenuItemWithRestaurant) => {
    setCart(prev => ({
      ...prev,
      [menuItem.id]: (prev[menuItem.id] || 0) + 1
    }));
    toast({
      title: "Added to cart",
      description: `${menuItem.name} has been added to your order`,
    });
  };

  const getUniqueCategories = () => {
    return [...new Set(allMenuItems.map(item => item.category))];
  };

const getPriceRanges = () => [
  { label: 'Under $10', value: '0-10' },
  { label: '$10 - $20', value: '10-20' },
  { label: '$20 - $30', value: '20-30' },
  { label: '$30+', value: '30' }
];

// Build detailed cart items for UI
const cartItems: FloatingCartItem[] = Object.entries(cart)
  .map(([id, qty]) => {
    const item = allMenuItems.find(m => m.id === Number(id));
    if (!item) return null;
    return {
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: Number(qty)
    } as FloatingCartItem;
  })
  .filter(Boolean) as FloatingCartItem[];

const clearCart = () => {
  setCart({});
  try { localStorage.removeItem(CART_KEY); } catch {}
};

const proceedToOrder = () => {
  if (cartItems.length === 0) return;
  // Persist a lightweight prefill payload for OrderCreation
  try {
    localStorage.setItem(
      PENDING_ORDER_KEY,
      JSON.stringify(cartItems.map(ci => ({ menu_item_id: ci.id, quantity: ci.quantity })))
    );
  } catch {}

  if (!user) {
    toast({ title: 'Sign in required', description: 'Please sign in as restaurant staff to proceed.' });
    navigate('/kabinda-lodge/client-auth?redirect=/kabinda-lodge/restaurant/order');
    return;
  }

  if (userRole === 'RestaurantLead' || userRole === 'Admin') {
    navigate('/kabinda-lodge/restaurant/order');
  } else {
    toast({ title: 'Access restricted', description: 'Only restaurant staff can complete orders.', variant: 'destructive' });
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto mb-8"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-80 bg-muted rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary-glow py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-elegant font-bold text-primary-foreground mb-6">
            {content.title || 'Our Menu'}
          </h1>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto">
            {content.description || 'Discover delicious dishes from our restaurants, each prepared with care and premium ingredients'}
          </p>
        </div>
      </section>

      {/* Filters Section */}
      <section className="py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Find Your Perfect Dish</h3>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{filteredMenuItems.length} dishes available</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dishes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getUniqueCategories().map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range Filter */}
              <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  {getPriceRanges().map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Items Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {filteredMenuItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMenuItems.map((menuItem) => (
                  <Card key={menuItem.id} className="overflow-hidden hover:shadow-elegant transition-shadow duration-300 h-full flex flex-col">
                    {menuItem.image_url ? (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={menuItem.image_url}
                          alt={menuItem.name}
                          className="w-full h-full object-cover"
                        />
                        <Badge className="absolute top-4 right-4">
                          {menuItem.category}
                        </Badge>
                      </div>
                    ) : (
                      <div className="h-48 bg-muted flex items-center justify-center relative">
                        <ChefHat className="h-16 w-16 text-muted-foreground" />
                        <Badge className="absolute top-4 right-4">
                          {menuItem.category}
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="pb-3">
                      <CardTitle className="font-elegant line-clamp-2">{menuItem.name}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3 flex-grow">
                      {menuItem.description && (
                        <CardDescription className="line-clamp-3">
                          {menuItem.description}
                        </CardDescription>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-primary">
                          ${menuItem.price.toFixed(2)}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-3">
                      <Button 
                        className="w-full gap-2"
                        onClick={() => addToCart(menuItem)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        Add to Order
                        {cart[menuItem.id] && (
                          <Badge variant="secondary" className="ml-2">
                            {cart[menuItem.id]}
                          </Badge>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No Dishes Found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filter criteria to find more dishes.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>
      <FloatingCart items={cartItems} onCheckout={proceedToOrder} onClear={clearCart} />
    </div>
  );
};

export default Restaurant;