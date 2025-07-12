import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Star, Users, MapPin, Wifi, Car, Coffee, Shield } from "lucide-react";

const Home = () => {
  const features = [
    { icon: Star, title: "Luxury Suites", description: "Elegant rooms with premium amenities" },
    { icon: Users, title: "Concierge Service", description: "24/7 personalized assistance" },
    { icon: Coffee, title: "Fine Dining", description: "World-class cuisine and beverages" },
    { icon: Wifi, title: "High-Speed WiFi", description: "Complimentary throughout property" },
    { icon: Car, title: "Valet Parking", description: "Secure and convenient parking" },
    { icon: Shield, title: "Premium Security", description: "Your safety is our priority" },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "New York",
      rating: 5,
      comment: "Absolutely exceptional experience. The attention to detail and service quality exceeded all expectations."
    },
    {
      name: "Michael Chen",
      location: "San Francisco",
      rating: 5,
      comment: "Perfect for our anniversary getaway. The staff made every moment special and memorable."
    },
    {
      name: "Emma Rodriguez",
      location: "Los Angeles",
      rating: 5,
      comment: "Stunning property with incredible amenities. Will definitely be returning with family."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[80vh] bg-gradient-to-br from-primary/10 to-accent/10 flex items-center">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="font-elegant text-5xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
              Welcome to
              <span className="text-primary block">Kabinda Lodge</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Where luxury meets comfort in an unforgettable hospitality experience. 
              Discover premium accommodations, exceptional dining, and personalized service 
              that creates lasting memories.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg px-8 py-6" asChild>
                <Link to="/rooms">
                  Explore Rooms
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6" asChild>
                <Link to="/contact">Book Your Stay</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-elegant text-4xl font-bold text-foreground mb-4">
              Premium Amenities & Services
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience world-class facilities and personalized service designed to exceed your expectations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-elegant text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-elegant text-4xl font-bold text-foreground mb-6">
                A Legacy of Excellence
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                For over two decades, Kabinda Lodge has been synonymous with luxury, 
                comfort, and exceptional hospitality. Our commitment to creating 
                unforgettable experiences has made us a preferred destination for 
                discerning travelers worldwide.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Every detail of your stay is carefully curated by our dedicated team, 
                from the moment you arrive until your departure. We believe that true 
                luxury lies in the perfect balance of comfort, service, and authentic experiences.
              </p>
              <Button size="lg" asChild>
                <Link to="/about">
                  Learn More About Us
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-20 w-20 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Beautiful Location</p>
                <p className="text-muted-foreground">Stunning views await you</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-elegant text-4xl font-bold text-foreground mb-4">
              What Our Guests Say
            </h2>
            <p className="text-lg text-muted-foreground">
              Discover why guests choose Kabinda Lodge for their most important moments
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-border">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-accent fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.comment}"</p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="font-elegant text-4xl font-bold mb-4">
            Ready for Your Perfect Stay?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Book your luxury experience at Kabinda Lodge today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6" asChild>
              <Link to="/rooms">View Availability</Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;