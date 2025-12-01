import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, Users, DollarSign, Calendar as CalendarIcon, FileText, BarChart3, 
  Clock, Star, Hotel, UtensilsCrossed, Activity, Target, 
  ArrowUpRight, ArrowDownRight, Printer, RefreshCw, AlertTriangle
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isWithinInterval } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import ReviewManagementModal from '@/components/admin/ReviewManagementModal';
import { KPICard } from '@/components/dashboard/KPICard';
import { Badge } from '@/components/ui/badge';

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
    totalRoomsOfType: number;
  }>;

  // Payments
  paymentMethods: Array<{ method: string; count: number; amount: number }>;
}

const COLORS = {
  primary: '#0ea5e9', // Sky Blue
  secondary: '#6366f1', // Indigo
  accent: '#10b981', // Emerald
  warning: '#f59e0b', // Amber
  danger: '#ef4444', // Red
  purple: '#8b5cf6',
  pink: '#ec4899',
  info: '#06b6d4',
  gray: '#94a3b8'
};

const CHART_CONFIG = {
  radius: [4, 4, 0, 0] as [number, number, number, number],
  gridDash: "3 3",
  gridColor: "#f1f5f9",
  axisColor: "#64748b",
  tooltipStyle: { 
    backgroundColor: '#fff', 
    border: '1px solid #e2e8f0',
    borderRadius: '0.5rem',
    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    fontSize: '0.875rem'
  }
};

