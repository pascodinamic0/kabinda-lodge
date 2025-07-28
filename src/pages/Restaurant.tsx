import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MapPin, Clock, DollarSign, Search, Filter, Users, UtensilsCrossed, ChefHat, Award, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Restaurant, MenuItem } from '@/types/restaurant';
import { RestaurantWithMenu, MenuCategory, RestaurantImage } from '@/types/restaurantExtended';
import RestaurantImageCarousel from '@/components/RestaurantImageCarousel';

const RestaurantPage = () => {
  const { t } = useLanguage();
  const [restaurants, setRestaurants] = useState<RestaurantWithMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<string>('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('');
  const [cuisineTypes, setCuisineTypes] = useState<string[]>([]);
  const [priceRanges] = useState<string[]>(['$', '$$', '$$$', '$$$$']);

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      
      // Fetch restaurants with images
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (restaurantsError) throw restaurantsError;

      // Fetch restaurant images
      const { data: restaurantImages, error: imagesError } = await supabase
        .from('restaurant_images')
        .select('*')
        .order('restaurant_id, display_order');

      if (imagesError) {
        console.error('Error fetching restaurant images:', imagesError);
      }

      // Fetch restaurant reviews for ratings
      const { data: reviews, error: reviewsError } = await supabase
        .from('restaurant_reviews')
        .select('restaurant_id, rating');

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
      }

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
            return { ...restaurant, menuCategories: [], images: [] };
          }

          // Group menu items by category
          const menuCategories: MenuCategory[] = [];
          const categories = [...new Set(menuItems.map(item => item.category))];
          
          categories.forEach(category => {
            const items = menuItems.filter(item => item.category === category);
            menuCategories.push({ name: category, items });
          });

          // Get images for this restaurant
          const images = restaurantImages?.filter(img => img.restaurant_id === restaurant.id) || [];

          // Calculate average rating and review count
          const restaurantReviews = reviews?.filter(r => r.restaurant_id === restaurant.id) || [];
          const averageRating = restaurantReviews.length > 0 
            ? restaurantReviews.reduce((sum, r) => sum + r.rating, 0) / restaurantReviews.length 
            : restaurant.rating || 4.5;
          const reviewCount = restaurantReviews.length;

          return { 
            ...restaurant, 
            menuCategories, 
            images,
            averageRating,
            reviewCount
          };
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
                         restaurant.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cuisine.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = selectedCuisine === 'all' || !selectedCuisine || restaurant.cuisine === selectedCuisine;
    const matchesPriceRange = selectedPriceRange === 'all' || !selectedPriceRange || restaurant.price_range === selectedPriceRange;
    return matchesSearch && matchesCuisine && matchesPriceRange;
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

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-video">
            <Skeleton className="w-full h-full" />
          </div>
          <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-16 w-full mb-4" />
            <div className="flex justify-between mb-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Hero Section Skeleton */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-20">
          <div className="container mx-auto px-4 text-center">
            <Skeleton className="h-12 w-3/4 mx-auto mb-6" />
            <Skeleton className="h-6 w-full max-w-3xl mx-auto mb-4" />
            <Skeleton className="h-6 w-2/3 max-w-3xl mx-auto" />
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-primary/20 via-background to-secondary/20 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23000000%22%20fill-opacity%3D%220.02%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <ChefHat className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-6xl font-bold text-foreground mb-6 leading-tight">
            {t('restaurant.title') || 'Culinary Excellence Awaits'}
          </h1>
          <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed mb-8">
            {t('restaurant.subtitle') || 'Embark on a gastronomic journey through our carefully curated collection of world-class restaurants. From intimate fine dining to vibrant casual eateries, each venue promises an unforgettable culinary adventure.'}
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full">
              <Award className="h-4 w-4 text-yellow-500" />
              <span>Award-Winning Chefs</span>
            </div>
            <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full">
              <UtensilsCrossed className="h-4 w-4 text-green-500" />
              <span>Fresh Ingredients</span>
            </div>
            <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Perfect for Any Occasion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filter Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-card border rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-foreground">Find Your Perfect Dining Experience</h2>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('restaurant.search') || 'Search by restaurant name, cuisine, or specialty...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCuisine} onValueChange={setSelectedCuisine}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Cuisines" />
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
            <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
              <SelectTrigger className="w-full lg:w-48">
                <DollarSign className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                {priceRanges.map((range) => (
                  <SelectItem key={range} value={range}>
                    {getPriceRangeDisplay(range)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {filteredRestaurants.length === 0 ? 
              'No Restaurants Found' : 
              `${filteredRestaurants.length} Restaurant${filteredRestaurants.length === 1 ? '' : 's'} Available`
            }
          </h2>
          {(searchTerm || selectedCuisine || selectedPriceRange) && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedCuisine('');
                setSelectedPriceRange('');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Enhanced Restaurants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredRestaurants.map((restaurant) => (
            <Card key={restaurant.id} className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
              {/* Restaurant Image Carousel */}
              <div className="aspect-video relative overflow-hidden">
                {restaurant.images && restaurant.images.length > 0 ? (
                  <RestaurantImageCarousel 
                    images={restaurant.images.map(img => ({
                      id: img.id,
                      url: img.image_url,
                      alt_text: img.alt_text || `${restaurant.name} interior`
                    }))}
                    itemName={restaurant.name}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="bg-background/90">
                    {restaurant.cuisine}
                  </Badge>
                </div>
              </div>

              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {restaurant.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <MapPin className="h-4 w-4" />
                      {restaurant.location}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-muted-foreground line-clamp-2 leading-relaxed">
                  {restaurant.description || 'Experience culinary artistry in an atmosphere designed for memorable dining moments.'}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">
                      {getPriceRangeDisplay(restaurant.price_range)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">
                      {restaurant.averageRating?.toFixed(1) || '4.5'}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({restaurant.reviewCount || 124} reviews)
                    </span>
                  </div>
                </div>

                {restaurant.specialties && restaurant.specialties.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 text-foreground">Signature Dishes:</p>
                    <div className="flex flex-wrap gap-1">
                      {restaurant.specialties.slice(0, 2).map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                      {restaurant.specialties.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{restaurant.specialties.length - 2} more
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
                        <Badge key={index} variant="secondary" className="text-xs">
                          {category.name} ({category.items.length})
                        </Badge>
                      ))}
                      {restaurant.menuCategories.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
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
                    {t('restaurant.viewMenu') || 'View Menu'}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Enhanced No Results State */}
        {filteredRestaurants.length === 0 && (
          <div className="text-center py-20">
            <div className="max-w-md mx-auto">
              <div className="bg-muted/20 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <UtensilsCrossed className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-3xl font-semibold text-foreground mb-4">
                {t('restaurant.noResults') || 'No Restaurants Found'}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {t('restaurant.tryDifferentSearch') || 'We couldn\'t find any restaurants matching your criteria. Try refining your search or explore our full collection of dining venues.'}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCuisine('');
                    setSelectedPriceRange('');
                  }}
                >
                  Show All Restaurants
                </Button>
                <Button asChild>
                  <Link to="/contact">
                    Request a Restaurant
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantPage;