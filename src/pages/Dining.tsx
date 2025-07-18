import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Clock, MapPin, Phone, Star, X, Edit3, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { RestaurantReviewModal } from "@/components/dining/RestaurantReviewModal";
import { PriceEditModal } from "@/components/dining/PriceEditModal";
import { useToast } from "@/hooks/use-toast";

const Dining = () => {
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
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
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurants. Please try again.",
        variant: "destructive"
      });
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

  const services = [
    {
      title: "24/7 Room Service",
      description: "Enjoy our full menu from the comfort of your room",
      icon: Clock
    },
    {
      title: "Private Dining",
      description: "Exclusive dining experiences for special occasions",
      icon: Star
    },
    {
      title: "Chef's Table",
      description: "Interactive culinary experience with our head chef",
      icon: MapPin
    },
    {
      title: "Dietary Accommodations",
      description: "Customized menus for all dietary preferences",
      icon: Phone
    }
  ];

  const canEditPrices = userRole === 'RestaurantLead' || userRole === 'Admin';

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center">
            <h1 className="font-elegant text-5xl font-bold text-foreground mb-4">
              Dining Experiences
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Indulge in exceptional culinary journeys crafted by world-class chefs, 
              featuring the finest ingredients and innovative cooking techniques.
            </p>
          </div>
        </div>
      </section>

      {/* Restaurants Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="space-y-8">
            {restaurants.map((restaurant, index) => (
              <Card key={`restaurant-${restaurant.id}-${index}`} className="border-border hover:shadow-lg transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div 
                      className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => setFullScreenImage(`https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop&crop=center`)}
                    >
                      <div className="text-center">
                        <Star className="h-12 w-12 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{restaurant.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">Click to view full screen</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <CardHeader>
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="font-elegant text-2xl">{restaurant.name}</CardTitle>
                            {canEditPrices && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPriceEditModal(restaurant.id, restaurant.name, restaurant.price_range)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="secondary">{restaurant.type}</Badge>
                            <Badge variant="outline">{restaurant.cuisine}</Badge>
                            <span className="text-lg font-semibold text-primary">{restaurant.price_range}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(Math.floor(restaurant.rating))].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-accent fill-current" />
                            ))}
                            <span className="text-sm text-muted-foreground ml-2">
                              {restaurant.rating} rating
                            </span>
                            {user && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openReviewModal(restaurant.id, restaurant.name)}
                                className="ml-2 h-6 text-xs"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                {userReviews.find(review => review.restaurant_id === restaurant.id) ? 'Update Review' : 'Write Review'}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{restaurant.description}</p>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          {restaurant.specialties?.map((specialty, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button asChild className="w-full sm:w-auto">
                          <Link to="/dining/reservation">
                            Make Reservation
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-elegant text-4xl font-bold text-foreground mb-4">
              Additional Dining Services
            </h2>
            <p className="text-lg text-muted-foreground">
              Personalized culinary experiences tailored to your preferences
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <Card key={`service-${service.title}-${index}`} className="border-border text-center">
                <CardContent className="p-6">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <service.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-elegant text-lg font-semibold mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Wine & Beverage Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-elegant text-4xl font-bold text-foreground mb-6">
                Curated Wine Selection
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Our sommelier has carefully selected an extensive collection of wines 
                from renowned vineyards around the world. From vintage bordeaux to 
                contemporary new world varietals, discover the perfect pairing for any occasion.
              </p>
              <ul className="space-y-2 text-muted-foreground mb-8">
                <li>• Over 500 wine labels from 15 countries</li>
                <li>• Expert sommelier recommendations</li>
                <li>• Wine tasting events and classes</li>
                <li>• Private cellar tours available</li>
              </ul>
              <Button size="lg" asChild>
                <Link to="/contact">
                  Contact Sommelier
                </Link>
              </Button>
            </div>
            <div 
              className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg h-96 flex items-center justify-center cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() => setFullScreenImage(`https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop&crop=center`)}
            >
              <div className="text-center">
                <Star className="h-20 w-20 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Wine Cellar</p>
                <p className="text-muted-foreground">Premium Collection</p>
                <p className="text-xs text-muted-foreground mt-2">Click to view full screen</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="font-elegant text-4xl font-bold mb-4">
            Ready to Dine with Us?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Reserve your table and experience culinary excellence
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 w-4/5 sm:w-auto mx-auto" asChild>
              <Link to="/dining/reservation">
                Make Reservation
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/contact">
                Contact Concierge
              </Link>
            </Button>
          </div>
        </div>
      </section>

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

      {/* Price Edit Modal */}
      <PriceEditModal
        isOpen={priceEditModal.isOpen}
        onClose={() => setPriceEditModal({ ...priceEditModal, isOpen: false })}
        restaurantId={priceEditModal.restaurantId}
        restaurantName={priceEditModal.restaurantName}
        currentPriceRange={priceEditModal.currentPriceRange}
        onPriceUpdated={handlePriceUpdated}
      />
    </div>
  );
};

export default Dining;