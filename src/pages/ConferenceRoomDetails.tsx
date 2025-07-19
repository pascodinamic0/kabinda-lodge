import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, ArrowLeft, Calendar, DollarSign, Clock, Monitor, Coffee, Wifi, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import RoomImageCarousel from "@/components/RoomImageCarousel";

interface ConferenceRoom {
  id: number;
  name: string;
  capacity: number;
  hourly_rate: number;
  description?: string;
  features: string[];
  status: string;
  images: Array<{
    id: string;
    url: string;
    alt_text?: string;
  }>;
}

const ConferenceRoomDetails = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [room, setRoom] = useState<ConferenceRoom | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails(parseInt(roomId));
    }
  }, [roomId]);

  const fetchRoomDetails = async (id: number) => {
    try {
      // Fetch conference room data
      const { data: roomData, error: roomError } = await supabase
        .from('conference_rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (roomError) throw roomError;

      // Fetch images
      const { data: imagesData } = await supabase
        .from('conference_room_images')
        .select('id, image_url, alt_text')
        .eq('conference_room_id', id)
        .order('display_order');

      const images = (imagesData || []).map(img => ({
        id: img.id,
        url: img.image_url,
        alt_text: img.alt_text || ''
      }));

      setRoom({
        ...roomData,
        images
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load conference room details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFeatureIcon = (feature: string) => {
    const icons: Record<string, typeof Monitor> = {
      "4K Display": Monitor,
      "Video Conferencing": Camera,
      "WiFi": Wifi,
      "High-Speed WiFi": Wifi,
      "Coffee Service": Coffee,
      "Coffee Machine": Coffee,
      "Premium Audio": Monitor,
    };
    return icons[feature] || Monitor;
  };

  const handleBookNow = () => {
    if (!user) {
      navigate('/client-auth', { 
        state: { from: `/conference/${room?.id}` }
      });
      return;
    }
    if (room) {
      navigate(`/book-conference/${room.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
        <div className="container">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading conference room details...</p>
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
            <h1 className="text-2xl font-bold mb-4">Conference Room Not Found</h1>
            <Button onClick={() => navigate('/conference')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Conference Rooms
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 py-12">
      <div className="container max-w-6xl">
        {/* Back Button */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => navigate('/conference')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Conference Rooms
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image Section */}
          <div className="space-y-6">
            <Card className="overflow-hidden">
              {room.images.length > 0 ? (
                <RoomImageCarousel 
                  images={room.images} 
                  roomName={room.name}
                />
              ) : (
                <div className="w-full h-96 bg-muted flex items-center justify-center">
                  <Camera className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
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
                      Conference Room
                    </Badge>
                    <div className="flex items-center text-muted-foreground text-lg mb-4">
                      <Users className="h-5 w-5 mr-2" />
                      <span>Up to {room.capacity} people</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-4xl font-bold text-primary mb-2">
                      <DollarSign className="h-8 w-8" />
                      {room.hourly_rate}
                    </div>
                    <div className="text-lg text-muted-foreground">per hour</div>
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
                    {room.features.map((feature, index) => {
                      const IconComponent = getFeatureIcon(feature);
                      return (
                        <div key={`feature-${feature}-${index}`} className="flex items-center gap-3 text-muted-foreground">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <span className="text-base">{feature}</span>
                        </div>
                      );
                    })}
                  </div>
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
                    {room.status === 'available' ? 'Book This Conference Room' : 'Room Unavailable'}
                  </Button>
                  
                  {room.status !== 'available' && (
                    <p className="text-center text-muted-foreground text-sm">
                      This conference room is currently {room.status}
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

export default ConferenceRoomDetails;