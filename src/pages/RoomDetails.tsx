import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Wifi, Tv, Coffee, Bath, Bed, Users, ArrowLeft, Calendar, DollarSign } from "lucide-react";
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
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails(parseInt(roomId));
    }
  }, [roomId]);

  const fetchRoomDetails = async (id: number) => {
    try {
      // Fetch room data
      const { data: roomData, error: roomError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (roomError) throw roomError;

      // Fetch images
      const { data: imagesData } = await supabase
        .from('room_images')
        .select('id, image_url, alt_text')
        .eq('room_id', id)
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
        .eq('room_id', id);

      const amenities = (amenitiesData || [])
        .map(item => item.amenity)
        .filter(Boolean) as Amenity[];

      setRoom({
        ...roomData,
        images,
        amenities
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load room details",
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

  const handleBookNow = () => {
    if (room) {
      navigate(`/book-room/${room.id}`);
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

  if (!room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
        <div className="container">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Room Not Found</h1>
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
  const features = getRoomFeatures(room.type);

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

                {/* Features */}
                <div>
                  <h3 className="font-semibold text-lg mb-4">Room Features</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {features.map((feature, index) => {
                      const Icon = feature.icon;
                      return (
                        <div key={`feature-${feature.label}-${index}`} className="flex items-center gap-3 text-muted-foreground">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="text-base">{feature.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Amenities */}
                {room.amenities && room.amenities.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-4">Additional Amenities</h3>
                      <div className="flex flex-wrap gap-2">
                        {room.amenities.map((amenity) => (
                          <Badge key={amenity.id} variant="secondary" className="text-sm px-3 py-1">
                            {amenity.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

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