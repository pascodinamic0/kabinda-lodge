import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, MapPin, DollarSign, Users, Phone, Clock, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContent } from '@/hooks/useContent';
import { RestaurantWithMenu, MenuCategory, RestaurantImage, RestaurantReview } from '@/types/restaurantExtended';
import { MenuItem } from '@/types/restaurant';
import RestaurantImageCarousel from '@/components/RestaurantImageCarousel';

// Focus on "The Grand Terrace" restaurant (ID: 1)
const PRIMARY_RESTAURANT_ID = 1;

const Restaurant = () => {
  const { t } = useLanguage();
  const { content } = useContent('restaurant');
  const [restaurant, setRestaurant] = useState<RestaurantWithMenu | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRestaurantData();
  }, []);

  const fetchRestaurantData = async () => {
    try {
      setLoading(true);
      
      // Fetch primary restaurant details
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', PRIMARY_RESTAURANT_ID)
        .single();

      if (restaurantError) throw restaurantError;

      // Fetch restaurant images
      const { data: imagesData, error: imagesError } = await supabase
        .from('restaurant_images')
        .select('*')
        .eq('restaurant_id', PRIMARY_RESTAURANT_ID)
        .order('display_order');

      // Fetch restaurant reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('restaurant_reviews')
        .select('*')
        .eq('restaurant_id', PRIMARY_RESTAURANT_ID)
        .order('created_at', { ascending: false });

      // Fetch menu items
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', PRIMARY_RESTAURANT_ID)
        .eq('is_available', true)
        .order('category, name');

      if (menuError) throw menuError;

      // Process images
      const images: RestaurantImage[] = imagesData || [];

      // Process reviews and calculate average rating
      const reviews: RestaurantReview[] = reviewsData || [];
      const averageRating = reviews.length > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
        : restaurantData.rating || 4.0;

      // Group menu items by category
      const menuCategories: MenuCategory[] = [];
      const categories = [...new Set(menuItems.map(item => item.category))];
      
      categories.forEach(category => {
        const items = menuItems.filter(item => item.category === category);
        menuCategories.push({ name: category, items });
      });

      setRestaurant({
        ...restaurantData,
        menuCategories,
        images,
        averageRating,
        reviewCount: reviews.length
      });
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

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Restaurant Temporarily Unavailable</h2>
          <p className="text-muted-foreground">We're updating our restaurant information. Please check back soon.</p>
          <Button asChild>
            <Link to="/">Return Home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              {content.title || 'Fine Dining Experience'}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              {content.description || 'Discover exceptional cuisine and elegant ambiance at our signature restaurant, where every meal is a memorable experience.'}
            </p>
          </div>
        </div>
      </div>

      {/* Restaurant Profile Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Restaurant Header */}
          <div className="bg-card rounded-lg shadow-lg p-8 mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Restaurant Info */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-4xl font-bold text-foreground">{restaurant.name}</h2>
                    <Badge variant="secondary" className="text-lg px-3 py-1">
                      {restaurant.cuisine}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground mb-4">
                    <MapPin className="h-5 w-5" />
                    <span className="text-lg">{restaurant.location}</span>
                  </div>

                  <p className="text-lg text-muted-foreground leading-relaxed">
                    {restaurant.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    <span className="font-medium">
                      {getPriceRangeDisplay(restaurant.price_range)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">
                      {restaurant.averageRating?.toFixed(1)} ({restaurant.reviewCount} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Open Daily</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-purple-600" />
                    <span className="font-medium">Award Winning</span>
                  </div>
                </div>

                {restaurant.specialties && restaurant.specialties.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-foreground">Signature Specialties:</h3>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.specialties.map((specialty, index) => (
                        <Badge key={index} variant="outline" className="text-sm">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" asChild className="flex-1">
                    <Link to={`/dining-reservation/${restaurant.id}`} className="flex items-center justify-center gap-2">
                      <Users className="h-5 w-5" />
                      Make Reservation
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="flex-1">
                    <Link to="/contact" className="flex items-center justify-center gap-2">
                      <Phone className="h-5 w-5" />
                      Contact Us
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Restaurant Images */}
              <div>
                {restaurant.images && restaurant.images.length > 0 ? (
                  <RestaurantImageCarousel 
                    images={restaurant.images.map(img => ({
                      id: img.id,
                      url: img.image_url,
                      alt_text: img.alt_text
                    }))}
                    itemName={restaurant.name}
                  />
                ) : (
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Restaurant images coming soon</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Section */}
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-4">Our Menu</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore our carefully crafted dishes made with the finest ingredients and traditional techniques.
              </p>
            </div>

            {restaurant.menuCategories.length > 0 ? (
              <Tabs defaultValue={restaurant.menuCategories[0]?.name} className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 mb-8">
                  {restaurant.menuCategories.map((category) => (
                    <TabsTrigger key={category.name} value={category.name} className="text-sm">
                      {category.name}
                      <Badge variant="secondary" className="ml-2">
                        {category.items.length}
                      </Badge>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {restaurant.menuCategories.map((category) => (
                  <TabsContent key={category.name} value={category.name}>
                    <div className="grid gap-6 md:grid-cols-2">
                      {category.items.map((item) => (
                        <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                  {item.name}
                                </CardTitle>
                                {item.description && (
                                  <CardDescription className="mt-2 text-base">
                                    {item.description}
                                  </CardDescription>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <span className="text-2xl font-bold text-primary">
                                  ${item.price.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </CardHeader>
                          {item.image_url && (
                            <CardContent>
                              <img 
                                src={item.image_url} 
                                alt={item.name}
                                className="w-full h-48 object-cover rounded-md group-hover:scale-105 transition-transform duration-300"
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
              <Card className="text-center py-12">
                <CardContent>
                  <p className="text-xl text-muted-foreground mb-4">
                    Our menu is currently being updated with exciting new dishes.
                  </p>
                  <p className="text-muted-foreground">
                    Please call us or visit in person to see our current offerings.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Call to Action */}
            <div className="text-center space-y-6 py-12">
              <h3 className="text-2xl font-bold text-foreground">Ready to Dine With Us?</h3>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Reserve your table today and experience exceptional cuisine in an elegant atmosphere.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to={`/dining-reservation/${restaurant.id}`} className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Make Reservation
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/contact" className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Restaurant
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Restaurant;