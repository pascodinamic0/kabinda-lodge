import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useRealtimeBookings, useRealtimeRooms } from '@/hooks/useRealtimeData';
import { parse, format } from 'date-fns';
interface Room {
  id: number;
  name: string;
  type: string;
  price: number;
  status: string;
  description?: string;
  manual_override: boolean;
  override_set_at?: string | null;
  future_bookings?: Array<{
    start_date: string;
    end_date: string;
    notes: string;
  }>;
}

export default function RoomSelection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [restrictedRooms, setRestrictedRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const todayLocal = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    if (!user) {
      navigate('/kabinda-lodge/auth');
      return;
    }
    fetchAvailableRooms();
  }, [user]);

  const fetchAvailableRooms = async () => {
    try {
      const today = todayLocal();

      // Active bookings covering today (booked or confirmed)
      const { data: activeBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('room_id')
        .in('status', ['booked', 'confirmed'])
        .lte('start_date', today)
        .gte('end_date', today);

      if (bookingError) throw bookingError;

      const activeRoomIds = (activeBookings || []).map((b) => b.room_id);

      // Fetch only available rooms and exclude those currently booked for today AND not overridden
      let roomsQuery = supabase
        .from('rooms')
        .select('*')
        .eq('status', 'available')
        .eq('manual_override', false)
        .order('type', { ascending: true });

      if (activeRoomIds.length > 0) {
        roomsQuery = roomsQuery.not('id', 'in', `(${activeRoomIds.join(',')})`);
      }

      const { data: roomsData, error: roomsError } = await roomsQuery;
      if (roomsError) throw roomsError;

      const roomIds = (roomsData || []).map((r) => r.id);
      let futureBookingsByRoom: Record<number, Array<{ start_date: string; end_date: string; notes: string }>> = {};

      if (roomIds.length > 0) {
        const { data: futureBookings, error: futureErr } = await supabase
          .from('bookings')
          .select('room_id, start_date, end_date, notes, status')
          .in('status', ['booked', 'confirmed'])
          .in('room_id', roomIds)
          .gte('start_date', today)
          .order('start_date', { ascending: true });

        if (futureErr) throw futureErr;

        futureBookingsByRoom = (futureBookings || []).reduce((acc, b: any) => {
          const rid = b.room_id as number;
          if (!acc[rid]) acc[rid] = [];
          acc[rid].push({ start_date: b.start_date as string, end_date: b.end_date as string, notes: b.notes || '' });
          return acc;
        }, {} as Record<number, Array<{ start_date: string; end_date: string; notes: string }>>);
      }

      const roomsWithBookings = (roomsData || []).map((room) => ({
        ...room,
        future_bookings: (futureBookingsByRoom[room.id] || []).slice(0, 3),
      }));

      setRooms(roomsWithBookings);

      // Fetch restricted rooms (manual override = true) for display
      const { data: restrictedRoomsData, error: restrictedError } = await supabase
        .from('rooms')
        .select('*')
        .eq('manual_override', true)
        .order('type', { ascending: true });

      if (restrictedError) throw restrictedError;
      
      setRestrictedRooms(restrictedRoomsData || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch available rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleRoomSelect = (roomId: number) => {
    navigate(`/kabinda-lodge/book-room/${roomId}`);
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
          <>
            {/* Available Rooms Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Available Rooms</h2>
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
                  
                  {/* Future Bookings Display */}
                  {room.future_bookings && room.future_bookings.length > 0 && (
                    <div className="mb-4 p-2 bg-orange-50 rounded-md border border-orange-200">
                      <p className="text-xs font-medium text-orange-800 mb-1">Future Bookings:</p>
                      {room.future_bookings.slice(0, 2).map((booking, index) => (
                        <div key={index} className="text-xs text-orange-700">
                          📅 {format(parse(booking.start_date, 'yyyy-MM-dd', new Date()), 'PP')} - {format(parse(booking.end_date, 'yyyy-MM-dd', new Date()), 'PP')}
                        </div>
                      ))}
                      {room.future_bookings.length > 2 && (
                        <p className="text-xs text-orange-600 mt-1">+{room.future_bookings.length - 2} more</p>
                      )}
                    </div>
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
            </div>

            {/* Restricted Rooms Section */}
            {restrictedRooms.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Currently Unavailable</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {restrictedRooms.map((room) => (
                    <Card 
                      key={room.id} 
                      className="opacity-60 cursor-not-allowed bg-muted/30"
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-muted-foreground">{room.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{room.type}</p>
                          </div>
                          <Badge 
                            variant="secondary"
                            className="ml-2 bg-muted text-muted-foreground"
                          >
                            Not Available
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
                            <span className="text-2xl font-bold text-muted-foreground">${room.price}</span>
                            <span className="text-sm text-muted-foreground">/night</span>
                          </div>
                          <Button 
                            size="sm"
                            disabled
                            variant="secondary"
                          >
                            Unavailable
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}