export default function ReportsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [showReviewModal, setShowReviewModal] = useState(false);

  useEffect(() => {
    fetchComprehensiveReportData();
  }, [startDate, endDate]);

  const fetchComprehensiveReportData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Starting to fetch report data...');
      
      const [
        { data: bookingsData, error: bookingsError },
        { data: ordersData, error: ordersError },
        { data: orderItemsData, error: orderItemsError },
        { data: roomsData, error: roomsError },
        { data: feedbackData, error: feedbackError },
        { data: usersData, error: usersError },
        { data: menuItemsData, error: menuError },
        { data: conferenceBookingsData, error: conferenceError },
        { data: serviceRequestsData, error: serviceError },
        { data: paymentsData, error: paymentsError }
      ] = await Promise.all([
        supabase.from('bookings').select('*, users:user_id(*), rooms(*)')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase.from('orders').select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase.from('order_items').select(`quantity, menu_items ( name, price ), orders!inner ( created_at )`)
          .gte('orders.created_at', startOfDay(startDate).toISOString())
          .lte('orders.created_at', endOfDay(endDate).toISOString()),
        supabase.from('rooms').select('*'),
        supabase.from('feedback').select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase.from('users').select('*').eq('role', 'Guest')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase.from('menu_items').select('*'),
        supabase.from('conference_bookings').select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase.from('guest_service_requests').select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase.from('payments').select('method, amount, status, created_at, booking_id, order_id, conference_booking_id')
          .eq('status', 'completed')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString())
      ]);

      if (bookingsError && bookingsError.code !== '42P01') throw bookingsError;
      if (ordersError && ordersError.code !== '42P01') throw ordersError;
      if (roomsError && roomsError.code !== '42P01') throw roomsError;
      if (usersError && usersError.code !== '42P01') throw usersError;
      if (paymentsError && paymentsError.code !== '42P01') throw paymentsError;

      const safeBookingsData = bookingsData || [];
      const safeOrdersData = ordersData || [];
      const safeOrderItemsData = orderItemsData || [];
      const safeRoomsData = roomsData || [];
      const safeFeedbackData = feedbackData || [];
      const safeUsersData = usersData || [];
      const safeConferenceBookingsData = conferenceBookingsData || [];
      const safeServiceRequestsData = serviceRequestsData || [];
      const safePaymentsData = paymentsData || [];

      const totalRevenue = safePaymentsData.reduce((sum, p) => sum + Number(p?.amount || 0), 0);
      
      const roomRevenue = safePaymentsData
        .filter(p => p?.booking_id !== null && p?.booking_id !== undefined)
        .reduce((sum, p) => sum + Number(p?.amount || 0), 0);
      
      const restaurantRevenue = safePaymentsData
        .filter(p => p?.order_id !== null && p?.order_id !== undefined)
        .reduce((sum, p) => sum + Number(p?.amount || 0), 0);
      
      const conferenceRevenue = safePaymentsData
        .filter(p => p?.conference_booking_id !== null && p?.conference_booking_id !== undefined)
        .reduce((sum, p) => sum + Number(p?.amount || 0), 0);

      const totalBookings = safeBookingsData.length;
      const confirmedBookings = safeBookingsData.filter(b => b?.status === 'confirmed').length;
      const cancelledBookings = safeBookingsData.filter(b => b?.status === 'cancelled').length;

      const totalOrders = safeOrdersData.length;
      const completedOrders = safeOrdersData.filter(o => o?.status === 'completed').length;
      const pendingOrders = safeOrdersData.filter(o => o?.status === 'pending').length;

      const totalGuests = safeUsersData.length;
      const uniqueBookingUsers = [...new Set(safeBookingsData.map(b => b?.user_id).filter(Boolean))];
      const repeatGuests = uniqueBookingUsers.filter(userId => 
        (safeBookingsData.filter(b => b?.user_id === userId).length || 0) > 1
      ).length;

      const averageRating = safeFeedbackData.length > 0 ?
        safeFeedbackData.reduce((sum, f) => sum + (f?.rating || 0), 0) / safeFeedbackData.length : 0;

      const averageLengthOfStay = safeBookingsData.length > 0 ?
        safeBookingsData.reduce((sum, booking) => {
          if (booking?.start_date && booking?.end_date) {
            try {
              const start = new Date(booking.start_date);
              const end = new Date(booking.end_date);
              if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                return sum + days;
              }
            } catch (dateError) { return sum; }
          }
          return sum;
        }, 0) / safeBookingsData.length : 0;

      const averageConferenceDuration = safeConferenceBookingsData.length > 0 ?
        safeConferenceBookingsData.reduce((sum, booking) => {
          if (booking?.start_datetime && booking?.end_datetime) {
            try {
              const start = new Date(booking.start_datetime);
              const end = new Date(booking.end_datetime);
              if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                return sum + hours;
              }
            } catch (error) { return sum; }
          }
          return sum;
        }, 0) / safeConferenceBookingsData.length : 0;

      const totalRooms = safeRoomsData.length || 1;
      const occupancyRate = Math.round((totalBookings / totalRooms) * 100);

      const dailyData = eachDayOfInterval({ start: startDate, end: endDate }).map(date => {
        const dayBookings = safeBookingsData.filter(b => 
          b?.created_at && isWithinInterval(new Date(b.created_at), { start: startOfDay(date), end: endOfDay(date) })
        );
        const dayOrders = safeOrdersData.filter(o => 
          o?.created_at && isWithinInterval(new Date(o.created_at), { start: startOfDay(date), end: endOfDay(date) })
        );
        const dayGuests = safeUsersData.filter(u => 
          u?.created_at && isWithinInterval(new Date(u.created_at), { start: startOfDay(date), end: endOfDay(date) })
        );
        
        const dayPayments = safePaymentsData.filter(p => 
          p?.created_at && isWithinInterval(new Date(p.created_at), { start: startOfDay(date), end: endOfDay(date) })
        );
        const dayRevenue = dayPayments.reduce((sum, p) => sum + Number(p?.amount || 0), 0);

        return {
          date: format(date, 'MMM dd'),
          revenue: dayRevenue,
          bookings: dayBookings.length,
          orders: dayOrders.length,
          guests: dayGuests.length
        };
      });

      const roomTypeGroups = safeRoomsData.reduce((acc: Record<string, any[]>, room) => {
        const roomType = room?.type || 'Unknown';
        if (!acc[roomType]) acc[roomType] = [];
        acc[roomType].push(room);
        return acc;
      }, {});

      const roomPerformance = Object.entries(roomTypeGroups).map(([roomType, rooms]) => {
        const typeBookings = safeBookingsData.filter(booking => 
          rooms.some(room => room?.id === booking?.room_id)
        );
        
        const typeBookingIds = new Set(typeBookings.map(b => b?.id).filter(Boolean));
        const typeRevenue = safePaymentsData
          .filter(p => p?.booking_id !== null && typeBookingIds.has(p.booking_id))
          .reduce((sum, p) => sum + Number(p?.amount || 0), 0);
        
        const totalRoomsOfType = rooms.length;
        const occupancyRate = totalRoomsOfType > 0 
          ? Math.round((typeBookings.length / totalRoomsOfType) * 100) 
          : 0;

        return {
          roomType,
          bookings: typeBookings.length,
          revenue: typeRevenue,
          occupancy: occupancyRate,
          totalRoomsOfType
        };
      });

      const menuItemSales = safeOrderItemsData.reduce((acc: Record<string, { quantity: number; revenue: number }>, item: any) => {
        const name = item?.menu_items?.name;
        const price = Number(item?.menu_items?.price || 0);
        const qty = Number(item?.quantity || 0);
        if (name && qty > 0) {
          if (!acc[name]) acc[name] = { quantity: 0, revenue: 0 };
          acc[name].quantity += qty;
          acc[name].revenue += price * qty;
        }
        return acc;
      }, {} as Record<string, { quantity: number; revenue: number }>);

      const topSellingItems = Object.entries(menuItemSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      const paymentMethods = safePaymentsData.reduce((acc, payment) => {
        if (payment?.method && payment?.status === 'completed') {
          const method = payment.method || 'Unknown';
          if (!acc[method]) acc[method] = { count: 0, amount: 0 };
          acc[method].count += 1;
          acc[method].amount += Number(payment.amount || 0);
        }
        return acc;
      }, {} as Record<string, { count: number, amount: number }>);

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
        revenueGrowth: 12.5,
        averageDailyRate: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
        revenuePerGuest: totalGuests > 0 ? Math.round(totalRevenue / totalGuests) : 0,
        totalBookings,
        confirmedBookings,
        cancelledBookings,
        bookingGrowth: 8.3,
        averageLengthOfStay: Math.round(averageLengthOfStay * 10) / 10,
        occupancyRate,
        leadTime: 14,
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
        totalConferenceBookings: safeConferenceBookingsData.length,
        averageConferenceDuration: Math.round(averageConferenceDuration * 10) / 10,
        totalRooms,
        availableRooms: totalRooms - occupancyRate,
        maintenanceRequests: safeServiceRequestsData.filter((s: any) => s?.request_type === 'maintenance').length,
        serviceRequests: safeServiceRequestsData.length,
        dailyData,
        roomPerformance,
        paymentMethods: paymentMethodsArray
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load report data.');
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
      
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246);
      pdf.text('KABINDA LODGE', 105, 25, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(107, 114, 128);
      pdf.text('Comprehensive Business Report', 105, 35, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(75, 85, 99);
      pdf.text(`Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`, 105, 45, { align: 'center' });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 70) / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 70;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      pdf.setFontSize(10);
      pdf.setTextColor(156, 163, 175);
      pdf.text('Kabinda Lodge - Luxury Hospitality Experience', 105, pdfHeight - 10, { align: 'center' });

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

      const summaryData = [
        ['KABINDA LODGE - EXECUTIVE SUMMARY'],
        ['Report Period:', `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`],
        ['Generated:', format(new Date(), 'MMM dd, yyyy HH:mm')],
        [''],
        ['FINANCIAL PERFORMANCE'],
        ['Total Revenue', `$${reportData?.totalRevenue.toLocaleString()}`],
        ['Room Revenue', `$${reportData?.roomRevenue.toLocaleString()}`],
        ['Restaurant Revenue', `$${reportData?.restaurantRevenue.toLocaleString()}`],
        [''],
        ['OPERATIONAL METRICS'],
        ['Total Bookings', reportData?.totalBookings],
        ['Occupancy Rate', `${reportData?.occupancyRate}%`]
      ];

      const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Executive Summary');

      if (reportData?.dailyData) {
        const dailyWs = XLSX.utils.json_to_sheet(reportData.dailyData);
      XLSX.utils.book_append_sheet(wb, dailyWs, 'Daily Performance');
      }

      XLSX.writeFile(wb, `kabinda-lodge-report-${format(new Date(), 'yyyy-MM-dd-HHmm')}.xlsx`);

      toast({
        title: "Success",
        description: "Excel report generated!",
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
        <div className="min-h-screen bg-slate-50 flex justify-center items-center">
            <div className="text-center space-y-4">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Generating Intelligence Report...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-slate-50/50">
        <div className="space-y-6 max-w-[1600px] mx-auto">
          
          {/* Header Section - Full Width Sticky Bar */}
          <div className="sticky top-0 z-20 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/60 border-b border-slate-200 -mx-6 -mt-6 px-6 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Business Intelligence</h1>
              <p className="text-sm text-slate-500">Performance analytics • {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}</p>
              </div>
              
            <div className="flex flex-wrap items-center gap-2">
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

              <div className="h-6 w-px bg-slate-300 mx-1 hidden sm:block" />

              <Button onClick={generateProfessionalPDF} variant="outline" size="sm" className="h-9 bg-white shadow-sm">
                <Printer className="h-3.5 w-3.5 mr-2" />
                PDF
                   </Button>
              <Button onClick={exportComprehensiveExcel} variant="outline" size="sm" className="h-9 bg-white shadow-sm">
                <FileText className="h-3.5 w-3.5 mr-2" />
                Excel
                   </Button>
              <Button onClick={fetchComprehensiveReportData} variant="ghost" size="icon" className="h-9 w-9">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
            </div>
          </div>

          <div id="reports-content" className="space-y-8">
            {/* KPI Cards */}
            {reportData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                  title="Total Revenue" 
                  value={`$${reportData.totalRevenue.toLocaleString()}`}
                  icon={DollarSign}
                  trend={{ value: reportData.revenueGrowth, isPositive: reportData.revenueGrowth >= 0 }}
                  subtext="vs last period"
                  gradientFrom="blue-500"
                  gradientTo="blue-600"
                />
                <KPICard 
                  title="Total Bookings" 
                  value={reportData.totalBookings}
                  icon={Hotel}
                  subtext={`${reportData.occupancyRate}% Occupancy Rate`}
                  gradientFrom="indigo-500"
                  gradientTo="indigo-600"
                />
                <KPICard 
                  title="Restaurant Orders" 
                  value={reportData.totalOrders}
                  icon={UtensilsCrossed}
                  subtext={`${reportData.completedOrders} Completed`}
                  gradientFrom="emerald-500"
                  gradientTo="emerald-600"
                />
                <KPICard 
                  title="Guest Satisfaction" 
                  value={`${reportData.averageRating}/5`}
                  icon={Star}
                  subtext={`${reportData.totalGuests} Total Guests`}
                  gradientFrom="orange-400"
                  gradientTo="orange-500"
                />
            </div>
            )}

            {/* Main Content Tabs */}
            {reportData && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-white border p-1 rounded-lg h-12">
                  <TabsTrigger value="overview" className="h-10 px-6 data-[state=active]:bg-slate-100">Overview</TabsTrigger>
                  <TabsTrigger value="financial" className="h-10 px-6 data-[state=active]:bg-slate-100">Financial</TabsTrigger>
                  <TabsTrigger value="operational" className="h-10 px-6 data-[state=active]:bg-slate-100">Operational</TabsTrigger>
                  <TabsTrigger value="guests" className="h-10 px-6 data-[state=active]:bg-slate-100">Guests</TabsTrigger>
              </TabsList>
              
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Trend Chart */}
                    <Card className="lg:col-span-2 shadow-sm border-slate-100">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        Revenue Trend
                      </CardTitle>
                        <CardDescription>Daily revenue performance over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={reportData.dailyData}>
                              <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray={CHART_CONFIG.gridDash} stroke={CHART_CONFIG.gridColor} vertical={false} />
                              <XAxis dataKey="date" stroke={CHART_CONFIG.axisColor} tickLine={false} axisLine={false} dy={10} />
                              <YAxis stroke={CHART_CONFIG.axisColor} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                              <Tooltip contentStyle={CHART_CONFIG.tooltipStyle} formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                              <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                        </AreaChart>
                       </ResponsiveContainer>
                      </div>
                    </CardContent>
                   </Card>

                    {/* Revenue Sources Donut */}
                    <Card className="shadow-sm border-slate-100">
                      <CardHeader>
                        <CardTitle>Revenue Sources</CardTitle>
                        <CardDescription>Income distribution by category</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="h-[250px] w-full relative">
                          <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                  { name: 'Rooms', value: reportData.roomRevenue },
                                  { name: 'Restaurant', value: reportData.restaurantRevenue },
                                  { name: 'Conference', value: reportData.conferenceRevenue }
                              ]}
                              cx="50%"
                              cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                              dataKey="value"
                            >
                                <Cell fill={COLORS.primary} />
                                <Cell fill={COLORS.secondary} />
                                <Cell fill={COLORS.accent} />
                            </Pie>
                              <Tooltip contentStyle={CHART_CONFIG.tooltipStyle} formatter={(value) => [`$${Number(value).toLocaleString()}`, '']} />
                          </PieChart>
                        </ResponsiveContainer>
                          <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                             <div className="text-2xl font-bold text-slate-800">${reportData.totalRevenue.toLocaleString()}</div>
                             <div className="text-xs text-slate-500 uppercase tracking-wide">Total</div>
                          </div>
                          </div>
                        <div className="space-y-3 mt-4">
                          {[
                            { label: 'Rooms', value: reportData.roomRevenue, color: COLORS.primary },
                            { label: 'Restaurant', value: reportData.restaurantRevenue, color: COLORS.secondary },
                            { label: 'Conference', value: reportData.conferenceRevenue, color: COLORS.accent }
                          ].map((item, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-slate-600">{item.label}</span>
                          </div>
                              <span className="font-semibold text-slate-900">${item.value.toLocaleString()}</span>
                        </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                </div>

                  {/* Daily Performance Table */}
                  <Card className="shadow-sm border-slate-100 overflow-hidden">
                    <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                      <CardTitle className="text-base font-medium">Daily Performance Digest</CardTitle>
                    </CardHeader>
                         <div className="overflow-x-auto">
                           <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500">
                          <tr>
                            <th className="text-left px-6 py-3 font-medium">Date</th>
                            <th className="text-left px-6 py-3 font-medium">Revenue</th>
                            <th className="text-left px-6 py-3 font-medium">Bookings</th>
                            <th className="text-left px-6 py-3 font-medium">Orders</th>
                            <th className="text-left px-6 py-3 font-medium">Guests</th>
                               </tr>
                             </thead>
                        <tbody className="divide-y divide-slate-100">
                          {reportData.dailyData.slice(0, 7).map((day, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-3 font-medium text-slate-900">{day.date}</td>
                              <td className="px-6 py-3 text-slate-600">${day.revenue.toLocaleString()}</td>
                              <td className="px-6 py-3 text-slate-600">{day.bookings}</td>
                              <td className="px-6 py-3 text-slate-600">{day.orders}</td>
                              <td className="px-6 py-3 text-slate-600">{day.guests}</td>
                                   </tr>
                          ))}
                             </tbody>
                           </table>
                         </div>
                   </Card>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-sm border-slate-100">
                     <CardHeader>
                       <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Transaction volume by method</CardDescription>
                     </CardHeader>
                     <CardContent>
                        <div className="h-[300px]">
                           <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.paymentMethods} layout="vertical" margin={{ left: 40 }}>
                              <CartesianGrid strokeDasharray={CHART_CONFIG.gridDash} stroke={CHART_CONFIG.gridColor} horizontal={false} />
                              <XAxis type="number" hide />
                              <YAxis dataKey="method" type="category" stroke={CHART_CONFIG.axisColor} tickLine={false} axisLine={false} width={100} />
                              <Tooltip contentStyle={CHART_CONFIG.tooltipStyle} cursor={{fill: 'transparent'}} />
                              <Bar dataKey="amount" fill={COLORS.primary} radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                       </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="shadow-sm border-slate-100">
                   <CardHeader>
                        <CardTitle>Revenue Composition</CardTitle>
                        <CardDescription>Daily breakdown by department</CardDescription>
                   </CardHeader>
                   <CardContent>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={reportData.dailyData}>
                              <CartesianGrid strokeDasharray={CHART_CONFIG.gridDash} stroke={CHART_CONFIG.gridColor} vertical={false} />
                              <XAxis dataKey="date" stroke={CHART_CONFIG.axisColor} tickLine={false} axisLine={false} />
                              <YAxis stroke={CHART_CONFIG.axisColor} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={CHART_CONFIG.tooltipStyle} />
                              <Bar dataKey="revenue" fill={COLORS.primary} radius={CHART_CONFIG.radius} />
                            </ComposedChart>
                          </ResponsiveContainer>
                     </div>
                   </CardContent>
                 </Card>
                  </div>
               </TabsContent>

              {/* Operational Tab */}
              <TabsContent value="operational" className="space-y-6">
                   <Card className="shadow-sm border-slate-100">
                     <CardHeader>
                      <CardTitle>Room Performance</CardTitle>
                      <CardDescription>Revenue and occupancy by room type</CardDescription>
                     </CardHeader>
                     <CardContent>
                      <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={reportData.roomPerformance} barGap={0}>
                            <CartesianGrid strokeDasharray={CHART_CONFIG.gridDash} stroke={CHART_CONFIG.gridColor} vertical={false} />
                            <XAxis dataKey="roomType" stroke={CHART_CONFIG.axisColor} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="left" stroke={COLORS.primary} orientation="left" tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <YAxis yAxisId="right" stroke={COLORS.secondary} orientation="right" tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                            <Tooltip contentStyle={CHART_CONFIG.tooltipStyle} />
                            <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill={COLORS.primary} radius={CHART_CONFIG.radius} barSize={32} />
                            <Bar yAxisId="right" dataKey="occupancy" name="Occupancy %" fill={COLORS.secondary} radius={CHART_CONFIG.radius} barSize={32} />
                         </BarChart>
                       </ResponsiveContainer>
                         </div>
                     </CardContent>
                   </Card>
               </TabsContent>

                {/* Guests Tab */}
                <TabsContent value="guests" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-sm border-slate-100 cursor-pointer hover:border-primary/20 transition-colors" onClick={() => setShowReviewModal(true)}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Guest Satisfaction
                          <Badge variant="outline" className="ml-auto">Manage Reviews</Badge>
                      </CardTitle>
                        <CardDescription>Average rating distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center py-6">
                          <div className="text-center">
                            <div className="text-5xl font-bold text-slate-900 mb-2">{reportData.averageRating}</div>
                            <div className="flex gap-1 mb-2 justify-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`h-6 w-6 ${star <= Math.round(reportData.averageRating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                          ))}
                        </div>
                            <p className="text-sm text-slate-500">Based on {reportData.totalGuests} reviews</p>
                          </div>
                      </div>
                    </CardContent>
                  </Card>

                    <Card className="shadow-sm border-slate-100">
                    <CardHeader>
                        <CardTitle>Demographics</CardTitle>
                        <CardDescription>New vs Returning Guests</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                           <Pie
                             data={[
                                  { name: 'New', value: reportData.newGuests, color: COLORS.primary },
                                  { name: 'Returning', value: reportData.repeatGuests, color: COLORS.secondary }
                             ]}
                             cx="50%"
                             cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                             dataKey="value"
                           >
                                <Cell fill={COLORS.primary} />
                                <Cell fill={COLORS.secondary} />
                           </Pie>
                              <Tooltip contentStyle={CHART_CONFIG.tooltipStyle} />
                         </PieChart>
                       </ResponsiveContainer>
                         </div>
                        <div className="flex justify-center gap-6 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-sm font-medium">New ({Math.round(reportData.newGuests / (reportData.totalGuests || 1) * 100)}%)</span>
                         </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-indigo-500" />
                            <span className="text-sm font-medium">Returning ({Math.round(reportData.repeatGuests / (reportData.totalGuests || 1) * 100)}%)</span>
                          </div>
                        </div>
                     </CardContent>
                   </Card>
                         </div>
                </TabsContent>

              </Tabs>
            )}

            {/* Empty State */}
            {!loading && !error && !reportData && (
              <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <BarChart3 className="h-8 w-8 text-slate-400" />
                                 </div>
                <h3 className="text-lg font-medium text-slate-900">No Data Available</h3>
                <p className="text-slate-500 max-w-sm mt-1 mb-6">There is no report data for the selected date range. Try selecting a different period.</p>
                <Button onClick={fetchComprehensiveReportData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
                                 </div>
            )}
          </div>
        </div>
      </div>

      <ReviewManagementModal 
        open={showReviewModal} 
        onOpenChange={setShowReviewModal} 
      />
    </DashboardLayout>
  );
}
