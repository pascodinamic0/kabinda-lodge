import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar, UtensilsCrossed, CalendarIcon, Filter, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getGuestName } from '@/utils/guestNameUtils';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

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
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    fetchBookings();
    fetchOrders();
  }, [startDate, endDate]);

  const fetchBookings = async () => {
    try {
      // Build hotel bookings query with date filters
      let hotelQuery = supabase
        .from('bookings')
        .select('*, users!bookings_user_id_fkey(name, role)');

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

      if (hotelError) {
        console.error('Hotel bookings error:', hotelError);
        throw hotelError;
      }

      // Build conference bookings query with date filters
      let conferenceQuery = supabase
        .from('conference_bookings')
        .select('*');

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
      // Build orders query with date filters
      let ordersQuery = supabase
        .from('orders')
        .select('*');

      // Apply date filters to orders
      if (startDate) {
        const startDateStr = startDate.toISOString().split('T')[0];
        ordersQuery = ordersQuery.gte('created_at', `${startDateStr}T00:00:00`);
      }
      if (endDate) {
        const endDateStr = endDate.toISOString().split('T')[0];
        ordersQuery = ordersQuery.lte('created_at', `${endDateStr}T23:59:59`);
      }

      const { data, error } = await ordersQuery.order('created_at', { ascending: false });

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
              {(bookings.length > 0 || orders.length > 0) && !loading && (
                <div className="flex gap-2">
                  {bookings.length > 0 && (
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      {bookings.length} Bookings
                    </Badge>
                  )}
                  {orders.length > 0 && (
                    <Badge variant="outline" className="text-sm px-3 py-1">
                      {orders.length} Orders
                    </Badge>
                  )}
                </div>
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