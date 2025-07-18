import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
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
}

export default function BookingOverview() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      // Fetch hotel bookings
      const { data: hotelBookings, error: hotelError } = await supabase
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (hotelError) throw hotelError;

      // Fetch conference room bookings
      const { data: conferenceBookings, error: conferenceError } = await supabase
        .from('conference_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (conferenceError) throw conferenceError;

      // Combine and format bookings
      const allBookings: Booking[] = [
        ...(hotelBookings || []).map(booking => ({
          ...booking,
          booking_type: 'hotel' as const
        })),
        ...(conferenceBookings || []).map(booking => ({
          ...booking,
          booking_type: 'conference' as const
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'completed':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Booking Overview</CardTitle>
                <CardDescription className="text-sm">View and manage all hotel bookings</CardDescription>
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
                        <TableHead className="min-w-[80px]">Room</TableHead>
                        <TableHead className="min-w-[100px]">Start</TableHead>
                        <TableHead className="min-w-[100px]">End</TableHead>
                        <TableHead className="min-w-[100px]">Status</TableHead>
                        <TableHead className="min-w-[80px]">Total</TableHead>
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
                              ? `Room ${booking.room_id}` 
                              : `Conf ${booking.conference_room_id}`}
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
                        </TableRow>
                      ))}
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