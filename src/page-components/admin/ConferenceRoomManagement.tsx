import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Pencil, Trash2, Settings, Printer, Calendar as CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import ConferenceRoomModal from '@/components/admin/ConferenceRoomModal';
import AmenitiesModal from '@/components/admin/AmenitiesModal';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { ReportGenerator } from '@/components/ReportGenerator';

interface ConferenceRoom {
  id: number;
  name: string;
  capacity: number;
  daily_rate: number;
  status: string;
  description: string | null;
  features: string[];
  created_at: string;
  image_count?: number;
}

interface Amenity {
  id: string;
  name: string;
  icon_name: string | null;
  category: string;
  created_at: string;
}

export default function ConferenceRoomManagement() {
  const { toast } = useToast();
  const [conferenceRooms, setConferenceRooms] = useState<ConferenceRoom[]>([]);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [amenitiesLoading, setAmenitiesLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<ConferenceRoom | null>(null);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    fetchConferenceRooms();
    fetchAmenities();
  }, []);

  const fetchConferenceRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('conference_rooms')
        .select(`
          *,
          conference_room_images(count)
        `)
        .order('name');

      if (error) throw error;
      
      // Transform the data to include image count
      const roomsWithImageCount = (data || []).map(room => ({
        ...room,
        image_count: room.conference_room_images?.[0]?.count || 0
      }));
      
      setConferenceRooms(roomsWithImageCount);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch conference rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAmenities = async () => {
    try {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setAmenities(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch amenities",
        variant: "destructive",
      });
    } finally {
      setAmenitiesLoading(false);
    }
  };

  const handleAddRoom = () => {
    setSelectedRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room: ConferenceRoom) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      const { error } = await supabase
        .from('conference_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Conference room deleted successfully",
      });

      fetchConferenceRooms();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conference room",
        variant: "destructive",
      });
    }
  };

  // Amenities handlers
  const handleAddAmenity = () => {
    setSelectedAmenity(null);
    setIsAmenitiesModalOpen(true);
  };

  const handleEditAmenity = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setIsAmenitiesModalOpen(true);
  };

  const handleDeleteAmenity = async (amenityId: string) => {
    try {
      const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('id', amenityId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Amenity deleted successfully",
      });

      fetchAmenities();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete amenity",
        variant: "destructive",
      });
    }
  };

  const handleStatusToggle = async (roomId: number, currentStatus: string) => {
    // Cycle through available statuses
    const statusCycle = ['available', 'occupied', 'maintenance'];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    try {
      const { error } = await supabase
        .from('conference_rooms')
        .update({ status: nextStatus })
        .eq('id', roomId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Conference room status updated to ${nextStatus}`,
      });

      fetchConferenceRooms();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update room status",
        variant: "destructive",
      });
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'technology':
        return 'bg-blue-500 hover:bg-blue-600';
      case 'comfort':
        return 'bg-green-500 hover:bg-green-600';
      case 'services':
        return 'bg-purple-500 hover:bg-purple-600';
      case 'accessibility':
        return 'bg-orange-500 hover:bg-orange-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600';
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600';
      case 'maintenance':
        return 'bg-yellow-500 hover:bg-yellow-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const fetchConferenceReportData = async () => {
    setLoadingReport(true);
    try {
      // Fetch conference bookings in date range
      const { data: conferenceBookingsData, error: conferenceError } = await supabase
        .from('conference_bookings')
        .select(`
          *,
          conference_room:conference_rooms(name)
        `)
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());

      if (conferenceError) throw conferenceError;

      // Fetch payments for conference bookings
      const conferenceBookingIds = (conferenceBookingsData || []).map(b => b.id);
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('method, amount, status, conference_booking_id')
        .in('conference_booking_id', conferenceBookingIds.length > 0 ? conferenceBookingIds : [0])
        .in('status', ['completed', 'verified', 'pending', 'pending_verification']);

      if (paymentsError) throw paymentsError;

      const safeConferenceBookings = conferenceBookingsData || [];
      const safePayments = paymentsData || [];

      // Calculate metrics
      const totalConferenceBookings = safeConferenceBookings.length;
      const conferenceRevenue = safePayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      
      // Calculate average duration
      let totalDuration = 0;
      safeConferenceBookings.forEach(booking => {
        if (booking.start_datetime && booking.end_datetime) {
          const start = new Date(booking.start_datetime);
          const end = new Date(booking.end_datetime);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          totalDuration += days;
        }
      });
      const averageConferenceDuration = totalConferenceBookings > 0 ? totalDuration / totalConferenceBookings : 0;

      // Group by room for performance metrics
      const roomPerformanceMap = new Map<string, { bookings: number; revenue: number; roomName: string }>();
      safeConferenceBookings.forEach(booking => {
        const roomName = (booking.conference_room as any)?.name || 'Unknown';
        const bookingRevenue = safePayments
          .filter(p => p.conference_booking_id === booking.id)
          .reduce((sum, p) => sum + Number(p.amount || 0), 0);
        
        if (!roomPerformanceMap.has(roomName)) {
          roomPerformanceMap.set(roomName, { bookings: 0, revenue: 0, roomName });
        }
        const roomData = roomPerformanceMap.get(roomName)!;
        roomData.bookings += 1;
        roomData.revenue += bookingRevenue;
      });

      const conferenceRoomPerformance = Array.from(roomPerformanceMap.values()).map(room => ({
        roomName: room.roomName,
        bookings: room.bookings,
        revenue: room.revenue,
        occupancy: 0 // Calculate if needed
      }));

      // Get payment methods breakdown
      const paymentMethodsMap = new Map<string, { count: number; amount: number }>();
      safePayments.forEach(payment => {
        const method = payment.method || 'Unknown';
        if (!paymentMethodsMap.has(method)) {
          paymentMethodsMap.set(method, { count: 0, amount: 0 });
        }
        const methodData = paymentMethodsMap.get(method)!;
        methodData.count += 1;
        methodData.amount += Number(payment.amount || 0);
      });

      const paymentMethods = Array.from(paymentMethodsMap.entries()).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount
      }));

      // Format conference bookings for report
      const conferenceBookings = safeConferenceBookings.map(booking => {
        const user = booking.user_id ? { name: 'Guest' } : null;
        return {
          id: booking.id,
          roomName: (booking.conference_room as any)?.name || 'Unknown',
          clientName: user?.name || 'Guest',
          startDate: booking.start_datetime || booking.created_at,
          endDate: booking.end_datetime || booking.created_at,
          totalPrice: safePayments
            .filter(p => p.conference_booking_id === booking.id)
            .reduce((sum, p) => sum + Number(p.amount || 0), 0) || booking.total_price || 0,
          status: booking.status || 'unknown'
        };
      });

      // Build report data
      const reportData = {
        totalRevenue: conferenceRevenue,
        roomRevenue: 0,
        restaurantRevenue: 0,
        conferenceRevenue: conferenceRevenue,
        revenueGrowth: 0,
        averageDailyRate: 0,
        revenuePerGuest: 0,
        totalBookings: 0,
        confirmedBookings: 0,
        cancelledBookings: 0,
        bookingGrowth: 0,
        averageLengthOfStay: 0,
        occupancyRate: 0,
        leadTime: 0,
        totalOrders: 0,
        completedOrders: 0,
        pendingOrders: 0,
        averageOrderValue: 0,
        topSellingItems: [],
        totalGuests: 0,
        newGuests: 0,
        repeatGuests: 0,
        customerSatisfaction: 0,
        repeatCustomerRate: 0,
        averageRating: 0,
        totalConferenceBookings: totalConferenceBookings,
        averageConferenceDuration: averageConferenceDuration,
        totalRooms: 0,
        availableRooms: 0,
        maintenanceRequests: 0,
        serviceRequests: 0,
        paymentMethods: paymentMethods,
        conferenceRoomPerformance: conferenceRoomPerformance,
        conferenceBookings: conferenceBookings
      };

      setReportData(reportData);
      setShowReportModal(true);
    } catch (error) {
      console.error('Error fetching conference report data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch conference report data",
        variant: "destructive",
      });
    } finally {
      setLoadingReport(false);
    }
  };

  const handleGenerateReport = () => {
    fetchConferenceReportData();
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Conference Room Management</CardTitle>
                <CardDescription className="text-sm">Manage conference rooms and their details</CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm">
                      <CalendarIcon className="mr-2 h-3.5 w-3.5 text-slate-500" />
                      <span className="text-sm">
                        {startDate && endDate ? (
                          `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`
                        ) : (
                          <span>Date Range</span>
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <div className="grid grid-cols-2 gap-4 p-4">
                      <div>
                        <label className="text-xs font-semibold uppercase text-slate-500 mb-2 block">Start Date</label>
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                          initialFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold uppercase text-slate-500 mb-2 block">End Date</label>
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => date && setEndDate(date)}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                <Button 
                  onClick={handleGenerateReport} 
                  variant="outline" 
                  size="sm" 
                  className="h-9 bg-white shadow-sm"
                  disabled={loadingReport}
                >
                  <Printer className="h-3.5 w-3.5 mr-2" />
                  PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleAddAmenity}
                  className="w-full sm:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Amenities
                </Button>
                <Button onClick={handleAddRoom} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Conference Room
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading conference rooms...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Room Name</TableHead>
                      <TableHead className="min-w-[80px]">Capacity</TableHead>
                      <TableHead className="min-w-[100px]">Daily Rate</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[80px]">Images</TableHead>
                      <TableHead className="min-w-[150px] hidden md:table-cell">Features</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conferenceRooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">
                          <div className="truncate max-w-[150px]">{room.name}</div>
                        </TableCell>
                        <TableCell>
                          {room.capacity} people
                        </TableCell>
                        <TableCell className="font-medium">${room.daily_rate}/day</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(room.status)}>
                            {room.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-sm">{room.image_count || 0}</span>
                            <span className="text-xs text-muted-foreground">photos</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="truncate max-w-[150px]">
                            {room.features.length > 0 ? room.features.slice(0, 2).join(', ') + (room.features.length > 2 ? '...' : '') : 'No features'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditRoom(room)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the conference room
                                    and remove it from the system.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteRoom(room.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>


        <ConferenceRoomModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRoom(null);
          }}
          onSuccess={fetchConferenceRooms}
          room={selectedRoom}
        />

        <AmenitiesModal
          isOpen={isAmenitiesModalOpen}
          onClose={() => {
            setIsAmenitiesModalOpen(false);
            setSelectedAmenity(null);
          }}
          onSuccess={fetchAmenities}
          amenity={selectedAmenity}
        />

        {reportData && showReportModal && (
          <ReportGenerator
            reportType="conference-rooms"
            reportData={reportData}
            startDate={startDate}
            endDate={endDate}
            onClose={() => {
              setShowReportModal(false);
              setReportData(null);
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}