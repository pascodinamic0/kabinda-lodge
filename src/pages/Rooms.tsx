import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Tv, Coffee, Bath, Bed, Users, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import RoomImageCarousel from "@/components/RoomImageCarousel";

interface Amenity {
  id: string;
  name: string;
  icon_name?: string;
  category: string;
}

interface Room {
  id: number;
  name: string;
  type: string;
  price: number;
  description?: string;
  status: string;
  images: Array<{
    id: string;
    url: string;
    alt_text?: string;
  }>;
  amenities: Amenity[];
}

const Rooms = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const handleBookNow = (room: Room) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please create a guest account to continue with your booking.",
        variant: "default",
      });
      navigate('/client-auth');
      return;
    }
    navigate(`/book-room/${room.id}`);
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .eq('status', 'available')
        .order('id');

      if (roomsError) throw roomsError;

      // Fetch images and amenities for each room
      const roomsWithImagesAndAmenities = await Promise.all(
        (roomsData || []).map(async (room) => {
          // Fetch images
          const { data: imagesData } = await supabase
            .from('room_images')
            .select('id, image_url, alt_text')
            .eq('room_id', room.id)
            .order('display_order');

          const images = (imagesData || []).map(img => ({
            id: img.id,
            url: img.image_url,
            alt_text: img.alt_text || ''
          }));

          // Fetch amenities
          const { data: amenitiesData } = await supabase
            .from('room_amenities')
            .select(`
              amenity:amenities(
                id,
                name,
                icon_name,
                category
              )
            `)
            .eq('room_id', room.id);

          const amenities = (amenitiesData || [])
            .map(item => item.amenity)
            .filter(Boolean) as Amenity[];

          return {
            ...room,
            images,
            amenities
          };
        })
      );

      setRooms(roomsWithImagesAndAmenities);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCapacityFromType = (type: string) => {
    if (type.toLowerCase().includes('single')) return 1;
    if (type.toLowerCase().includes('double')) return 2;
    if (type.toLowerCase().includes('family') || type.toLowerCase().includes('suite')) return 4;
    return 2;
  };

  const getRoomFeatures = (type: string) => {
    const features = [
      { icon: Wifi, label: "Free WiFi" },
      { icon: Tv, label: "Smart TV" },
      { icon: Coffee, label: "Coffee Machine" },
      { icon: Bath, label: "Private Bathroom" }
    ];

    if (type.toLowerCase().includes('suite') || type.toLowerCase().includes('executive')) {
      features.push({ icon: Bed, label: "King Size Bed" });
    }

    return features;
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
        <div className="container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Rooms & Suites
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Experience comfort and luxury in our thoughtfully designed accommodations
          </p>
        </div>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <div className="text-center">
            <p className="text-muted-foreground">No rooms available at the moment.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {rooms.map((room) => {
              const capacity = getCapacityFromType(room.type);
              const features = getRoomFeatures(room.type);

              return (
                <Card key={room.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 animate-fade-in group">
                  <div className="relative">
                    <RoomImageCarousel 
                      images={room.images} 
                      roomName={room.name}
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-primary/90 text-primary-foreground">
                        {room.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{room.name}</CardTitle>
                        <div className="flex items-center text-muted-foreground text-sm mb-2">
                          <Users className="h-4 w-4 mr-1" />
                          <span>Up to {capacity} guests</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">${room.price}</div>
                        <div className="text-sm text-muted-foreground">per night</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {room.description && (
                      <p className="text-muted-foreground">{room.description}</p>
                    )}
                    
                    {/* Features */}
                    <div className="flex flex-wrap gap-3">
                      {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                          <div key={`feature-${feature.label}-${index}`} className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Icon className="h-4 w-4" />
                            <span>{feature.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Amenities */}
                    {room.amenities && room.amenities.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Amenities</h4>
                        <div className="flex flex-wrap gap-1">
                          {room.amenities.map((amenity) => (
                            <Badge key={amenity.id} variant="secondary" className="text-xs">
                              {amenity.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => handleBookNow(room)}
                      >
                        Book Now
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/room/${room.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Additional Information Section */}
        <div className="bg-card rounded-lg p-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Our Rooms?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Complimentary WiFi</h3>
              <p className="text-muted-foreground">Stay connected with high-speed internet access throughout your stay</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">In-Room Dining</h3>
              <p className="text-muted-foreground">Enjoy delicious meals in the comfort of your room with our 24/7 room service</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bath className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Luxury Bathrooms</h3>
              <p className="text-muted-foreground">Unwind in our spacious bathrooms with premium amenities and fixtures</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;