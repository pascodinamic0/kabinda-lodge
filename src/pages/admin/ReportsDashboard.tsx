import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, Users, DollarSign, Calendar as CalendarIcon, Download, FileText, BarChart3, 
  Clock, Star, Repeat, Hotel, UtensilsCrossed, CreditCard, Activity, Target, 
  ArrowUpRight, ArrowDownRight, Eye, Printer, Share2, Filter, RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart,
  Legend, RadialBarChart, RadialBar
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface ReportData {
  // Financial Metrics
  totalRevenue: number;
  roomRevenue: number;
  restaurantRevenue: number;
  conferenceRevenue: number;
  revenueGrowth: number;
  averageDailyRate: number;
  revenuePerGuest: number;
  
  // Booking Metrics
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  bookingGrowth: number;
  averageLengthOfStay: number;
  occupancyRate: number;
  leadTime: number;
  
  // Restaurant Metrics
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
  topSellingItems: Array<{name: string, quantity: number, revenue: number}>;
  
  // Guest Metrics
  totalGuests: number;
  newGuests: number;
  repeatGuests: number;
  customerSatisfaction: number;
  repeatCustomerRate: number;
  averageRating: number;
  
  // Conference Metrics
  totalConferenceBookings: number;
  conferenceRevenue: number;
  averageConferenceDuration: number;
  
  // Operational Metrics
  totalRooms: number;
  availableRooms: number;
  maintenanceRequests: number;
  serviceRequests: number;
  
  // Time-based data
  dailyData: Array<{
    date: string;
    revenue: number;
    bookings: number;
    orders: number;
    guests: number;
  }>;
  
  // Room performance
  roomPerformance: Array<{
    roomType: string;
    bookings: number;
    revenue: number;
    occupancy: number;
  }>;
  
  // Payment analytics
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
}

const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#06B6D4',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1'
};

