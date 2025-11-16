import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, UtensilsCrossed } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getGuestName } from '@/utils/guestNameUtils';

interface Booking {
  id: number;
  user_id: string;
  guest_name?: string;
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

interface Order {
  id: number;
  tracking_number: string;
  table_number: number | null;
  status: string;
  total_price: number;
  created_at: string;
  order_type: 'restaurant';
}

export default function BookingOverview() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'orders'>('bookings');

  useEffect(() => {
    fetchBookings();
    fetchOrders();
  }, []);

  const fetchBookings = async () => {
    try {
      // Fetch hotel bookings with guest names and user role to exclude staff names
      const { data: hotelBookings, error: hotelError } = await supabase
        .from('bookings')
        .select('*, users!bookings_user_id_fkey(name, role)')
        .order('created_at', { ascending: false });

      if (hotelError) {
        console.error('Hotel bookings error:', hotelError);
        throw hotelError;
      }

      // Fetch conference room bookings with guest names
      const { data: conferenceBookings, error: conferenceError } = await supabase
        .from('conference_bookings')
        .select('*')
        .order('created_at', { ascending: false });

      if (conferenceError) {
        console.error('Conference bookings error:', conferenceError);
        throw conferenceError;
      }

      // Fetch user data for conference bookings (including role to exclude staff)
      const userIds = (conferenceBookings || []).map(b => b.user_id).filter(Boolean);
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
        ...(hotelBookings || []).map(booking => ({
          ...booking,
          guest_name: getGuestName(booking, (booking.users as any)),
          booking_type: 'hotel' as const
        })),
        ...(conferenceBookings || []).map(booking => ({
          ...booking,
          guest_name: getGuestName(booking, usersMap.get(booking.user_id) || null),
          booking_type: 'conference' as const
        }))
      ];

      // Sort by created_at
      allBookings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('Successfully fetched bookings:', allBookings.length);
      setBookings(allBookings);
    } catch (error) {
      console.error('Fetch bookings error:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bookings",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedOrders: Order[] = (data || []).map(order => ({
        ...order,
        order_type: 'restaurant' as const
      }));

      setOrders(formattedOrders);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch restaurant orders",
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
                <CardTitle className="text-lg sm:text-xl">Booking & Order Overview</CardTitle>
                <CardDescription className="text-sm">View and manage all bookings and restaurant orders</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'bookings' | 'orders')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bookings" className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Bookings</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center space-x-2">
                  <UtensilsCrossed className="h-4 w-4" />
                  <span>Restaurant Orders</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="mt-6">
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
                        <TableHead className="min-w-[120px]">Guest Name</TableHead>
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
                          <TableCell className="font-medium">{booking.guest_name}</TableCell>
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
              </TabsContent>

              <TabsContent value="orders" className="mt-6">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="text-muted-foreground">Loading orders...</div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Order ID</TableHead>
                          <TableHead className="min-w-[120px]">Tracking Number</TableHead>
                          <TableHead className="min-w-[100px]">Table</TableHead>
                          <TableHead className="min-w-[100px]">Status</TableHead>
                          <TableHead className="min-w-[100px]">Total</TableHead>
                          <TableHead className="min-w-[120px]">Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">#{order.id}</TableCell>
                            <TableCell className="font-mono text-sm">{order.tracking_number}</TableCell>
                            <TableCell>
                              {order.table_number ? `Table ${order.table_number}` : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadgeColor(order.status)}>
                                {order.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">${order.total_price}</TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {new Date(order.created_at).toLocaleString()}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}