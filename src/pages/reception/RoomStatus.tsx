import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bed, 
  Sparkles, 
  Wrench, 
  CheckCircle, 
  Clock,
  Users,
  DollarSign,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getGuestName } from '@/utils/guestNameUtils';
import { useToast } from '@/hooks/use-toast';
import { filterActiveBookings } from '@/utils/bookingUtils';

interface Room {
  id: number;
  name: string;
  type: string;
  status: string;
  price: number;
  description?: string;
  currentGuest?: string;
  checkOutTime?: string;
  checkInTime?: string;
  manual_override: boolean;
  override_reason?: string | null;
  override_set_at?: string | null;
  override_set_by?: string | null;
}

const statusConfig = {
  available: { 
    label: 'Available', 
    variant: 'default' as const, 
    icon: CheckCircle, 
    color: 'text-green-600' 
  },
  occupied: { 
    label: 'Occupied', 
    variant: 'destructive' as const, 
    icon: Users, 
    color: 'text-red-600' 
  },
  maintenance: { 
    label: 'Maintenance', 
    variant: 'secondary' as const, 
    icon: Wrench, 
    color: 'text-orange-600' 
  },
  cleaning: { 
    label: 'Cleaning', 
    variant: 'outline' as const, 
    icon: Sparkles, 
    color: 'text-blue-600' 
  }
};

export default function RoomStatus() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchRooms();
    fetchUserRole();
  }, []);

  const fetchUserRole = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setUserRole(data.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    }
  };

  const fetchRooms = async () => {
    try {
      setLoading(true);
      
      // First, update room statuses to ensure they reflect current booking expiration (9:30 AM)
      await supabase.rpc('check_expired_bookings');
      
      // Get rooms with current booking information
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('name');

      if (roomsError) throw roomsError;

      // Get current bookings for each room (considering 9:30 AM expiration)
      const roomsWithBookings = await Promise.all(
        rooms.map(async (room) => {
          // Fetch all bookings for this room that might be active (include role to exclude staff)
          const { data: allBookings } = await supabase
            .from('bookings')
            .select('*, user:users(name, role)')
            .eq('room_id', room.id)
            .in('status', ['booked', 'confirmed', 'pending_verification']);

          // Filter to only active bookings (considering 9:30 AM expiration)
          const activeBookings = filterActiveBookings(allBookings || []);
          
          // Get the most relevant current booking (if any)
          const currentBooking = activeBookings.length > 0 ? activeBookings[0] : null;

          // Get guest name - NEVER show staff names
          let guestName = undefined;
          if (currentBooking) {
            guestName = getGuestName(currentBooking, (currentBooking.user as any) || null);
            // Only set if not default "Guest"
            if (guestName === 'Guest') {
              guestName = undefined;
            }
          }

          return {
            ...room,
            currentGuest: guestName,
            checkOutTime: currentBooking?.end_date,
            checkInTime: currentBooking?.start_date
          };
        })
      );

      setRooms(roomsWithBookings);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load room data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateRoomStatus = async (roomId: number, newStatus: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (room?.manual_override) {
      toast({
        title: "Cannot Update",
        description: "This room has manual override enabled. Only admins can change its status.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId);

      if (error) throw error;

      setRooms(rooms.map(room => 
        room.id === roomId ? { ...room, status: newStatus } : room
      ));

      toast({
        title: "Success",
        description: "Room status updated successfully"
      });
    } catch (error) {
      console.error('Error updating room status:', error);
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive"
      });
    }
  };

  const clearRoomOverride = async (roomId: number) => {
    try {
      const { error } = await supabase.rpc('set_room_override', {
        p_room_id: roomId,
        p_override: false,
        p_reason: null
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Manual override cleared successfully"
      });

      fetchRooms();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear override",
        variant: "destructive",
      });
    }
  };

  const filteredRooms = rooms.filter(room => 
    filter === 'all' || room.status === filter
  );

  const getStatusCounts = () => {
    return Object.keys(statusConfig).reduce((acc, status) => {
      acc[status] = rooms.filter(room => room.status === status).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Room Status</h1>
          <p className="text-muted-foreground">Monitor and update room availability and status</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
                      <p className="text-2xl font-bold text-foreground">{statusCounts[status] || 0}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${config.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter */}
        <div className="flex justify-between items-center mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchRooms} disabled={loading}>
            Refresh
          </Button>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredRooms.map((room) => {
              const statusInfo = statusConfig[room.status as keyof typeof statusConfig];
              const StatusIcon = statusInfo?.icon || Bed;
              
              return (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {room.name}
                        {room.manual_override && (
                          <div title={`Manual Override: ${room.override_reason || 'No reason provided'}`}>
                            <Lock className="h-4 w-4 text-orange-500" />
                          </div>
                        )}
                      </CardTitle>
                      <Badge variant={statusInfo?.variant || 'default'}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo?.label || room.status}
                      </Badge>
                    </div>
                    <CardDescription>{room.type}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price per night</span>
                      <span className="font-semibold flex items-center">
                        <DollarSign className="h-4 w-4" />
                        {room.price}
                      </span>
                    </div>
                    
                    {room.currentGuest && (
                      <div className="space-y-2 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Current Guest:</span>
                          <span className="font-medium">{room.currentGuest}</span>
                        </div>
                        {room.checkOutTime && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Check-out:</span>
                            <span>{new Date(room.checkOutTime).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {room.manual_override && room.override_reason && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Lock className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-700">Manual Override Active</span>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">{room.override_reason}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Select
                        value={room.status}
                        onValueChange={(value) => updateRoomStatus(room.id, value)}
                        disabled={room.manual_override}
                      >
                        <SelectTrigger className={`flex-1 ${room.manual_override ? 'opacity-50' : ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="cleaning">Cleaning</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {room.manual_override && userRole === 'Admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearRoomOverride(room.id)}
                          title="Clear manual override"
                        >
                          <Unlock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}