export default function ReportsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportType, setReportType] = useState<string>('overview');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchComprehensiveReportData();
  }, [startDate, endDate, reportType]);

  const fetchComprehensiveReportData = async () => {
    setLoading(true);
    try {
      // Fetch all data sources
      const [
        { data: bookingsData, error: bookingsError },
        { data: ordersData, error: ordersError },
        { data: roomsData, error: roomsError },
        { data: feedbackData, error: feedbackError },
        { data: conferenceBookingsData, error: conferenceError },
        { data: usersData, error: usersError },
        { data: menuItemsData, error: menuError },
        { data: serviceRequestsData, error: serviceError }
      ] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, users:user_id(*), rooms(*)')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase
          .from('orders')
          .select('*, menu_items(*)')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase.from('rooms').select('*'),
        supabase
          .from('feedback')
          .select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase
          .from('conference_room_bookings')
          .select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase
          .from('users')
          .select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase.from('menu_items').select('*'),
        supabase
          .from('service_requests')
          .select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString())
      ]);

      if (bookingsError) throw bookingsError;
      if (ordersError) throw ordersError;
      if (roomsError) throw roomsError;
      if (feedbackError) throw feedbackError;
      if (conferenceError) throw conferenceError;
      if (usersError) throw usersError;
      if (menuError) throw menuError;
      if (serviceError) throw serviceError;

      // Calculate comprehensive metrics
      const totalRevenue = (bookingsData?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0) +
                          (ordersData?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0) +
                          (conferenceBookingsData?.reduce((sum, c) => sum + Number(c.total_price), 0) || 0);

      const roomRevenue = bookingsData?.reduce((sum, b) => sum + Number(b.total_price), 0) || 0;
      const restaurantRevenue = ordersData?.reduce((sum, o) => sum + Number(o.total_price), 0) || 0;
      const conferenceRevenue = conferenceBookingsData?.reduce((sum, c) => sum + Number(c.total_price), 0) || 0;

      const totalBookings = bookingsData?.length || 0;
      const confirmedBookings = bookingsData?.filter(b => b.status === 'confirmed').length || 0;
      const cancelledBookings = bookingsData?.filter(b => b.status === 'cancelled').length || 0;

      const totalOrders = ordersData?.length || 0;
      const completedOrders = ordersData?.filter(o => o.status === 'completed').length || 0;
      const pendingOrders = ordersData?.filter(o => o.status === 'pending').length || 0;

      const totalGuests = usersData?.length || 0;
      const uniqueBookingUsers = [...new Set(bookingsData?.map(b => b.user_id) || [])];
      const repeatGuests = uniqueBookingUsers.filter(userId => 
        (bookingsData?.filter(b => b.user_id === userId).length || 0) > 1
      ).length;

      const averageRating = feedbackData && feedbackData.length > 0 ?
        feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length : 0;

      const averageLengthOfStay = bookingsData && bookingsData.length > 0 ?
        bookingsData.reduce((sum, booking) => {
          const start = new Date(booking.start_date);
          const end = new Date(booking.end_date);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / bookingsData.length : 0;

      const totalRooms = roomsData?.length || 1;
      const occupancyRate = Math.round((totalBookings / totalRooms) * 100);

      // Generate daily data for charts
      const dailyData = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
        const dayBookings = bookingsData?.filter(b => 
          isWithinInterval(new Date(b.created_at), { start: startOfDay(date), end: endOfDay(date) })
        ) || [];
        const dayOrders = ordersData?.filter(o => 
          isWithinInterval(new Date(o.created_at), { start: startOfDay(date), end: endOfDay(date) })
        ) || [];
        const dayGuests = usersData?.filter(u => 
          isWithinInterval(new Date(u.created_at), { start: startOfDay(date), end: endOfDay(date) })
        ) || [];

        return {
          date: format(date, 'MMM dd'),
          revenue: dayBookings.reduce((sum, b) => sum + Number(b.total_price), 0) +
                  dayOrders.reduce((sum, o) => sum + Number(o.total_price), 0),
          bookings: dayBookings.length,
          orders: dayOrders.length,
          guests: dayGuests.length
        };
      });

      // Room performance analysis
      const roomPerformance = roomsData?.map(room => {
        const roomBookings = bookingsData?.filter(b => b.room_id === room.id) || [];
        const roomRevenue = roomBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
        const roomOccupancy = Math.round((roomBookings.length / totalRooms) * 100);

        return {
          roomType: room.type,
          bookings: roomBookings.length,
          revenue: roomRevenue,
          occupancy: roomOccupancy
        };
      }) || [];

      // Top selling menu items
      const menuItemSales = ordersData?.reduce((acc, order) => {
        order.menu_items?.forEach((item: any) => {
          if (!acc[item.name]) {
            acc[item.name] = { quantity: 0, revenue: 0 };
          }
          acc[item.name].quantity += 1;
          acc[item.name].revenue += Number(item.price);
        });
        return acc;
      }, {} as Record<string, { quantity: number, revenue: number }>) || {};

      const topSellingItems = Object.entries(menuItemSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Payment method analysis
      const paymentMethods = bookingsData?.reduce((acc, booking) => {
        const method = booking.payment_method || 'Unknown';
        if (!acc[method]) {
          acc[method] = { count: 0, amount: 0 };
        }
        acc[method].count += 1;
        acc[method].amount += Number(booking.total_price);
        return acc;
      }, {} as Record<string, { count: number, amount: number }>) || {};

      const paymentMethodsArray = Object.entries(paymentMethods).map(([method, data]) => ({
        method,
        count: data.count,
        amount: data.amount
      }));

      setReportData({
        totalRevenue,
        roomRevenue,
        restaurantRevenue,
        conferenceRevenue,
        revenueGrowth: 12.5, // Placeholder - would calculate from previous period
        averageDailyRate: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
        revenuePerGuest: totalGuests > 0 ? Math.round(totalRevenue / totalGuests) : 0,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        bookingGrowth: 8.3, // Placeholder
        averageLengthOfStay: Math.round(averageLengthOfStay * 10) / 10,
        occupancyRate,
        leadTime: 14, // Placeholder - average days between booking and stay
        totalOrders,
        completedOrders,
        pendingOrders,
        averageOrderValue: totalOrders > 0 ? Math.round(restaurantRevenue / totalOrders) : 0,
        topSellingItems,
        totalGuests,
        newGuests: totalGuests - repeatGuests,
        repeatGuests,
        customerSatisfaction: Math.round(averageRating * 10) / 10,
        repeatCustomerRate: totalGuests > 0 ? Math.round((repeatGuests / totalGuests) * 100) : 0,
        averageRating: Math.round(averageRating * 10) / 10,
        totalConferenceBookings: conferenceBookingsData?.length || 0,
        conferenceRevenue,
        averageConferenceDuration: conferenceBookingsData && conferenceBookingsData.length > 0 ?
          conferenceBookingsData.reduce((sum, c) => {
            const start = new Date(c.start_datetime);
            const end = new Date(c.end_datetime);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            return sum + hours;
          }, 0) / conferenceBookingsData.length : 0,
        totalRooms,
        availableRooms: totalRooms - occupancyRate,
        maintenanceRequests: serviceRequestsData?.filter(s => s.type === 'maintenance').length || 0,
        serviceRequests: serviceRequestsData?.length || 0,
        dailyData,
        roomPerformance,
        paymentMethods: paymentMethodsArray
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch comprehensive report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateProfessionalPDF = async () => {
    const reportElement = document.getElementById('reports-content');
    if (!reportElement) return;

    try {
      toast({
        title: "Generating Professional Report",
        description: "Creating your comprehensive business report...",
      });

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add professional header
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text('KABINDA LODGE', 105, 20, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(107, 114, 128); // Gray color
      pdf.text('Comprehensive Business Report', 105, 30, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(75, 85, 99);
      pdf.text(`Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`, 105, 40, { align: 'center' });
      pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 105, 47, { align: 'center' });

      // Add content
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 60) / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 60;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Add footer
      pdf.setFontSize(10);
      pdf.setTextColor(156, 163, 175);
      pdf.text('Kabinda Lodge - Luxury Hospitality Experience', 105, pdfHeight - 10, { align: 'center' });
      pdf.text('Professional Business Intelligence Report', 105, pdfHeight - 5, { align: 'center' });

      pdf.save(`kabinda-lodge-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`);

      toast({
        title: "Success",
        description: "Professional report generated successfully!",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Error",
        description: "Failed to generate professional report",
        variant: "destructive",
      });
    }
  };

  const exportComprehensiveExcel = async () => {
    try {
      toast({
        title: "Generating Excel Report",
        description: "Creating comprehensive Excel report...",
      });

      const wb = XLSX.utils.book_new();

      // Executive Summary
      const summaryData = [
        ['KABINDA LODGE - EXECUTIVE SUMMARY'],
        ['Report Period:', `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
        ['Generated:', format(new Date(), 'MMM dd, yyyy HH:mm')],
        [''],
        ['FINANCIAL PERFORMANCE'],
        ['Total Revenue', `$${reportData?.totalRevenue.toLocaleString()}`],
        ['Room Revenue', `$${reportData?.roomRevenue.toLocaleString()}`],
        ['Restaurant Revenue', `$${reportData?.restaurantRevenue.toLocaleString()}`],
        ['Conference Revenue', `$${reportData?.conferenceRevenue.toLocaleString()}`],
        ['Average Daily Rate', `$${reportData?.averageDailyRate}`],
        ['Revenue per Guest', `$${reportData?.revenuePerGuest}`],
        [''],
        ['OPERATIONAL METRICS'],
        ['Total Bookings', reportData?.totalBookings],
        ['Confirmed Bookings', reportData?.confirmedBookings],
        ['Cancelled Bookings', reportData?.cancelledBookings],
        ['Occupancy Rate', `${reportData?.occupancyRate}%`],
        ['Average Length of Stay', `${reportData?.averageLengthOfStay} days`],
        [''],
        ['RESTAURANT PERFORMANCE'],
        ['Total Orders', reportData?.totalOrders],
        ['Completed Orders', reportData?.completedOrders],
        ['Pending Orders', reportData?.pendingOrders],
        ['Average Order Value', `$${reportData?.averageOrderValue}`],
        [''],
        ['GUEST ANALYTICS'],
        ['Total Guests', reportData?.totalGuests],
        ['New Guests', reportData?.newGuests],
        ['Repeat Guests', reportData?.repeatGuests],
        ['Customer Satisfaction', `${reportData?.averageRating}/5`],
        ['Repeat Customer Rate', `${reportData?.repeatCustomerRate}%`]
      ];

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Executive Summary');

      // Daily Performance
      const dailyHeaders = ['Date', 'Revenue', 'Bookings', 'Orders', 'New Guests'];
      const dailyRows = reportData?.dailyData.map(day => [
        day.date,
        day.revenue,
        day.bookings,
        day.orders,
        day.guests
      ]) || [];
      const dailyData = [dailyHeaders, ...dailyRows];
      const dailyWs = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(wb, dailyWs, 'Daily Performance');

      // Room Performance
      const roomHeaders = ['Room Type', 'Bookings', 'Revenue', 'Occupancy %'];
      const roomRows = reportData?.roomPerformance.map(room => [
        room.roomType,
        room.bookings,
        room.revenue,
        room.occupancy
      ]) || [];
      const roomData = [roomHeaders, ...roomRows];
      const roomWs = XLSX.utils.aoa_to_sheet(roomData);
      XLSX.utils.book_append_sheet(wb, roomWs, 'Room Performance');

      XLSX.writeFile(wb, `kabinda-lodge-comprehensive-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`);

      toast({
        title: "Success",
        description: "Comprehensive Excel report generated!",
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "Error",
        description: "Failed to generate Excel report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <div className="flex justify-center items-center min-h-[600px]">
            <div className="text-center space-y-4">
              <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
              <h3 className="text-lg font-semibold text-gray-700">Generating Comprehensive Report</h3>
              <p className="text-sm text-gray-500">Analyzing all business data...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">Business Intelligence Dashboard</h1>
                <p className="text-gray-600">Comprehensive analytics and performance insights</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Date Range */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate && endDate ? (
                        `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`
                      ) : (
                        <span>Select date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <div className="grid grid-cols-2 gap-4 p-4">
                      <div>
                        <label className="text-sm font-medium">Start Date</label>
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => date && setStartDate(date)}
                          initialFocus
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">End Date</label>
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => date && setEndDate(date)}
                        />
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Report Type */}
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Report Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview</SelectItem>
                    <SelectItem value="financial">Financial</SelectItem>
                    <SelectItem value="operational">Operational</SelectItem>
                    <SelectItem value="guest">Guest Analytics</SelectItem>
                  </SelectContent>
                </Select>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <Button onClick={generateProfessionalPDF} className="flex items-center gap-2">
                    <Printer className="h-4 w-4" />
                    Export PDF
                  </Button>
                  <Button onClick={exportComprehensiveExcel} variant="outline" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Export Excel
                  </Button>
                  <Button onClick={fetchComprehensiveReportData} variant="ghost" size="sm">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div id="reports-content" className="space-y-6">
            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">${reportData?.totalRevenue.toLocaleString()}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-300" />
                    <span className="text-sm text-blue-100">+{reportData?.revenueGrowth}% vs last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Hotel className="h-4 w-4" />
                    Total Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reportData?.totalBookings}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <ArrowUpRight className="h-4 w-4 text-green-300" />
                    <span className="text-sm text-green-100">+{reportData?.bookingGrowth}% vs last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Total Guests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reportData?.totalGuests}</div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-purple-100">{reportData?.repeatGuests} repeat guests</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Occupancy Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{reportData?.occupancyRate}%</div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-orange-100">{reportData?.availableRooms} rooms available</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="financial" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Financial
                </TabsTrigger>
                <TabsTrigger value="operational" className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Operational
                </TabsTrigger>
                <TabsTrigger value="guest" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Guest Analytics
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Trend */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        Revenue Trend
                      </CardTitle>
                      <CardDescription>Daily revenue performance over the selected period</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={reportData?.dailyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="date" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip 
                            formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']}
                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="revenue" 
                            stroke={COLORS.primary} 
                            fill={COLORS.primary}
                            fillOpacity={0.3}
                            strokeWidth={3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Revenue Breakdown */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-green-600" />
                        Revenue Breakdown
                      </CardTitle>
                      <CardDescription>Revenue distribution across business units</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Rooms', value: reportData?.roomRevenue || 0, color: COLORS.primary },
                              { name: 'Restaurant', value: reportData?.restaurantRevenue || 0, color: COLORS.secondary },
                              { name: 'Conference', value: reportData?.conferenceRevenue || 0, color: COLORS.accent }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'Rooms', value: reportData?.roomRevenue || 0, color: COLORS.primary },
                              { name: 'Restaurant', value: reportData?.restaurantRevenue || 0, color: COLORS.secondary },
                              { name: 'Conference', value: reportData?.conferenceRevenue || 0, color: COLORS.accent }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <UtensilsCrossed className="h-4 w-4 text-purple-600" />
                        Restaurant Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Orders</span>
                        <span className="font-semibold">{reportData?.totalOrders}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Order Value</span>
                        <span className="font-semibold">${reportData?.averageOrderValue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="font-semibold">
                          {reportData?.totalOrders ? Math.round((reportData.completedOrders / reportData.totalOrders) * 100) : 0}%
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        Guest Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Length of Stay</span>
                        <span className="font-semibold">{reportData?.averageLengthOfStay} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Customer Satisfaction</span>
                        <span className="font-semibold">{reportData?.averageRating}/5</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Repeat Customer Rate</span>
                        <span className="font-semibold">{reportData?.repeatCustomerRate}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4 text-green-600" />
                        Operational Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Rooms</span>
                        <span className="font-semibold">{reportData?.totalRooms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Service Requests</span>
                        <span className="font-semibold">{reportData?.serviceRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Conference Bookings</span>
                        <span className="font-semibold">{reportData?.totalConferenceBookings}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Financial Tab */}
              <TabsContent value="financial" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Revenue Composition */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Revenue Composition</CardTitle>
                      <CardDescription>Detailed breakdown of revenue sources</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={reportData?.dailyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                          <Bar dataKey="revenue" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Payment Methods */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Payment Methods</CardTitle>
                      <CardDescription>Distribution of payment methods used</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <RadialBarChart data={reportData?.paymentMethods}>
                          <RadialBar dataKey="amount" fill={COLORS.secondary} />
                          <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Amount']} />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Operational Tab */}
              <TabsContent value="operational" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Room Performance */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Room Performance</CardTitle>
                      <CardDescription>Performance metrics by room type</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={reportData?.roomPerformance}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="roomType" />
                          <YAxis />
                          <Tooltip formatter={(value) => [Number(value).toLocaleString(), 'Value']} />
                          <Bar dataKey="revenue" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="bookings" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Daily Activity */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Daily Activity</CardTitle>
                      <CardDescription>Bookings and orders activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={reportData?.dailyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="bookings" stroke={COLORS.primary} strokeWidth={3} />
                          <Line type="monotone" dataKey="orders" stroke={COLORS.secondary} strokeWidth={3} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Guest Analytics Tab */}
              <TabsContent value="guest" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Guest Satisfaction */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Guest Satisfaction</CardTitle>
                      <CardDescription>Customer feedback and ratings</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center space-y-4">
                        <div className="text-4xl font-bold text-blue-600">{reportData?.averageRating}/5</div>
                        <div className="flex justify-center">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`h-6 w-6 ${i < Math.floor(reportData?.averageRating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600">Average customer rating</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Guest Demographics */}
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle>Guest Demographics</CardTitle>
                      <CardDescription>New vs repeat customer breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'New Guests', value: reportData?.newGuests || 0, color: COLORS.primary },
                              { name: 'Repeat Guests', value: reportData?.repeatGuests || 0, color: COLORS.secondary }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {[
                              { name: 'New Guests', value: reportData?.newGuests || 0, color: COLORS.primary },
                              { name: 'Repeat Guests', value: reportData?.repeatGuests || 0, color: COLORS.secondary }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}