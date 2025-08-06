import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Users, Clock, Monitor, Coffee, Wifi, Camera, Calendar } from "lucide-react";
import RoomImageCarousel from '@/components/RoomImageCarousel';

interface ConferenceRoom {
  id: number;
  name: string;
  capacity: number;
  hourly_rate: number;
  description: string;
  features: string[];
  status: 'available' | 'occupied' | 'maintenance';
  images: Array<{
    id: string;
    url: string;
    alt_text?: string;
  }>;
  future_bookings?: Array<{
    start_date: string;
    end_date: string;
    notes: string;
  }>;
}

export default function ConferenceRoomSelection() {
  const [conferenceRooms, setConferenceRooms] = useState<ConferenceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || userRole !== 'Receptionist') {
      navigate('/kabinda-lodge/auth');
      return;
    }
    fetchAvailableConferenceRooms();
  }, [user, userRole]);

  const fetchAvailableConferenceRooms = async () => {
    try {
      console.log('Fetching conference rooms for receptionist...');
      
      // Fetch all conference rooms (like the original Conference.tsx)
      const { data: roomsData, error: roomsError } = await supabase
        .from('conference_rooms')
        .select('*')
        .order('name', { ascending: true });

      if (roomsError) throw roomsError;
      
      console.log('Conference rooms fetched:', roomsData?.length || 0, 'rooms');

      // Get images and future bookings for each room
      const roomsWithDetails = await Promise.all(
        (roomsData || []).map(async (room) => {
          // Fetch images
          const { data: imagesData } = await supabase
            .from('conference_room_images')
            .select('id, image_url, alt_text')
            .eq('conference_room_id', room.id)
            .order('display_order');

          const images = (imagesData || []).map(img => ({
            id: img.id,
            url: img.image_url,
            alt_text: img.alt_text || ''
          }));

          // Fetch future bookings
          const { data: futureBookings } = await supabase
            .from('conference_bookings')
            .select('start_date, end_date, notes')
            .eq('conference_room_id', room.id)
            .eq('status', 'booked')
            .gte('start_date', new Date().toISOString().split('T')[0])
            .order('start_date', { ascending: true })
            .limit(3); // Show up to 3 upcoming bookings

          return {
            ...room,
            images,
            status: room.status as 'available' | 'occupied' | 'maintenance',
            future_bookings: futureBookings || []
          };
        })
      );

      setConferenceRooms(roomsWithDetails);
    } catch (error) {
      console.error('Error fetching conference rooms:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast({
        title: "Error",
        description: "Failed to fetch available conference rooms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (roomId: number) => {
    navigate(`/kabinda-lodge/book-conference/${roomId}`);
  };

  const getFeatureIcon = (feature: string) => {
    const icons: Record<string, typeof Monitor> = {
      "4K Display": Monitor,
      "Video Conferencing": Camera,
      "WiFi": Wifi,
      "High-Speed WiFi": Wifi,
      "Coffee Service": Coffee,
      "Audio System": Monitor,
      "Projector": Monitor,
      "Whiteboard": Monitor,
      "Air Conditioning": Monitor,
      "Natural Lighting": Monitor,
    };
    return icons[feature] || Monitor;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'occupied':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const refreshRooms = () => {
    setLoading(true);
    fetchAvailableConferenceRooms();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading conference rooms...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Conference Room Selection</h1>
            <p className="text-gray-600 mt-2">Select a conference room to book for your client</p>
          </div>
          <Button onClick={refreshRooms} variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {conferenceRooms.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 text-lg">No conference rooms available at the moment.</p>
              <p className="text-gray-400 mt-2">Please check back later or contact management.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {conferenceRooms.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  {room.images && room.images.length > 0 ? (
                    <RoomImageCarousel images={room.images} />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Monitor className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <Badge className={`absolute top-2 right-2 ${getStatusColor(room.status)}`}>
                    {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                  </Badge>
                </div>
                
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {room.name}
                    <span className="text-lg font-semibold text-primary">
                      ${room.hourly_rate}/day
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-600">{room.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      Capacity: {room.capacity} people
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {room.features?.map((feature, index) => {
                        const Icon = getFeatureIcon(feature);
                        return (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <Icon className="w-3 h-3 mr-1" />
                            {feature}
                          </Badge>
                        );
                      })}
                    </div>

                    {room.future_bookings && room.future_bookings.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Upcoming Bookings:</p>
                        <div className="space-y-1">
                          {room.future_bookings.map((booking, index) => (
                            <div key={index} className="text-xs text-gray-600 flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(booking.start_date).toLocaleDateString()} - {booking.notes}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                <CardContent className="pt-0">
                  <Button 
                    onClick={() => handleRoomSelect(room.id)}
                    className="w-full"
                    disabled={room.status !== 'available'}
                  >
                    {room.status === 'available' ? 'Book Conference Room' : 'Not Available'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 