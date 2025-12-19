
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Tv, Coffee, Bath, Bed, Users, MapPin, Wind, Bell, Wine, Building, Laptop, Lock, Sun, Zap, Shirt, Phone } from "lucide-react";
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

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw roomsError;
      }

      if (!roomsData || roomsData.length === 0) {
        setRooms([]);
        setLoading(false);
        return;
      }

      // Fetch images and amenities for each room
      const roomsWithImagesAndAmenities = await Promise.all(
        roomsData.map(async (room) => {
          // Fetch images
          const { data: imagesData, error: imagesError } = await supabase
            .from('room_images')
            .select('id, image_url, alt_text')
            .eq('room_id', room.id)
            .order('display_order');

          if (imagesError) {
            console.error(`Error fetching images for room ${room.id}:`, imagesError);
          }

          const images = (imagesData || []).map(img => ({
            id: img.id,
            url: img.image_url,
            alt_text: img.alt_text || ''
          }));

          // Fetch amenities from room type
          let amenities = [];
          try {
            const { data: roomTypeData, error: roomTypeError } = await supabase
              .from('room_types')
              .select(`
                id,
                name,
                room_type_amenities(
                  amenities(
                    id,
                    name,
                    icon_name,
                    category
                  )
                )
              `)
              .eq('name', room.type)
              .single();

          // Room type amenities functionality not available yet  
          amenities = [];
          } catch (error) {
            console.log('Room type amenities functionality not available yet');
          }

          return {
            ...room,
            images,
            amenities
          };
        })
      );

      setRooms(roomsWithImagesAndAmenities);
    } catch (error) {
      console.error('Error in fetchRooms:', error);
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

  const getIconForAmenity = (iconName: string | null | undefined) => {
    const iconMap: Record<string, any> = {
      // Lowercase mappings
      'wifi': Wifi,
      'tv': Tv,
      'coffee': Coffee,
      'bath': Bath,
      'bed': Bed,
      'wind': Wind,
      'bell': Bell,
      'wine': Wine,
      'building': Building,
      'laptop': Laptop,
      'lock': Lock,
      'sun': Sun,
      'zap': Zap,
      'shirt': Shirt,
      'phone': Phone,
      'users': Users,
      // Uppercase mappings (from AmenitiesModal)
      'Wifi': Wifi,
      'Tv': Tv,
      'Coffee': Coffee,
      'Bath': Bath,
      'Bed': Bed,
      'Wind': Wind,
      'Bell': Bell,
      'Wine': Wine,
      'Building': Building,
      'Laptop': Laptop,
      'Lock': Lock,
      'Sun': Sun,
      'Zap': Zap,
      'Shirt': Shirt,
      'Phone': Phone,
      'Users': Users,
      // Additional mappings from AmenitiesModal
      'Monitor': Tv,
      'Mic': Phone,
      'Car': Building,
      'Snowflake': Wind,
      'Lightbulb': Sun,
      'Presentation': Tv,
      'Volume2': Bell,
      'Camera': Phone,
      'Printer': Laptop,
      'Shield': Lock,
      'Utensils': Coffee,
      'Clock': Bell,
      'MapPin': Building
    };
    
    return iconMap[iconName || ''] || Wifi; // Default to Wifi icon if not found
  };

  const getRoomFeatures = (amenities: Amenity[]) => {
    // Use only amenities from room type (no hardcoded features)
    return amenities.map(amenity => ({
      icon: getIconForAmenity(amenity.icon_name),
      label: amenity.name
    }));
  };

  const getDescriptionPreview = (description: string, maxLength: number = 120) => {
    if (!description || description.length <= maxLength) {
      return description;
    }
    
    // Find the last complete word within the limit
    const truncated = description.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > 0) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
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
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 padding-responsive">
      <div className="container-responsive">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 animate-fade-in">
          <h1 className="font-elegant text-responsive-5xl font-bold text-foreground mb-4">
            Our Rooms & Suites
          </h1>
          <p className="text-responsive-xl text-muted-foreground max-w-2xl mx-auto">
            Experience comfort and luxury in our thoughtfully designed accommodations
          </p>
        </div>

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <div className="text-center">
            <p className="text-responsive-base text-muted-foreground">No rooms available at the moment.</p>
          </div>
        ) : (
          <div className="grid-adaptive mb-12 sm:mb-16 animate-stagger">
            {rooms.map((room, index) => {
                                  const capacity = getCapacityFromType(room.type);
                    const features = getRoomFeatures(room.amenities || []);

              return (
                <Card key={room.id} className="card-responsive hover:shadow-xl transition-all duration-300 group" style={{"--stagger-index": index} as React.CSSProperties}>
                  <div className="relative">
                    {room.images.length > 0 ? (
                      <RoomImageCarousel 
                        images={room.images} 
                        roomName={room.name}
                      />
                    ) : (
                      <div className="w-full h-64 bg-muted flex items-center justify-center rounded-t-lg">
                        <div className="text-center">
                          <Bed className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">No images available</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                      <Badge className="bg-primary/90 text-primary-foreground text-xs sm:text-sm">
                        {room.type}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-responsive-xl mb-2">{room.name}</CardTitle>
                        <div className="flex items-center text-muted-foreground text-xs sm:text-sm mb-2">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          <span>Up to {capacity} guests</span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-xl sm:text-2xl font-bold text-primary">${room.price}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">per night</div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="card-content-grow p-4 sm:p-6 space-y-4">
                    {room.description && (
                      <p className="text-responsive-sm text-muted-foreground">{getDescriptionPreview(room.description)}</p>
                    )}
                    
                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {features.length > 0 ? (
                        features.map((feature, featureIndex) => {
                          const Icon = feature.icon;
                          return (
                            <div key={`amenity-${feature.label}-${featureIndex}`} className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                              <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                              <span>{feature.label}</span>
                            </div>
                          );
                        })
                      ) : (
                        <span className="text-xs sm:text-sm text-muted-foreground">No amenities</span>
                      )}
                    </div>

                    
                    <div className="space-y-2 pt-2">
                      <Button 
                        className="w-full touch-manipulation"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                  
                          handleBookNow(room);
                        }}
                      >
                        Book Now
                      </Button>
                      <Button 
                        variant="outline"
                        className="w-full touch-manipulation"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                  
                          navigate(`/rooms/${room.id}`);
                        }}
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
        <div className="bg-card rounded-lg padding-responsive animate-fade-in">
          <h2 className="font-elegant text-responsive-2xl font-bold text-center mb-6 sm:mb-8">Why Choose Our Rooms?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wifi className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-responsive-lg font-semibold mb-2">Complimentary WiFi</h3>
              <p className="text-responsive-sm text-muted-foreground">Stay connected with high-speed internet access throughout your stay</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Coffee className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-responsive-lg font-semibold mb-2">In-Room Dining</h3>
              <p className="text-responsive-sm text-muted-foreground">Enjoy delicious meals in the comfort of your room with our 24/7 room service</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bath className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-responsive-lg font-semibold mb-2">Luxury Bathrooms</h3>
              <p className="text-responsive-sm text-muted-foreground">Unwind in our spacious bathrooms with premium amenities and fixtures</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;
