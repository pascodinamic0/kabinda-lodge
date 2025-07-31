import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, DollarSign, Users, ChefHat } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContent } from '@/hooks/useContent';
import { Restaurant as RestaurantType, MenuItem } from '@/types/restaurant';
import RestaurantImageCarousel from '@/components/RestaurantImageCarousel';

const Restaurant = () => {
  const { t } = useLanguage();
  const { content } = useContent('restaurant');
  const [restaurants, setRestaurants] = useState<RestaurantType[]>([]);
  const [menuItems, setMenuItems] = useState<{ [key: number]: MenuItem[] }>({});
  const [loading, setLoading] = useState(true);

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

      // Fetch all menu items for all restaurants
      const { data: allMenuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('restaurant_id, category, name');

      if (menuError) throw menuError;

      // Group menu items by restaurant
      const menuItemsByRestaurant: { [key: number]: MenuItem[] } = {};
      allMenuItems?.forEach(item => {
        if (!menuItemsByRestaurant[item.restaurant_id!]) {
          menuItemsByRestaurant[item.restaurant_id!] = [];
        }
        menuItemsByRestaurant[item.restaurant_id!].push(item);
      });

      setRestaurants(restaurantData || []);
      setMenuItems(menuItemsByRestaurant);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceRangeDisplay = (priceRange: string) => {
    const priceMap: { [key: string]: string } = {
      '$': '$15-25',
      '$$': '$25-40',
      '$$$': '$40-60',
      '$$$$': '$60+'
    };
    return priceMap[priceRange] || priceRange;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="h-12 bg-muted rounded-lg animate-pulse"></div>
              <div className="h-6 bg-muted rounded-lg animate-pulse max-w-2xl mx-auto"></div>
            </div>
            <div className="h-96 bg-muted rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getDescriptionPreview = (description: string, maxLength: number = 120) => {
    if (!description || description.length <= maxLength) {
      return description;
    }
    
    // Find the last complete word within the limit
    const truncated = description.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > 0) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {content.title || 'Our Restaurants'}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {content.description || 'Discover exceptional cuisine from our collection of restaurants, each offering unique flavors and dining experiences.'}
            </p>
          </div>
        </div>
      </div>

      {/* Restaurants Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          {restaurants.map((restaurant) => {
            const restaurantMenuItems = menuItems[restaurant.id] || [];
            const categories = [...new Set(restaurantMenuItems.map(item => item.category))];
            
            return (
              <Card key={restaurant.id} className="overflow-hidden">
                <CardHeader className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-3xl">{restaurant.name}</CardTitle>
                        <Badge variant="secondary" className="text-sm">
                          {restaurant.cuisine}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{restaurant.location}</span>
                      </div>
                      {restaurant.description && (
                        <p className="text-muted-foreground max-w-2xl">
                          {getDescriptionPreview(restaurant.description)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{restaurant.rating?.toFixed(1) || '4.0'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">{restaurant.price_range}</span>
                      </div>
                    </div>
                  </div>
                  
                  {restaurant.specialties && restaurant.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {restaurant.specialties.slice(0, 4).map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {restaurant.specialties.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{restaurant.specialties.length - 4} more
                        </Badge>
                      )}
                    </div>
                  )}
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Menu Preview */}
                  {restaurantMenuItems.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <ChefHat className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Menu Highlights</h3>
                        <Badge variant="secondary" className="text-xs">
                          {restaurantMenuItems.length} items
                        </Badge>
                      </div>
                      
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {restaurantMenuItems.slice(0, 6).map((item) => (
                          <div key={item.id} className="border rounded-lg p-4 space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm">{item.name}</h4>
                              <span className="text-primary font-semibold text-sm">
                                ${item.price.toFixed(2)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      
                      {restaurantMenuItems.length > 6 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{restaurantMenuItems.length - 6} more dishes available
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ChefHat className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Menu coming soon</p>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex gap-4">
                  <Button asChild className="flex-1">
                    <Link to={`/dining-reservation/${restaurant.id}`} className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Make Reservation
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/contact" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Contact
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
          
          {restaurants.length === 0 && !loading && (
            <Card className="text-center py-12">
              <CardContent>
                <ChefHat className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No Restaurants Available</h3>
                <p className="text-muted-foreground">
                  Our restaurant listings are currently being updated. Please check back soon.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Restaurant;