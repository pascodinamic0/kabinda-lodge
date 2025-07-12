import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, MapPin, Star, Calendar } from "lucide-react";

const Experiences = () => {
  const experiences = [
    {
      title: "Spa & Wellness Retreat",
      category: "Wellness",
      duration: "2-4 hours",
      capacity: "1-2 people",
      price: "From $150",
      description: "Rejuvenate your body and mind with our signature spa treatments and wellness programs.",
      features: ["Massage Therapy", "Facial Treatments", "Aromatherapy", "Relaxation Lounge"],
      availability: "Daily"
    },
    {
      title: "Wine Tasting Experience",
      category: "Culinary",
      duration: "90 minutes",
      capacity: "4-12 people",
      price: "From $85",
      description: "Explore our curated wine collection with expert sommelier guidance and gourmet pairings.",
      features: ["Premium Wines", "Expert Guidance", "Cheese Pairings", "Cellar Tour"],
      availability: "Wed-Sun"
    },
    {
      title: "Cooking Masterclass",
      category: "Culinary",
      duration: "3 hours",
      capacity: "6-10 people",
      price: "From $125",
      description: "Learn culinary techniques from our executive chef in an intimate, hands-on setting.",
      features: ["Professional Kitchen", "Recipe Cards", "3-Course Meal", "Wine Pairing"],
      availability: "Weekends"
    },
    {
      title: "City Heritage Tour",
      category: "Cultural",
      duration: "Half Day",
      capacity: "2-8 people",
      price: "From $95",
      description: "Discover the rich history and culture of Paradise City with our expert local guides.",
      features: ["Private Transport", "Expert Guide", "Historical Sites", "Local Insights"],
      availability: "Daily"
    },
    {
      title: "Sunset Rooftop Experience",
      category: "Leisure",
      duration: "2 hours",
      capacity: "2-6 people",
      price: "From $65",
      description: "Enjoy panoramic city views with craft cocktails and gourmet appetizers at sunset.",
      features: ["Panoramic Views", "Craft Cocktails", "Gourmet Canapés", "Live Music"],
      availability: "Daily"
    },
    {
      title: "Adventure & Recreation",
      category: "Active",
      duration: "Full Day",
      capacity: "4-12 people",
      price: "From $180",
      description: "Outdoor adventures including hiking, cycling, and nature exploration with professional guides.",
      features: ["Equipment Included", "Safety Briefing", "Photo Service", "Lunch Included"],
      availability: "Weather Dependent"
    }
  ];

  const amenities = [
    {
      title: "Fitness Center",
      description: "State-of-the-art equipment and personal training",
      icon: Users,
      hours: "24/7"
    },
    {
      title: "Swimming Pool",
      description: "Heated indoor pool with city views",
      icon: MapPin,
      hours: "6 AM - 10 PM"
    },
    {
      title: "Business Center",
      description: "Meeting rooms and conference facilities",
      icon: Calendar,
      hours: "24/7"
    },
    {
      title: "Concierge Services",
      description: "Personalized assistance and local recommendations",
      icon: Star,
      hours: "6 AM - 12 AM"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center">
            <h1 className="font-elegant text-5xl font-bold text-foreground mb-4">
              Experiences & Activities
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Immerse yourself in carefully curated experiences designed to create 
              lasting memories and connect you with the best of our destination.
            </p>
          </div>
        </div>
      </section>

      {/* Experiences Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {experiences.map((experience, index) => (
              <Card key={index} className="border-border hover:shadow-lg transition-shadow">
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 relative rounded-t-lg">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Star className="h-16 w-16 text-primary mx-auto mb-2" />
                      <p className="text-lg font-medium text-foreground">{experience.title}</p>
                    </div>
                  </div>
                  <Badge className="absolute top-4 left-4" variant="secondary">
                    {experience.category}
                  </Badge>
                  <Badge className="absolute top-4 right-4" variant="outline">
                    {experience.availability}
                  </Badge>
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-elegant text-xl">{experience.title}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{experience.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>{experience.capacity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{experience.price}</div>
                      <div className="text-xs text-muted-foreground">per person</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{experience.description}</p>
                  
                  <div>
                    <h4 className="font-semibold mb-3">What's Included</h4>
                    <div className="flex flex-wrap gap-2">
                      {experience.features.map((feature, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button className="flex-1">
                      Book Experience
                    </Button>
                    <Button variant="outline">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-elegant text-4xl font-bold text-foreground mb-4">
              Hotel Amenities
            </h2>
            <p className="text-lg text-muted-foreground">
              Enjoy world-class facilities and services during your stay
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {amenities.map((amenity, index) => (
              <Card key={index} className="border-border text-center">
                <CardContent className="p-6">
                  <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <amenity.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-elegant text-lg font-semibold mb-2">{amenity.title}</h3>
                  <p className="text-muted-foreground text-sm mb-2">{amenity.description}</p>
                  <div className="flex items-center justify-center space-x-1 text-xs text-primary">
                    <Clock className="h-3 w-3" />
                    <span>{amenity.hours}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Seasonal Experiences */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-elegant text-4xl font-bold text-foreground mb-6">
                Seasonal Experiences
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                Our experiences change with the seasons, offering unique opportunities 
                throughout the year. From summer rooftop events to cozy winter 
                celebrations, there's always something special happening at Kabinda Lodge.
              </p>
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Spring & Summer</h4>
                    <p className="text-muted-foreground text-sm">Outdoor adventures, garden parties, rooftop dining</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Fall & Winter</h4>
                    <p className="text-muted-foreground text-sm">Cozy fireside experiences, holiday celebrations, spa retreats</p>
                  </div>
                </div>
              </div>
              <Button size="lg">
                View Seasonal Calendar
              </Button>
            </div>
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg h-96 flex items-center justify-center">
              <div className="text-center">
                <Calendar className="h-20 w-20 text-primary mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground">Seasonal Events</p>
                <p className="text-muted-foreground">Year-round experiences</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <h2 className="font-elegant text-4xl font-bold mb-4">
            Create Unforgettable Memories
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/90">
            Book your perfect experience with our expert concierge team
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
              Browse All Experiences
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Speak to Concierge
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Experiences;