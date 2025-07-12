import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Phone, Star } from "lucide-react";

const Dining = () => {
  const restaurants = [
    {
      name: "The Grand Terrace",
      type: "Fine Dining",
      cuisine: "Contemporary International",
      hours: "6:00 PM - 11:00 PM",
      location: "Main Floor",
      rating: 5,
      priceRange: "$$$",
      description: "An elegant dining experience featuring globally-inspired cuisine with locally sourced ingredients.",
      specialties: ["Wagyu Beef", "Fresh Seafood", "Seasonal Menu", "Wine Pairing"]
    },
    {
      name: "Sunrise Café",
      type: "Casual Dining",
      cuisine: "American & Continental",
      hours: "6:00 AM - 2:00 PM",
      location: "Garden Level",
      rating: 4,
      priceRange: "$$",
      description: "Start your day with freshly prepared breakfast and light lunch options in a relaxed atmosphere.",
      specialties: ["Fresh Pastries", "Artisan Coffee", "Healthy Options", "Local Favorites"]
    },
    {
      name: "The Lounge Bar",
      type: "Bar & Lounge",
      cuisine: "Cocktails & Small Plates",
      hours: "4:00 PM - 1:00 AM",
      location: "Rooftop",
      rating: 5,
      priceRange: "$$",
      description: "Sophisticated cocktails and tapas with panoramic city views in an intimate setting.",
      specialties: ["Craft Cocktails", "Premium Spirits", "Tapas", "City Views"]
    },
    {
      name: "Pool Deck Grill",
      type: "Outdoor Dining",
      cuisine: "Grilled Specialties",
      hours: "11:00 AM - 9:00 PM",
      location: "Pool Deck",
      rating: 4,
      priceRange: "$$",
      description: "Casual poolside dining featuring grilled favorites and refreshing beverages.",
      specialties: ["BBQ Classics", "Fresh Salads", "Tropical Drinks", "Light Bites"]
    }
  ];

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
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1">
                    <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <MapPin className="h-12 w-12 text-primary mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">{restaurant.location}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <CardHeader>
                      <div className="flex justify-between items-start flex-wrap gap-4">
                        <div>
                          <CardTitle className="font-elegant text-2xl mb-2">{restaurant.name}</CardTitle>
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="secondary">{restaurant.type}</Badge>
                            <Badge variant="outline">{restaurant.cuisine}</Badge>
                            <span className="text-lg font-semibold text-primary">{restaurant.priceRange}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(restaurant.rating)].map((_, i) => (
                              <Star key={i} className="h-4 w-4 text-accent fill-current" />
                            ))}
                            <span className="text-sm text-muted-foreground ml-2">
                              {restaurant.rating}.0 rating
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="flex items-center space-x-2 text-muted-foreground mb-1">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{restaurant.hours}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{restaurant.location}</span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-muted-foreground">{restaurant.description}</p>
                      
                      <div>
                        <h4 className="font-semibold mb-3">Specialties</h4>
                        <div className="flex flex-wrap gap-2">
                          {restaurant.specialties.map((specialty, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button>
                          Make Reservation
                        </Button>
                        <Button variant="outline">
                          View Menu
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
              <Card key={index} className="border-border text-center">
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
              <Button size="lg">
                Explore Wine List
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <Star className="h-20 w-20 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Wine Cellar</p>
                <p className="text-muted-foreground">Premium Collection</p>
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
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Make Reservation
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Contact Concierge
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dining;