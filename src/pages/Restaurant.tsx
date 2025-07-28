import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star, MapPin, Clock, DollarSign, Search, Filter, Users, UtensilsCrossed } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Restaurant, MenuItem } from '@/types/restaurant';
import { RestaurantWithMenu, MenuCategory } from '@/types/restaurantExtended';

const RestaurantPage = () => {
  const { t } = useLanguage();
  const [restaurants, setRestaurants] = useState<RestaurantWithMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      
      // Fetch restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (restaurantsError) throw restaurantsError;

      // Fetch menu items for each restaurant
      const restaurantsWithMenus: RestaurantWithMenu[] = await Promise.all(
        (restaurantsData || []).map(async (restaurant) => {
          const { data: menuItems, error: menuError } = await supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .eq('is_available', true)
            .order('category, name');

          if (menuError) {
            console.error('Error fetching menu items:', menuError);
            return { ...restaurant, menuCategories: [] };
          }

          // Group menu items by category
          const menuCategories: MenuCategory[] = [];
          const categories = [...new Set(menuItems.map(item => item.category))];
          
          categories.forEach(category => {
            const items = menuItems.filter(item => item.category === category);
            menuCategories.push({ name: category, items });
          });

          return { ...restaurant, menuCategories };
        })
      );

      setRestaurants(restaurantsWithMenus);
      
      // Extract unique cuisine types
      const cuisines = [...new Set(restaurantsWithMenus.map(r => r.cuisine))];
      setCuisineTypes(cuisines);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = selectedCuisine === 'all' || !selectedCuisine || restaurant.cuisine === selectedCuisine;
    return matchesSearch && matchesCuisine;
  });

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold text-foreground mb-6 leading-tight">
            {t('restaurant.title') || 'Culinary Excellence Awaits'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t('restaurant.subtitle') || 'Embark on a gastronomic journey through our carefully curated collection of world-class restaurants. From intimate fine dining to vibrant casual eateries, each venue promises an unforgettable culinary adventure.'}
          </p>
          <div className="flex justify-center mt-8">
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>Award-Winning Chefs</span>
              </div>
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                <span>Fresh Ingredients</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Perfect for Any Occasion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('restaurant.search') || 'Search by restaurant name or cuisine...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder={t('restaurant.filterCuisine') || 'All Cuisines'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {cuisineTypes.map((cuisine) => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Restaurants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="group hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{restaurant.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <MapPin className="h-4 w-4" />
                      {restaurant.location}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">{restaurant.cuisine}</Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                  {restaurant.description || 'Experience culinary artistry in an atmosphere designed for memorable dining moments.'}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      {getPriceRangeDisplay(restaurant.price_range)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {restaurant.rating || 4.5}/5.0
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">(124 reviews)</span>
                  </div>
                </div>

                {restaurant.specialties && restaurant.specialties.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2 text-foreground">Signature Dishes:</p>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.specialties.slice(0, 3).map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {restaurant.specialties.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{restaurant.specialties.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {restaurant.menuCategories.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 text-foreground">Available Menus:</p>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.menuCategories.slice(0, 3).map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category.name} ({category.items.length})
                        </Badge>
                      ))}
                      {restaurant.menuCategories.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{restaurant.menuCategories.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex gap-2">
                <Button asChild className="flex-1">
                  <Link to={`/dining-reservation/${restaurant.id}`}>
                    <Users className="h-4 w-4 mr-2" />
                    {t('restaurant.makeReservation') || 'Reserve Table'}
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to={`/restaurant/${restaurant.id}`}>
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    {t('restaurant.viewMenu') || 'Explore Menu'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <UtensilsCrossed className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                {t('restaurant.noResults') || 'No Restaurants Found'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {t('restaurant.tryDifferentSearch') || 'We couldn\'t find any restaurants matching your criteria. Try refining your search or explore our full collection of dining venues.'}
              </p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCuisine('all');
                }}
              >
                Show All Restaurants
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantPage;