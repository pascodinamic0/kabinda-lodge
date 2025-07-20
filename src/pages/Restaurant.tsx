import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, Star, X, Edit3 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import RestaurantReviewModal from "@/components/restaurant/RestaurantReviewModal";
import { useToast } from "@/hooks/use-toast";
import RestaurantImageCarousel from "@/components/RestaurantImageCarousel";
import type { Restaurant, MenuItem } from "@/types/restaurant";
import type { RestaurantReview } from "@/types/restaurantExtended";

const Restaurant = () => {
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<{[key: number]: MenuItem[]}>({});
  const [userReviews, setUserReviews] = useState<RestaurantReview[]>([]);
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    restaurantId: number;
    restaurantName: string;
    existingReview?: any;
  }>({ isOpen: false, restaurantId: 0, restaurantName: '' });
  const [priceEditModal, setPriceEditModal] = useState<{
    isOpen: boolean;
    restaurantId: number;
    restaurantName: string;
    currentPriceRange: string;
  }>({ isOpen: false, restaurantId: 0, restaurantName: '', currentPriceRange: '' });
  
  const { user, userRole } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRestaurants();
    if (user) {
      fetchUserReviews();
    }
  }, [user]);

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (error) throw error;
      setRestaurants(data || []);
      
      // Fetch menu items for each restaurant
      if (data) {
        await fetchMenuItems(data);
      }
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurants. Please try again.",
        variant: "destructive"
      });
    }
  };

  const fetchMenuItems = async (restaurantList: Restaurant[]) => {
    try {
      const menuData: {[key: number]: MenuItem[]} = {};
      
      for (const restaurant of restaurantList) {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurant.id)
          .eq('is_available', true)
          .order('category', { ascending: true })
          .order('name', { ascending: true });

        if (error) throw error;

        // Fetch images for each menu item
        const menuItemsWithImages = await Promise.all(
          (data || []).map(async (item) => {
            const { data: imagesData } = await supabase
              .from('menu_images')
              .select('id, image_url, alt_text')
              .eq('menu_item_id', item.id)
              .order('display_order');

            const images = (imagesData || []).map(img => ({
              id: img.id,
              url: img.image_url,
              alt_text: img.alt_text || ''
            }));

            return {
              ...item,
              images
            };
          })
        );

        menuData[restaurant.id] = menuItemsWithImages;
      }
      
      setMenuItems(menuData);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const fetchUserReviews = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('restaurant_reviews')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserReviews(data || []);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
    }
  };

  const openReviewModal = (restaurantId: number, restaurantName: string) => {
    const existingReview = userReviews.find(review => review.restaurant_id === restaurantId);
    setReviewModal({
      isOpen: true,
      restaurantId,
      restaurantName,
      existingReview
    });
  };

  const openPriceEditModal = (restaurantId: number, restaurantName: string, currentPriceRange: string) => {
    setPriceEditModal({
      isOpen: true,
      restaurantId,
      restaurantName,
      currentPriceRange
    });
  };

  const handleReviewSubmitted = () => {
    fetchUserReviews();
    fetchRestaurants(); // Refresh to update ratings
  };

  const handlePriceUpdated = () => {
    fetchRestaurants();
  };

  const canEditPrices = userRole === 'RestaurantLead' || userRole === 'Admin';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Restaurant Menu
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Delicious meals and refreshing drinks available for room delivery, restaurant service, or home delivery
          </p>
        </div>

        {/* Food/Drinks Selector */}
        <div className="mb-8">
          <Tabs defaultValue="food" className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-64 grid-cols-2 bg-muted/50 p-1 rounded-lg">
                <TabsTrigger 
                  value="food" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                >
                  Food
                </TabsTrigger>
                <TabsTrigger 
                  value="drinks" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                >
                  Drinks
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Food Items */}
            <TabsContent value="food" className="space-y-8">
              {restaurants.map((restaurant) => {
                const foodItems = menuItems[restaurant.id]?.filter(item => 
                  !['drinks', 'beverages', 'cocktails', 'wine', 'beer', 'juice'].some(drink => 
                    item.category.toLowerCase().includes(drink.toLowerCase())
                  )
                ) || [];
                
                if (foodItems.length === 0) return null;
                
                return (
                  <div key={`food-${restaurant.id}`} className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-foreground mb-2">{restaurant.name} - Food</h2>
                      <p className="text-muted-foreground">{restaurant.description}</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      {foodItems.map((item, index) => (
                         <Card key={`${item.id}-${index}`} className="overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in group">
                           <div className="relative">
                             {item.images && item.images.length > 0 ? (
                               <RestaurantImageCarousel 
                                 images={item.images} 
                                 itemName={item.name}
                               />
                             ) : item.image_url ? (
                               <div 
                                 className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity overflow-hidden"
                                 onClick={() => setFullScreenImage(item.image_url)}
                               >
                                 <img 
                                   src={item.image_url} 
                                   alt={item.name}
                                   className="w-full h-full object-cover"
                                 />
                               </div>
                             ) : (
                               <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                 <div className="text-center">
                                   <Star className="h-12 w-12 text-primary mx-auto mb-2" />
                                   <p className="text-sm text-muted-foreground">{item.category}</p>
                                   <p className="text-xs text-muted-foreground mt-1">No image available</p>
                                 </div>
                               </div>
                             )}
                            <div className="absolute top-4 left-4 z-10">
                              <Badge className="bg-primary/90 text-primary-foreground">
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-xl mb-2">{item.name}</CardTitle>
                                {item.description && (
                                  <p className="text-muted-foreground text-sm">{item.description}</p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-primary">${item.price}</div>
                                {canEditPrices && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 mt-1"
                                    onClick={() => {/* Price editing functionality will be added later */}}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant={item.is_available ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {item.is_available ? "Available" : "Unavailable"}
                              </Badge>
                            </div>
                            
                            <Button 
                              className="w-full"
                              disabled={!item.is_available}
                              asChild
                            >
                              <Link to="/restaurant/reservation">
                                Order Now
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
            
            {/* Drinks Items */}
            <TabsContent value="drinks" className="space-y-8">
              {restaurants.map((restaurant) => {
                const drinkItems = menuItems[restaurant.id]?.filter(item => 
                  ['drinks', 'beverages', 'cocktails', 'wine', 'beer', 'juice'].some(drink => 
                    item.category.toLowerCase().includes(drink.toLowerCase())
                  )
                ) || [];
                
                if (drinkItems.length === 0) return null;
                
                return (
                  <div key={`drinks-${restaurant.id}`} className="space-y-6">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-foreground mb-2">{restaurant.name} - Drinks</h2>
                      <p className="text-muted-foreground">Refreshing beverages and signature cocktails</p>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-6">
                      {drinkItems.map((item, index) => (
                         <Card key={`${item.id}-${index}`} className="overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in group">
                           <div className="relative">
                             {item.images && item.images.length > 0 ? (
                               <RestaurantImageCarousel 
                                 images={item.images} 
                                 itemName={item.name}
                               />
                             ) : item.image_url ? (
                               <div 
                                 className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity overflow-hidden"
                                 onClick={() => setFullScreenImage(item.image_url)}
                               >
                                 <img 
                                   src={item.image_url} 
                                   alt={item.name}
                                   className="w-full h-full object-cover"
                                 />
                               </div>
                             ) : (
                               <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                                 <div className="text-center">
                                   <Star className="h-12 w-12 text-primary mx-auto mb-2" />
                                   <p className="text-sm text-muted-foreground">{item.category}</p>
                                   <p className="text-xs text-muted-foreground mt-1">No image available</p>
                                 </div>
                               </div>
                             )}
                            <div className="absolute top-4 left-4 z-10">
                              <Badge className="bg-primary/90 text-primary-foreground">
                                {item.category}
                              </Badge>
                            </div>
                          </div>
                          
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-xl mb-2">{item.name}</CardTitle>
                                {item.description && (
                                  <p className="text-muted-foreground text-sm">{item.description}</p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-primary">${item.price}</div>
                                {canEditPrices && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 mt-1"
                                    onClick={() => {/* Price editing functionality will be added later */}}
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Badge 
                                variant={item.is_available ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {item.is_available ? "Available" : "Unavailable"}
                              </Badge>
                            </div>
                            
                            <Button 
                              className="w-full"
                              disabled={!item.is_available}
                              asChild
                            >
                              <Link to="/restaurant/reservation">
                                Order Now
                              </Link>
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </TabsContent>
          </Tabs>
        </div>

        {/* Order Options Info */}
        <div className="bg-card rounded-lg p-8 mt-16 animate-fade-in">
          <h2 className="text-2xl font-bold text-center mb-8">Order Options</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Room Delivery</h3>
              <p className="text-muted-foreground">Order to your room with your room number</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Restaurant Dining</h3>
              <p className="text-muted-foreground">Dine at our restaurant with your table number</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Home Delivery</h3>
              <p className="text-muted-foreground">Delivery to your address with advance payment</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Image Dialog */}
      {fullScreenImage && (
        <Dialog open={!!fullScreenImage} onOpenChange={() => setFullScreenImage(null)}>
          <DialogContent className="max-w-screen-lg w-full h-full max-h-screen p-0 bg-black/95">
            <div className="relative w-full h-full flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
                onClick={() => setFullScreenImage(null)}
              >
                <X className="h-6 w-6" />
              </Button>
              <img
                src={fullScreenImage}
                alt="Full screen view"
                className="max-w-full max-h-full object-contain"
                onClick={() => setFullScreenImage(null)}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Restaurant Review Modal */}
      <RestaurantReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        restaurantId={reviewModal.restaurantId}
        restaurantName={reviewModal.restaurantName}
        existingReview={reviewModal.existingReview}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </div>
  );
};

export default Restaurant;
