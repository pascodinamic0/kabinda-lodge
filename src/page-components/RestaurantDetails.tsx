import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MapPin, Clock, DollarSign, ArrowLeft, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Restaurant, MenuItem } from '@/types/restaurant';
import { RestaurantWithMenu, MenuCategory } from '@/types/restaurantExtended';

const RestaurantDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRestaurantDetails();
    }
  }, [id]);

  const fetchRestaurantDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (restaurantError) throw restaurantError;

      // Fetch menu items for the restaurant
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', parseInt(id))
        .eq('is_available', true)
        .order('category, name');

      if (menuError) throw menuError;

      // Group menu items by category
      const menuCategories: MenuCategory[] = [];
      const categories = [...new Set(menuItems.map(item => item.category))];
      
      categories.forEach(category => {
        const items = menuItems.filter(item => item.category === category);
        menuCategories.push({ name: category, items });
      });

      setRestaurant({ ...restaurantData, menuCategories });
    } catch (error) {
      console.error('Error fetching restaurant details:', error);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Restaurant Not Found</h2>
          <Button asChild>
            <Link to="/kabinda-lodge/restaurant">Back to Restaurants</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-4 py-4">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/kabinda-lodge/restaurant" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back') || 'Back to Restaurants'}
          </Link>
        </Button>
      </div>

      {/* Restaurant Header */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h1 className="text-4xl font-bold text-foreground">{restaurant.name}</h1>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {restaurant.cuisine}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <MapPin className="h-5 w-5" />
                  <span className="text-lg">{restaurant.location}</span>
                </div>

                <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
                  {restaurant.description}
                </p>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-lg">
                      {getPriceRangeDisplay(restaurant.price_range)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-lg">
                      {restaurant.rating || 4.0} rating
                    </span>
                  </div>
                </div>

                {restaurant.specialties && restaurant.specialties.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Specialties:</h3>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-shrink-0">
                <Button size="lg" asChild className="w-full md:w-auto">
                  <Link to={`/dining-reservation/${restaurant.id}`} className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {t('restaurant.makeReservation') || 'Make Reservation'}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
            {t('restaurant.menu') || 'Our Menu'}
          </h2>

          {restaurant.menuCategories.length > 0 ? (
            <Tabs defaultValue={restaurant.menuCategories[0]?.name} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
                {restaurant.menuCategories.map((category) => (
                  <TabsTrigger key={category.name} value={category.name} className="text-sm">
                    {category.name} ({category.items.length})
                  </TabsTrigger>
                ))}
              </TabsList>

              {restaurant.menuCategories.map((category) => (
                <TabsContent key={category.name} value={category.name}>
                  <div className="grid gap-4">
                    {category.items.map((item) => (
                      <Card key={item.id} className="group hover:shadow-md transition-shadow">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              {item.description && (
                                <CardDescription className="mt-2">
                                  {item.description}
                                </CardDescription>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold text-primary">
                                ${item.price.toFixed(2)}
                              </span>
                              {!item.is_available && (
                                <Badge variant="secondary" className="ml-2">
                                  Unavailable
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {item.image_url && (
                          <CardContent>
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-full h-48 object-cover rounded-md"
                            />
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-muted-foreground">
                {t('restaurant.noMenuAvailable') || 'Menu information is currently being updated.'}
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Button size="lg" asChild>
              <Link to={`/dining-reservation/${restaurant.id}`} className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('restaurant.makeReservation') || 'Make Reservation'}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetails;