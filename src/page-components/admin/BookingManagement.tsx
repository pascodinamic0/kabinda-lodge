import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2, Eye, CalendarIcon, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getGuestName } from '@/utils/guestNameUtils';
import { BookingDetailsDialog } from '@/components/admin/BookingDetailsDialog';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

interface Booking {
  id: number;
  user_id: string;
  room_id?: number;
  conference_room_id?: number;
  start_date?: string;
  end_date?: string;
  start_datetime?: string;
  end_datetime?: string;
  status: string;
  total_price: number;
  notes: string | null;
  created_at: string;
  booking_type: 'hotel' | 'conference';
  guest_name?: string;
  guest_email?: string;
  room_name?: string;
  conference_room_name?: string;
}

export default function BookingManagement() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingBooking, setDeletingBooking] = useState<number | null>(null);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [selectedBookingType, setSelectedBookingType] = useState<'hotel' | 'conference' | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchBookings();
  }, [startDate, endDate]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Build hotel bookings query with date filters
      let hotelQuery = supabase
        .from('bookings')
        .select(`
          *,
          rooms(name),
          users!bookings_user_id_fkey(name, role)
        `);

      // Apply date filters to hotel bookings
      if (startDate) {
        const startDateStr = startDate.toISOString().split('T')[0];
        hotelQuery = hotelQuery.gte('created_at', `${startDateStr}T00:00:00`);
      }
      if (endDate) {
        const endDateStr = endDate.toISOString().split('T')[0];
        hotelQuery = hotelQuery.lte('created_at', `${endDateStr}T23:59:59`);
      }

      const { data: hotelBookings, error: hotelError } = await hotelQuery.order('created_at', { ascending: false });

      if (hotelError) throw hotelError;

      // Build conference bookings query with date filters
      let conferenceQuery = supabase
        .from('conference_bookings')
        .select(`
          *,
          conference_rooms(name)
        `);

      // Apply date filters to conference bookings
      if (startDate) {
        const startDateStr = startDate.toISOString().split('T')[0];
        conferenceQuery = conferenceQuery.gte('created_at', `${startDateStr}T00:00:00`);
      }
      if (endDate) {
        const endDateStr = endDate.toISOString().split('T')[0];
        conferenceQuery = conferenceQuery.lte('created_at', `${endDateStr}T23:59:59`);
      }

      const { data: conferenceBookings, error: conferenceError } = await conferenceQuery.order('created_at', { ascending: false });

      if (conferenceError) throw conferenceError;

      // Fetch user data for conference bookings (including role to exclude staff)
      const userIds = (conferenceBookings || [])
        .map(b => b.user_id)
        .filter(Boolean);
      
      let usersMap = new Map();
      if (userIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, role')
          .in('id', userIds);
        usersMap = new Map((usersData || []).map(u => [u.id, { name: u.name, role: u.role }]));
      }

      // Combine and format bookings
      // PRIORITY: guest_name field first, NEVER show staff names
      const allBookings: Booking[] = [
        ...(hotelBookings || []).map(booking => {
          // Handle rooms being returned as array or object
          const roomData = Array.isArray(booking.rooms) ? booking.rooms[0] : booking.rooms;
          return {
            ...booking,
            booking_type: 'hotel' as const,
            room_name: roomData?.name,
            guest_name: getGuestName(booking, (booking.users as any))
          };
        }),
        ...(conferenceBookings || []).map(booking => {
          // Handle conference_rooms being returned as array or object
          const confRoomData = Array.isArray(booking.conference_rooms) ? booking.conference_rooms[0] : booking.conference_rooms;
          return {
            ...booking,
            booking_type: 'conference' as const,
            conference_room_name: confRoomData?.name,
            guest_name: getGuestName(booking, usersMap.get(booking.user_id) || null)
          };
        })
      ];

      // Sort by created_at
      allBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setBookings(allBookings);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteBooking = async (booking: Booking) => {
    console.log('Delete button clicked for booking:', booking);
    
    if (!confirm(`Are you sure you want to PERMANENTLY DELETE this ${booking.booking_type} booking? This will COMPLETELY REMOVE the booking from the database as if it never existed. This action cannot be undone.`)) {
      console.log('User cancelled deletion');
      return;
    }

    console.log('Starting PERMANENT deletion process for booking ID:', booking.id, 'Type:', booking.booking_type);
    setDeletingBooking(booking.id);
    
    try {
      console.log('Calling database function to permanently delete booking...');
      
      // Call the Supabase RPC function to delete the booking
      const { data, error } = await supabase.rpc('delete_booking_as_superadmin', {
        booking_id: booking.id,
        booking_type: booking.booking_type
      });

      if (error) {
        console.error('Error from database function:', error);
        throw error;
      }

      console.log('Booking deleted successfully:', data);
      
      toast({
        title: "Booking Deleted",
        description: `${booking.booking_type === 'hotel' ? 'Hotel' : 'Conference'} booking #${booking.id} has been permanently deleted.`,
      });

      // Refresh the bookings list
      await fetchBookings();
      
    } catch (error: any) {
      console.error('Error during deletion process:', error);
      toast({
        title: "Error", 
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      });
    } finally {
      setDeletingBooking(null);
    }
  };

  const handleViewDetails = (booking: Booking) => {
    setSelectedBookingId(booking.id);
    setSelectedBookingType(booking.booking_type);
    setDetailsDialogOpen(true);
  };

  const handleBookingUpdated = () => {
    fetchBookings(); // Refresh the list when a booking is updated
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'booked':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
      case 'checked-out':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout title="Booking Management">
      <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Management
                </CardTitle>
                <CardDescription className="text-sm">
                  View and manage all hotel and conference room bookings. Click on any booking to view full details, add promotions, and print receipts.
                </CardDescription>
              </div>
              {bookings.length > 0 && !loading && (
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {bookings.length} Total
                </Badge>
              )}
            </div>
          </CardHeader>

          {/* Date Range Filter */}
          <div className="px-6 pb-4">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filter by Date:</span>
                  </div>

                  {/* Start Date Picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">From:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] justify-start text-left font-normal bg-white"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, 'PPP') : 'Select start date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* End Date Picker */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">To:</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-[200px] justify-start text-left font-normal bg-white"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, 'PPP') : 'Select end date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => startDate ? date < startDate : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Clear Filters Button */}
                  {(startDate || endDate) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStartDate(undefined);
                        setEndDate(undefined);
                      }}
                      className="text-sm"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading bookings...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Booking ID</TableHead>
                      <TableHead className="min-w-[80px]">Type</TableHead>
                      <TableHead className="min-w-[120px]">Room/Conference</TableHead>
                      <TableHead className="min-w-[100px]">Guest</TableHead>
                      <TableHead className="min-w-[100px]">Start</TableHead>
                      <TableHead className="min-w-[100px]">End</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[80px]">Total</TableHead>
                      <TableHead className="min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow 
                        key={`${booking.booking_type}-${booking.id}`}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => handleViewDetails(booking)}
                      >
                        <TableCell className="font-medium">#{booking.id}</TableCell>
                        <TableCell>
                          <Badge variant={booking.booking_type === 'hotel' ? 'default' : 'secondary'}>
                            {booking.booking_type === 'hotel' ? 'Hotel' : 'Conference'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {booking.booking_type === 'hotel' 
                            ? booking.room_name || `Room ${booking.room_id}` 
                            : booking.conference_room_name || `Conf ${booking.conference_room_id}`}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {booking.guest_name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {booking.booking_type === 'hotel' 
                              ? new Date(booking.start_date!).toLocaleDateString()
                              : new Date(booking.start_datetime!).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {booking.booking_type === 'hotel' 
                              ? new Date(booking.end_date!).toLocaleDateString()
                              : new Date(booking.end_datetime!).toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(booking.status)}>
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">${booking.total_price}</TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(booking)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                console.log('Delete button clicked for booking:', booking.id, booking.booking_type);
                                deleteBooking(booking);
                              }}
                              disabled={deletingBooking === booking.id}
                              title="Delete Booking"
                            >
                              {deletingBooking === booking.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {bookings.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No bookings found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      {/* Booking Details Dialog */}
      <BookingDetailsDialog
        bookingId={selectedBookingId}
        bookingType={selectedBookingType}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onBookingUpdated={handleBookingUpdated}
      />
    </DashboardLayout>
  );
}
