import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

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

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      // Fetch hotel bookings with room details
      const { data: hotelBookings, error: hotelError } = await supabase
        .from('bookings')
        .select(`
          *,
          rooms(name)
        `)
        .order('created_at', { ascending: false });

      if (hotelError) throw hotelError;

      // Fetch conference room bookings with conference room details
      const { data: conferenceBookings, error: conferenceError } = await supabase
        .from('conference_bookings')
        .select(`
          *,
          conference_rooms(name)
        `)
        .order('created_at', { ascending: false });

      if (conferenceError) throw conferenceError;

      // Combine and format bookings
      const allBookings: Booking[] = [
        ...(hotelBookings || []).map(booking => ({
          ...booking,
          booking_type: 'hotel' as const,
          room_name: booking.rooms?.name
        })),
        ...(conferenceBookings || []).map(booking => ({
          ...booking,
          booking_type: 'conference' as const,
          conference_room_name: booking.conference_rooms?.name
        }))
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
      
      // Delete booking function not implemented yet - just show confirmation
      toast({
        title: "Function Not Available",
        description: "Booking deletion functionality is not implemented yet",
        variant: "destructive",
      });
      
    } catch (error) {
      console.error('Error during deletion process:', error);
      toast({
        title: "Error", 
        description: "Failed to delete booking",
        variant: "destructive",
      });
    } finally {
      setDeletingBooking(null);
    }
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
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Management
                </CardTitle>
                <CardDescription className="text-sm">
                  View and manage all hotel and conference room bookings. Deleting a booking will restore the room to available status.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
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
                      <TableRow key={`${booking.booking_type}-${booking.id}`}>
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
                            {booking.guest_name || 'N/A'}
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
                        <TableCell>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              console.log('Delete button clicked for booking:', booking.id, booking.booking_type);
                              deleteBooking(booking);
                            }}
                            disabled={deletingBooking === booking.id}
                          >
                            {deletingBooking === booking.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
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
      </div>
    </DashboardLayout>
  );
}
