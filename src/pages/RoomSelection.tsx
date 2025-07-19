import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Room {
  id: number;
  name: string;
  type: string;
  price: number;
  status: string;
  description?: string;
}

export default function RoomSelection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/client-auth');
      return;
    }
    fetchAvailableRooms();
  }, [user]);

  const fetchAvailableRooms = async () => {
    try {
      // Get all rooms that don't have active bookings
      const { data, error } = await supabase
        .from('rooms')
        .select(`
          *
        `)
        .not('id', 'in', `(
          SELECT DISTINCT room_id 
          FROM bookings 
          WHERE status = 'booked' 
          AND start_date <= CURRENT_DATE 
          AND end_date >= CURRENT_DATE
        )`)
        .order('type', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available rooms",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoomSelect = (roomId: number) => {
    navigate(`/book-room/${roomId}`);
  };

  const refreshRooms = () => {
    setLoading(true);
    fetchAvailableRooms();
  };

  if (loading) {
    return (
      <DashboardLayout title="Select Room">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading available rooms...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Select Room for Booking">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold">Select a Room</h1>
            <p className="text-muted-foreground mt-2">Choose from our available rooms to proceed with booking</p>
          </div>
          <Button onClick={refreshRooms} variant="outline" disabled={loading}>
            {loading ? "Refreshing..." : "Refresh Rooms"}
          </Button>
        </div>

        {rooms.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Available Rooms</h3>
                <p className="text-muted-foreground mb-4">All rooms are currently occupied. Please check back later or try refreshing.</p>
                <Button onClick={refreshRooms} variant="outline">
                  Refresh Rooms
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Card 
                key={room.id} 
                className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105"
                onClick={() => handleRoomSelect(room.id)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{room.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{room.type}</p>
                    </div>
                    <Badge 
                      variant={room.status === 'available' ? 'default' : 'secondary'}
                      className="ml-2"
                    >
                      {room.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {room.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {room.description}
                    </p>
                  )}
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-2xl font-bold">${room.price}</span>
                      <span className="text-sm text-muted-foreground">/night</span>
                    </div>
                    <Button 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRoomSelect(room.id);
                      }}
                    >
                      Book Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}