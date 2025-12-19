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
import { parse, format, addDays } from 'date-fns';
import { filterActiveBookings, isBookingActive } from '@/utils/bookingUtils';
import { Calendar, Filter, AlertCircle, CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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
    guest_name?: string;
  }>;
  is_available_for_dates?: boolean;
  current_booking?: {
    start_date: string;
    end_date: string;
    guest_name: string;
    notes: string;
  } | null;
}

interface Activity {
  id: number;
  room_name: string;
  room_type: string;
  guest_name?: string;
  booking_type: 'hotel' | 'conference';
  start_date: string;
  end_date: string;
  notes?: string;
}

export default function RoomSelection() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]); // Store all rooms for filtering
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'booked'>('available');
  const [activitiesOnDate, setActivitiesOnDate] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
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
      navigate('/auth');
      return;
    }
    fetchAvailableRooms();
  }, [user]);

  useEffect(() => {
    // Fetch activities when date is selected
    if (selectedDate) {
      fetchActivitiesOnDate(selectedDate);
    } else {
      setActivitiesOnDate([]);
    }
  }, [selectedDate]);

  useEffect(() => {
    // Filter rooms based on status filter
    if (allRooms.length > 0) {
      filterRoomsByStatus();
    }
  }, [filterStatus, allRooms]);

  const fetchAvailableRooms = async () => {
    try {
      setLoading(true);
      // First, update room statuses to ensure they reflect current booking expiration (9:30 AM)
      await supabase.rpc('check_expired_bookings');

      const today = todayLocal();
      const checkDate = selectedDate || today;
      const checkEndDate = endDate || checkDate;

      // Fetch ALL rooms (not just available ones)
      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('type', { ascending: true });

      if (roomsError) throw roomsError;

      // Fetch all bookings for the date range
      const { data: allBookings, error: bookingError } = await supabase
        .from('bookings')
        .select('room_id, start_date, end_date, notes, status, users!bookings_user_id_fkey(name)')
        .in('status', ['booked', 'confirmed', 'pending_verification']);

      if (bookingError) throw bookingError;

      // For each room, determine if it's available for the selected date range
      const roomsWithDetails = (roomsData || []).map((room) => {
        // Get bookings for this room
        const roomBookings = (allBookings || []).filter((b) => b.room_id === room.id);
        
        // Check if room has active booking for selected date
        const hasActiveBooking = roomBookings.some((booking) => {
          // Check if booking overlaps with selected date range
          return checkDate <= booking.end_date && checkEndDate >= booking.start_date &&
                 isBookingActive(booking.start_date, booking.end_date, booking.status);
        });

        // Get future bookings
        const futureBookings = roomBookings
          .filter((b) => 
            b.start_date >= today && 
            isBookingActive(b.start_date, b.end_date, b.status)
          )
          .slice(0, 3)
          .map((b) => ({
            start_date: b.start_date,
            end_date: b.end_date,
            notes: b.notes || '',
            guest_name: b.users?.name || 'Unknown Guest'
          }));

        // Current booking (if any)
        const currentBooking = roomBookings.find((b) => 
          isBookingActive(b.start_date, b.end_date, b.status) &&
          b.start_date <= today &&
          b.end_date >= today
        );

        return {
          ...room,
          future_bookings: futureBookings,
          is_available_for_dates: !hasActiveBooking && !room.manual_override,
          current_booking: currentBooking ? {
            start_date: currentBooking.start_date,
            end_date: currentBooking.end_date,
            guest_name: currentBooking.users?.name || 'Guest',
            notes: currentBooking.notes || ''
          } : null,
        };
      });

      setAllRooms(roomsWithDetails);
      // Initial filter - will be applied by useEffect
      filterRoomsByStatusWithData(roomsWithDetails);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const filterRoomsByStatus = () => {
    filterRoomsByStatusWithData(allRooms);
  };

  const filterRoomsByStatusWithData = (roomsData: any[]) => {
    let filtered = roomsData;

    if (filterStatus === 'available') {
      filtered = roomsData.filter((room) => room.is_available_for_dates);
    } else if (filterStatus === 'booked') {
      filtered = roomsData.filter((room) => !room.is_available_for_dates || room.current_booking);
    }
    // 'all' shows everything

    setRooms(filtered);
  };

  const fetchActivitiesOnDate = async (date: string) => {
    try {
      setLoadingActivities(true);
      
      // Fetch hotel room bookings for the date
      const { data: hotelBookings, error: hotelError } = await supabase
        .from('bookings')
        .select('id, room_id, start_date, end_date, notes, status, rooms(name, type), users!bookings_user_id_fkey(name)')
        .in('status', ['booked', 'confirmed', 'pending_verification'])
        .lte('start_date', date)
        .gte('end_date', date);

      if (hotelError) throw hotelError;

      // Fetch conference room bookings for the date
      const { data: conferenceBookings, error: conferenceError } = await supabase
        .from('conference_bookings')
        .select('id, conference_room_id, start_datetime, end_datetime, notes, status, guest_name, conference_rooms(name)')
        .eq('status', 'booked')
        .lte('start_datetime', `${date}T23:59:59`)
        .gte('end_datetime', `${date}T00:00:00`);

      if (conferenceError) throw conferenceError;

      // Combine and format activities
      const activities: Activity[] = [
        ...(hotelBookings || [])
          .filter((b) => isBookingActive(b.start_date, b.end_date, b.status))
          .map((b) => ({
            id: b.id,
            room_name: b.rooms?.name || 'Unknown Room',
            room_type: b.rooms?.type || 'Hotel Room',
            guest_name: b.users?.name || 'Guest',
            booking_type: 'hotel' as const,
            start_date: b.start_date,
            end_date: b.end_date,
            notes: b.notes || '',
          })),
        ...(conferenceBookings || []).map((b) => ({
          id: b.id,
          room_name: b.conference_rooms?.name || 'Conference Room',
          room_type: 'Conference',
          guest_name: b.guest_name || 'Event',
          booking_type: 'conference' as const,
          start_date: b.start_datetime.split('T')[0],
          end_date: b.end_datetime.split('T')[0],
          notes: b.notes || '',
        })),
      ];

      setActivitiesOnDate(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch activities for the selected date",
        variant: "destructive",
      });
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleRoomSelect = (roomId: number) => {
    navigate(`/book-room/${roomId}`);
  };

  const refreshRooms = () => {
    setLoading(true);
    fetchAvailableRooms();
  };

  const handleDateSearch = () => {
    fetchAvailableRooms();
  };

  const clearDateFilter = () => {
    setSelectedDate('');
    setEndDate('');
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
      <div className="p-4 sm:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Select a Room</h1>
              <p className="text-muted-foreground mt-2">Choose from our rooms and check availability by date</p>
            </div>
            <Button onClick={refreshRooms} variant="outline" disabled={loading}>
              {loading ? "Refreshing..." : "Refresh Rooms"}
            </Button>
          </div>

          {/* Date Filter and Status Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filter & Search Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Check-in Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={todayLocal()}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label htmlFor="endDate">Check-out Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={selectedDate || todayLocal()}
                    disabled={!selectedDate}
                  />
                </div>

                {/* Room Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="statusFilter">Room Status</Label>
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger id="statusFilter">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Rooms</SelectItem>
                      <SelectItem value="available">Available Only</SelectItem>
                      <SelectItem value="booked">Booked Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Label>&nbsp;</Label>
                  <div className="flex gap-2">
                    <Button onClick={handleDateSearch} className="flex-1" disabled={loading}>
                      {loading ? "Searching..." : "Search"}
                    </Button>
                    {selectedDate && (
                      <Button onClick={clearDateFilter} variant="outline" size="icon">
                        ✕
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Current Filter Info */}
              {selectedDate && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    📅 Showing availability for:{' '}
                    <strong>{format(new Date(selectedDate), 'PPP')}</strong>
                    {endDate && endDate !== selectedDate && (
                      <> to <strong>{format(new Date(endDate), 'PPP')}</strong></>
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities on Selected Date */}
          {selectedDate && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" />
                  Activities Scheduled on {format(new Date(selectedDate), 'PPP')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingActivities ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Loading activities...</p>
                  </div>
                ) : activitiesOnDate.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No activities scheduled for this date</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activitiesOnDate.map((activity) => (
                      <div
                        key={`${activity.booking_type}-${activity.id}`}
                        className="p-3 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-sm">{activity.room_name}</h4>
                          <Badge variant={activity.booking_type === 'hotel' ? 'default' : 'secondary'}>
                            {activity.booking_type === 'hotel' ? 'Hotel' : 'Conference'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{activity.room_type}</p>
                        <p className="text-sm font-medium">{activity.guest_name}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {format(new Date(activity.start_date), 'MMM d')} - {format(new Date(activity.end_date), 'MMM d, yyyy')}
                        </p>
                        {activity.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">{activity.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Rooms Display */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {filterStatus === 'all' ? 'All Rooms' : filterStatus === 'available' ? 'Available Rooms' : 'Booked Rooms'}
                <span className="text-muted-foreground ml-2">({rooms.length})</span>
              </h2>
            </div>

            {rooms.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-semibold mb-2">No Rooms Found</h3>
                    <p className="text-muted-foreground mb-4">
                      {filterStatus === 'available' 
                        ? 'No rooms available for the selected criteria. Try adjusting your dates or filters.'
                        : 'No rooms match your filter criteria.'}
                    </p>
                    <Button onClick={clearDateFilter} variant="outline">
                      Clear Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map((room: any) => {
                  const isAvailable = room.is_available_for_dates;
                  const hasCurrentBooking = room.current_booking;

                  return (
                    <Card
                      key={room.id}
                      className={`transition-all duration-200 hover:shadow-lg ${
                        isAvailable ? 'cursor-pointer hover:scale-105 border-green-200' : 'border-red-200 opacity-90'
                      }`}
                      onClick={() => isAvailable && handleRoomSelect(room.id)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{room.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{room.type}</p>
                          </div>
                          <Badge
                            variant={isAvailable ? 'default' : 'destructive'}
                            className="ml-2"
                          >
                            {isAvailable ? '✓ Available' : '✗ Booked'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {room.description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                            {room.description}
                          </p>
                        )}

                        {/* Current Booking (if booked) */}
                        {hasCurrentBooking && (
                          <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Currently Booked</AlertTitle>
                            <AlertDescription>
                              <p className="text-xs">
                                <strong>Guest:</strong> {room.current_booking.guest_name}
                              </p>
                              <p className="text-xs">
                                <strong>Dates:</strong> {format(new Date(room.current_booking.start_date), 'MMM d')} -{' '}
                                {format(new Date(room.current_booking.end_date), 'MMM d, yyyy')}
                              </p>
                              {room.current_booking.notes && (
                                <p className="text-xs mt-1 italic">{room.current_booking.notes}</p>
                              )}
                            </AlertDescription>
                          </Alert>
                        )}

                        {/* Future Bookings Display */}
                        {room.future_bookings && room.future_bookings.length > 0 && (
                          <div className="mb-4 p-2 bg-orange-50 rounded-md border border-orange-200">
                            <p className="text-xs font-medium text-orange-800 mb-1">
                              📅 Future Bookings:
                            </p>
                            {room.future_bookings.slice(0, 2).map((booking: any, index: number) => (
                              <div key={index} className="text-xs text-orange-700 mb-1">
                                <div className="flex justify-between">
                                  <span>
                                    {format(new Date(booking.start_date), 'MMM d')} -{' '}
                                    {format(new Date(booking.end_date), 'MMM d')}
                                  </span>
                                  <span className="font-medium">{booking.guest_name}</span>
                                </div>
                              </div>
                            ))}
                            {room.future_bookings.length > 2 && (
                              <p className="text-xs text-orange-600 mt-1">
                                +{room.future_bookings.length - 2} more booking(s)
                              </p>
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
                            disabled={!isAvailable}
                          >
                            {isAvailable ? 'Book Now' : 'Not Available'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
      </div>
      </div>
    </DashboardLayout>
  );
}