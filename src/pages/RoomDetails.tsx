import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wifi, Tv, Coffee, Bath, Bed, Users, ArrowLeft, Calendar, DollarSign, Wind, Bell, Wine, Building, Laptop, Lock, Sun, Zap, Shirt, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

const RoomDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate id parameter
    if (!id || isNaN(parseInt(id))) {
      console.error("Invalid room id:", id);
      setError("Invalid room ID");
      setLoading(false);
      return;
    }

    const roomIdNum = parseInt(id);

    fetchRoomDetails(roomIdNum);
  }, [id]);

  const fetchRoomDetails = async (id: number) => {
    try {
      setError(null);
  

      // Fetch room data with maybeSingle to handle missing records gracefully
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      

      if (roomError) {
        console.error("Room fetch error:", roomError);
        throw new Error(`Failed to fetch room: ${roomError.message}`);
      }

      if (!roomData) {
        
        setError("Room not found");
        return;
      }

      // Fetch images
      const { data: imagesData, error: imagesError } = await supabase
        .from('room_images')
        .select('id, image_url, alt_text')
        .eq('room_id', id)
        .order('display_order');

      

      if (imagesError) {
        console.error("Images fetch error:", imagesError);
        // Don't throw - continue with empty images array
      }

      const images = (imagesData || []).map(img => ({
        id: img.id,
        url: img.image_url,
        alt_text: img.alt_text || ''
      }));

      // Fetch amenities from room type
      let amenities = [];
      
      try {
        console.log("Fetching amenities for room type:", roomData.type);
        
        // First get the room type based on the room's type
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
          .eq('name', roomData.type)
          .single();

        console.log("Room type query result:", { roomTypeData, roomTypeError });

        if (roomTypeError) {
          console.log("Room type query error:", roomTypeError);
          
          // Fallback: try to get room type without amenities
          const { data: basicRoomType, error: basicError } = await supabase
            .from('room_types')
            .select('id, name')
            .eq('name', roomData.type)
            .single();
            
          console.log("Basic room type query result:", { basicRoomType, basicError });
          
          if (basicRoomType) {
            // Try to get amenities separately
            const { data: amenitiesData, error: amenitiesError } = await supabase
              .from('room_type_amenities')
              .select(`
                amenities(
                  id,
                  name,
                  icon_name,
                  category
                )
              `)
              .eq('room_type_id', basicRoomType.id);
              
            console.log("Separate amenities query result:", { amenitiesData, amenitiesError });
            
            if (amenitiesData) {
              amenities = amenitiesData
                .map((item: any) => item.amenities)
                .filter(Boolean) as Amenity[];
            }
          }
        } else if (roomTypeData) {
          console.log("Room type data found:", roomTypeData);
          amenities = roomTypeData.room_type_amenities
            ?.map((rta: any) => rta.amenities)
            .filter(Boolean) as Amenity[] || [];
        }
        
        console.log("Final amenities array:", amenities);
      } catch (error) {
        console.log("Room type amenities functionality not available yet:", error);
        amenities = [];
      }

      const finalRoom = {
        ...roomData,
        images,
        amenities
      };

      
      setRoom(finalRoom);
    } catch (error: unknown) {
      console.error("fetchRoomDetails error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to load room details";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
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

  const handleBookNow = () => {
    if (room) {
      navigate(`/kabinda-lodge/book-room/${room.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
        <div className="container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading room details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">
              {error || "Room Not Found"}
            </h1>
            <p className="text-muted-foreground mb-6">
              {error ? "There was an error loading the room details." : "The requested room could not be found."}
            </p>
            <Button onClick={() => navigate('/kabinda-lodge/rooms')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Rooms
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const capacity = getCapacityFromType(room.type);
  const features = getRoomFeatures(room.amenities || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
      <div className="container max-w-6xl">
        {/* Back Button */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate('/kabinda-lodge/rooms')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rooms
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <RoomImageCarousel 
                images={room.images} 
                roomName={room.name}
              />
            </Card>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{room.name}</CardTitle>
                    <Badge className="bg-primary/90 text-primary-foreground mb-4">
                      {room.type}
                    </Badge>
                    <div className="flex items-center text-muted-foreground text-lg mb-4">
                      <Users className="h-5 w-5 mr-2" />
                      <span>Up to {capacity} guests</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-4xl font-bold text-primary mb-2">
                      <DollarSign className="h-8 w-8" />
                      {room.price}
                    </div>
                    <div className="text-lg text-muted-foreground">per night</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {room.description && (
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Description</h3>
                    <p className="text-muted-foreground text-lg leading-relaxed">{room.description}</p>
                  </div>
                )}

                <Separator />

                {/* Amenities */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Room Amenities</h3>
                  {features.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {features.map((feature, index) => {
                        const Icon = feature.icon;
                        return (
                          <div key={`amenity-${feature.label}-${index}`} className="flex items-center gap-3 text-muted-foreground">
                            <Icon className="h-5 w-5 text-primary" />
                            <span className="text-base">{feature.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">No amenities available for this room type.</p>
                  )}
                </div>

                <Separator />

                {/* Booking Section */}
                <div className="space-y-4">
                  <Button 
                    className="w-full text-lg py-6"
                    onClick={handleBookNow}
                    disabled={room.status !== 'available'}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    {room.status === 'available' ? 'Book This Room' : 'Room Unavailable'}
                  </Button>
                  
                  {room.status !== 'available' && (
                    <p className="text-center text-muted-foreground text-sm">
                      This room is currently {room.status}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomDetails;