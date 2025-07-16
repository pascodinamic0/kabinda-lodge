import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Tv, Coffee, Bath, Bed, Users, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Rooms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBookNow = (room: any) => {
    // Navigate to booking page
    navigate(`/book-room/${room.id}`);
  };

  const rooms = [
    {
      id: 1,
      name: "Executive Suite",
      type: "Suite",
      price: 299,
      capacity: 2,
      size: "450 sq ft",
      description: "Elegant suite with separate living area, premium amenities, and city views.",
      amenities: ["King Bed", "Living Area", "City View", "Mini Bar", "Work Desk"],
      features: [Wifi, Tv, Coffee, Bath]
    },
    {
      id: 2,
      name: "Presidential Suite",
      type: "Premium Suite",
      price: 499,
      capacity: 4,
      size: "750 sq ft",
      description: "Our most luxurious accommodation with panoramic views and exclusive amenities.",
      amenities: ["Master Bedroom", "Dining Room", "Panoramic View", "Private Balcony", "Butler Service"],
      features: [Wifi, Tv, Coffee, Bath]
    },
    {
      id: 3,
      name: "Deluxe Room",
      type: "Room",
      price: 199,
      capacity: 2,
      size: "320 sq ft",
      description: "Comfortable and stylish room with modern amenities and garden views.",
      amenities: ["Queen Bed", "Garden View", "Sitting Area", "Mini Fridge", "Safe"],
      features: [Wifi, Tv, Coffee, Bath]
    },
    {
      id: 4,
      name: "Family Suite",
      type: "Suite",
      price: 399,
      capacity: 6,
      size: "600 sq ft",
      description: "Spacious family accommodation with separate bedrooms and connecting areas.",
      amenities: ["2 Bedrooms", "Living Room", "Kitchenette", "Sofa Bed", "Family Games"],
      features: [Wifi, Tv, Coffee, Bath]
    },
    {
      id: 5,
      name: "Standard Room",
      type: "Room",
      price: 149,
      capacity: 2,
      size: "280 sq ft",
      description: "Comfortable room with essential amenities and courtyard views.",
      amenities: ["Double Bed", "Courtyard View", "Work Area", "Mini Fridge", "Iron"],
      features: [Wifi, Tv, Coffee]
    },
    {
      id: 6,
      name: "Penthouse Suite",
      type: "Luxury Suite",
      price: 799,
      capacity: 4,
      size: "1200 sq ft",
      description: "Ultimate luxury with private terrace, spa bathroom, and concierge service.",
      amenities: ["Master Suite", "Private Terrace", "Spa Bathroom", "Dining Room", "Personal Concierge"],
      features: [Wifi, Tv, Coffee, Bath]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/10 to-accent/10 py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="text-center">
            <h1 className="font-elegant text-5xl font-bold text-foreground mb-4">
              Rooms & Suites
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover our collection of thoughtfully designed accommodations, 
              each offering a unique blend of comfort, luxury, and modern amenities.
            </p>
          </div>
        </div>
      </section>

      {/* Rooms Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {rooms.map((room) => (
              <Card key={room.id} className="overflow-hidden border-border hover:shadow-lg transition-shadow">
                <div className="aspect-[4/3] bg-gradient-to-br from-muted to-muted/50 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Bed className="h-16 w-16 text-primary mx-auto mb-2" />
                      <p className="text-lg font-medium text-foreground">{room.name}</p>
                    </div>
                  </div>
                  <Badge className="absolute top-4 left-4" variant="secondary">
                    {room.type}
                  </Badge>
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="font-elegant text-2xl">{room.name}</CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center space-x-1">
                          <Users className="h-4 w-4" />
                          <span>Up to {room.capacity} guests</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span>{room.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-primary">${room.price}</div>
                      <div className="text-sm text-muted-foreground">per night</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <p className="text-muted-foreground">{room.description}</p>
                  
                  {/* Features Icons */}
                  <div className="flex space-x-4">
                    {room.features.map((Feature, index) => (
                      <div key={index} className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Feature className="h-5 w-5 text-primary" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Amenities */}
                  <div>
                    <h4 className="font-semibold mb-3">Room Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => handleBookNow(room)}
                  >
                    Book Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Info Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-elegant text-xl font-semibold mb-2">Complimentary WiFi</h3>
              <p className="text-muted-foreground">High-speed internet access throughout your stay</p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-elegant text-xl font-semibold mb-2">In-Room Dining</h3>
              <p className="text-muted-foreground">24/7 room service with gourmet options</p>
            </div>
            
            <div className="text-center">
              <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bath className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-elegant text-xl font-semibold mb-2">Luxury Bathrooms</h3>
              <p className="text-muted-foreground">Premium toiletries and spa-quality amenities</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Rooms;