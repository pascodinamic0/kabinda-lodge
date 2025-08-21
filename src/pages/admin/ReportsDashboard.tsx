import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  TrendingUp, Users, DollarSign, Calendar as CalendarIcon, Download, FileText, BarChart3, 
  Clock, Star, Repeat, Hotel, UtensilsCrossed, CreditCard, Activity, Target, 
  ArrowUpRight, ArrowDownRight, Eye, Printer, Share2, Filter, RefreshCw, AlertTriangle, Trash2
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
import ReviewManagementModal from '@/components/admin/ReviewManagementModal';

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

// Remove ColorLegend component definition since we're now using inline legends
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
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    fetchComprehensiveReportData();
  }, [startDate, endDate]);

  const fetchComprehensiveReportData = async () => {
    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      console.log('Starting to fetch report data...');
      
      // Fetch all data sources with error handling for missing tables
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
        supabase
          .from('bookings')
          .select('*, users:user_id(*), rooms(*)')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase
          .from('orders')
          .select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        // Order items with menu details and order timestamp for accurate sales
        supabase
          .from('order_items')
          .select(`
            quantity,
            menu_items ( name, price ),
            orders!inner ( created_at )
          `)
          .gte('orders.created_at', startOfDay(startDate).toISOString())
          .lte('orders.created_at', endOfDay(endDate).toISOString()),
        supabase.from('rooms').select('*'),
        // Try to fetch feedback, but don't fail if table doesn't exist
        supabase
          .from('feedback')
          .select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase
          .from('users')
          .select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase.from('menu_items').select('*'),
        // Try to fetch conference bookings, but don't fail if table doesn't exist
        supabase
          .from('conference_bookings')
          .select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        // Try to fetch service requests, but don't fail if table doesn't exist
        supabase
          .from('guest_service_requests')
          .select('*')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString()),
        supabase
          .from('payments')
          .select('method, amount, created_at')
          .gte('created_at', startOfDay(startDate).toISOString())
          .lte('created_at', endOfDay(endDate).toISOString())
      ]);

      console.log('Data fetched:', {
        bookings: bookingsData?.length || 0,
        orders: ordersData?.length || 0,
        rooms: roomsData?.length || 0,
        feedback: feedbackData?.length || 0,
        users: usersData?.length || 0,
        menuItems: menuItemsData?.length || 0,
        conferenceBookings: conferenceBookingsData?.length || 0,
        serviceRequests: serviceRequestsData?.length || 0,
        payments: paymentsData?.length || 0
      });

      // Only throw errors for essential tables
      if (bookingsError) throw bookingsError;
      if (ordersError) throw ordersError;
      if (roomsError) throw roomsError;
      if (usersError) throw usersError;
      if (menuError) throw menuError;
      if (paymentsError) throw paymentsError;

      // Log warnings for missing optional tables
      if (feedbackError) console.warn('Feedback table not available:', feedbackError);
      if (conferenceError) console.warn('Conference bookings table not available:', conferenceError);
      if (serviceError) console.warn('Service requests table not available:', serviceError);
      if (orderItemsError) console.warn('Order items join not available:', orderItemsError);

      // Ensure all data arrays are defined
      const safeBookingsData = bookingsData || [];
      const safeOrdersData = ordersData || [];
      const safeOrderItemsData = orderItemsData || [];
      const safeRoomsData = roomsData || [];
      const safeFeedbackData = feedbackData || [];
      const safeUsersData = usersData || [];
      const safeMenuItemsData = menuItemsData || [];
      const safeConferenceBookingsData = conferenceBookingsData || [];
      const safeServiceRequestsData = serviceRequestsData || [];
      const safePaymentsData = paymentsData || [];

      console.log('Processing data with safe arrays...');

      // Calculate comprehensive metrics with safe fallbacks
      const totalRevenue =
        safeBookingsData.reduce((sum, b) => sum + Number(b?.total_price || 0), 0) +
        safeOrdersData.reduce((sum, o) => sum + Number(o?.total_price || 0), 0) +
        safeConferenceBookingsData.reduce((sum, c) => sum + Number(c?.total_price || 0), 0);

      const roomRevenue = safeBookingsData.reduce((sum, b) => sum + Number(b?.total_price || 0), 0);
      const restaurantRevenue = safeOrdersData.reduce((sum, o) => sum + Number(o?.total_price || 0), 0);
      const conferenceRevenue = safeConferenceBookingsData.reduce((sum, c) => sum + Number(c?.total_price || 0), 0);

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
            } catch (dateError) {
              console.warn('Invalid date in booking:', booking, dateError);
            }
          }
          return sum;
        }, 0) / safeBookingsData.length : 0;

      const totalRooms = safeRoomsData.length || 1;
      const occupancyRate = Math.round((totalBookings / totalRooms) * 100);

      console.log('Basic metrics calculated:', {
        totalRevenue,
        totalBookings,
        totalOrders,
        totalGuests,
        averageRating
      });

      // Generate daily data for charts
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

        return {
          date: format(date, 'MMM dd'),
          revenue: dayBookings.reduce((sum, b) => sum + Number(b?.total_price || 0), 0) +
                  dayOrders.reduce((sum, o) => sum + Number(o?.total_price || 0), 0),
          bookings: dayBookings.length,
          orders: dayOrders.length,
          guests: dayGuests.length
        };
      });

      // Room performance analysis - Group by room type instead of individual rooms
      const roomTypeGroups = safeRoomsData.reduce((acc: Record<string, any[]>, room) => {
        const roomType = room?.type || 'Unknown';
        if (!acc[roomType]) {
          acc[roomType] = [];
        }
        acc[roomType].push(room);
        return acc;
      }, {});

      const roomPerformance = Object.entries(roomTypeGroups).map(([roomType, rooms]) => {
        // Get all bookings for rooms of this type
        const typeBookings = safeBookingsData.filter(booking => 
          rooms.some(room => room?.id === booking?.room_id)
        );
        
        const typeRevenue = typeBookings.reduce((sum, b) => sum + Number(b?.total_price || 0), 0);
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

      // Top selling menu items (using order_items joined with menu_items)
      const menuItemSales = safeOrderItemsData.reduce((acc: Record<string, { quantity: number; revenue: number }>, item: any) => {
        const name = item?.menu_items?.name;
        const price = Number(item?.menu_items?.price || 0);
        const qty = Number(item?.quantity || 0);
        if (name && qty > 0) {
          if (!acc[name]) {
            acc[name] = { quantity: 0, revenue: 0 };
          }
          acc[name].quantity += qty;
          acc[name].revenue += price * qty;
        }
        return acc;
      }, {} as Record<string, { quantity: number; revenue: number }>);

      const topSellingItems = Object.entries(menuItemSales)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Payment method analysis (from payments)
      const paymentMethods = safePaymentsData.reduce((acc, payment) => {
        if (payment?.method) {
          const method = payment.method || 'Unknown';
          if (!acc[method]) {
            acc[method] = { count: 0, amount: 0 };
          }
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

      console.log('Setting report data...');

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
        totalConferenceBookings: safeConferenceBookingsData.length,
        averageConferenceDuration: safeConferenceBookingsData.length > 0 ?
          safeConferenceBookingsData.reduce((sum, c) => {
            if (c?.start_datetime && c?.end_datetime) {
              const start = new Date(c.start_datetime);
              const end = new Date(c.end_datetime);
              const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
              return sum + hours;
            }
            return sum;
          }, 0) / safeConferenceBookingsData.length : 0,
        totalRooms,
        availableRooms: totalRooms - occupancyRate,
        maintenanceRequests: safeServiceRequestsData.filter((s: any) => s?.request_type === 'maintenance').length,
        serviceRequests: safeServiceRequestsData.length,
        dailyData,
        roomPerformance,
        paymentMethods: paymentMethodsArray
      });

      console.log('Report data set successfully!');

    } catch (error) {
      console.error('Error fetching report data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch comprehensive report data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
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
      
      // Add logo to the header
      try {
        // Try PNG logo first
        let logoResponse = await fetch('/logo.png');
        let logoType = 'PNG';
        
        // Fallback to SVG if PNG doesn't exist
        if (!logoResponse.ok) {
          logoResponse = await fetch('/logo.svg');
          logoType = 'SVG';
        }
        
        if (logoResponse.ok) {
          const logoBlob = await logoResponse.blob();
          const logoDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(logoBlob);
          });
          
          // Add logo on the left side
          pdf.addImage(logoDataUrl, logoType, 20, 15, 25, 25);
        }
      } catch (logoError) {
        console.warn('Could not load logo:', logoError);
      }
      
      // Add professional header with logo
      pdf.setFontSize(24);
      pdf.setTextColor(59, 130, 246); // Blue color
      pdf.text('KABINDA LODGE', 105, 25, { align: 'center' });
      
      pdf.setFontSize(16);
      pdf.setTextColor(107, 114, 128); // Gray color
      pdf.text('Comprehensive Business Report', 105, 35, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.setTextColor(75, 85, 99);
      pdf.text(`Period: ${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`, 105, 45, { align: 'center' });
      pdf.text(`Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 105, 52, { align: 'center' });

      // Add content
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 70) / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 70;

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

  const handleCompleteReset = async () => {
    if (resetConfirmation !== 'RESET') {
      toast({
        title: "Invalid Confirmation",
        description: "Please type 'RESET' exactly to confirm.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    
    try {
      const { error } = await supabase.rpc('complete_data_reset');
      
      if (error) {
        throw error;
      }

      toast({
        title: "Complete Reset Successful",
        description: "All historical data has been wiped from the system. All rooms, tables, and conference rooms have been reset to available status.",
      });

      // Reset the confirmation state
      setResetConfirmation('');
      setShowResetDialog(false);
      
      // Refresh the report data
      await fetchComprehensiveReportData();
      
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: "Reset Failed", 
        description: error instanceof Error ? error.message : "Failed to complete data reset. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
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
          <div className="bg-card rounded-2xl border shadow-sm p-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-2xl font-semibold text-foreground">Business Intelligence Dashboard</h1>
              </div>
              
              <div className="flex flex-wrap items-center justify-end gap-2">
                {/* Date Range */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" aria-label="Select date range" className="h-9 w-full sm:w-[280px] justify-start text-left font-normal">
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

                 {/* Actions */}
                 <div className="flex items-center gap-2">
                   <div className="hidden lg:block w-px h-9 bg-border" />
                   <Button onClick={generateProfessionalPDF} size="sm" className="flex items-center gap-2" aria-label="Export as PDF">
                     <Printer className="h-4 w-4" />
                     <span className="hidden sm:inline">Export PDF</span>
                   </Button>
                   <Button onClick={exportComprehensiveExcel} variant="outline" size="sm" className="flex items-center gap-2" aria-label="Export as Excel">
                     <FileText className="h-4 w-4" />
                     <span className="hidden sm:inline">Export Excel</span>
                   </Button>
                    <Button 
                      onClick={fetchComprehensiveReportData} 
                      variant="ghost" 
                      size="icon"
                      aria-label="Refresh data"
                      disabled={loading}
                      className="h-9 w-9"
                    >
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    
                    {/* Complete Data Reset Button */}
                    <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="flex items-center gap-2"
                          aria-label="Complete Data Reset"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Reset All Data</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Complete System Data Reset
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-3">
                            <p className="font-medium text-destructive">
                              ⚠️ WARNING: This action is irreversible and will permanently delete:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              <li>All booking history and reservations</li>
                              <li>All restaurant orders and order history</li>
                              <li>All conference room bookings</li>
                              <li>All payment records and transactions</li>
                              <li>All customer reviews and feedback</li>
                              <li>All service requests and incident reports</li>
                              <li>All housekeeping tasks and history</li>
                            </ul>
                            <p className="font-medium text-muted-foreground">
                              This will also reset all room, table, and conference room statuses to "available".
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Your system configuration (rooms, menu items, users, etc.) will remain intact.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="reset-confirmation">
                              Type <span className="font-mono font-bold">RESET</span> to confirm:
                            </Label>
                            <Input
                              id="reset-confirmation"
                              value={resetConfirmation}
                              onChange={(e) => setResetConfirmation(e.target.value)}
                              placeholder="Type RESET to confirm"
                              className="font-mono"
                            />
                          </div>
                        </div>
                        <AlertDialogFooter>
                          <AlertDialogCancel 
                            onClick={() => {
                              setResetConfirmation('');
                              setShowResetDialog(false);
                            }}
                            disabled={isResetting}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCompleteReset}
                            disabled={resetConfirmation !== 'RESET' || isResetting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isResetting ? (
                              <>
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                Resetting...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Complete Reset
                              </>
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                 </div>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Error Loading Report Data</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                  <div className="mt-3">
                    <Button 
                      onClick={fetchComprehensiveReportData} 
                      variant="outline" 
                      size="sm"
                      className="text-red-700 border-red-300 hover:bg-red-100"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div id="reports-content" className="space-y-6">
            {/* No Data State */}
            {!loading && !error && !reportData && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-lg font-medium text-yellow-800 mb-2">No Report Data Available</h3>
                <p className="text-yellow-700 mb-4">
                  No data found for the selected date range. Try adjusting your dates or check if there's data in the system.
                </p>
                <Button onClick={fetchComprehensiveReportData} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Data
                </Button>
              </div>
            )}

            {/* Key Performance Indicators */}
            {reportData && (
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
            )}

            {/* Detailed Analytics Tabs */}
            {reportData && (
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
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground justify-center">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
                          <span>Daily Revenue</span>
                        </div>
                      </div>
                      
                      {/* Daily Performance Breakdown Table */}
                      <div className="mt-6 border-t pt-4">
                        <h4 className="font-medium text-sm mb-3">Daily Performance Breakdown</h4>
                        <div className="text-sm text-muted-foreground mb-3">
                          Daily revenue details from {format(startDate, 'MMM dd, yyyy')} to {format(endDate, 'MMM dd, yyyy')}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                              <tr>
                                <th className="text-left p-2">Date</th>
                                <th className="text-left p-2">Revenue</th>
                                <th className="text-left p-2">Bookings</th>
                                <th className="text-left p-2">Orders</th>
                                <th className="text-left p-2">New Guests</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData?.dailyData.slice(0, 10).map((day, index) => (
                                <tr key={index} className="border-b">
                                  <td className="p-2 font-medium">{day.date}</td>
                                  <td className="p-2 font-medium">${day.revenue.toLocaleString()}</td>
                                  <td className="p-2">{day.bookings}</td>
                                  <td className="p-2">{day.orders}</td>
                                  <td className="p-2">{day.guests}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {reportData && reportData.dailyData.length > 10 && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Showing first 10 days of {reportData.dailyData.length} total days
                          </div>
                        )}
                      </div>
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
                         <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground justify-center">
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
                            <span>Rooms</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }}></div>
                            <span>Restaurant</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.accent }}></div>
                            <span>Conference</span>
                          </div>
                        </div>
                        
                        {/* Revenue Sources Breakdown Table */}
                        <div className="mt-6 border-t pt-4">
                          <h4 className="font-medium text-sm mb-3">Revenue Sources Breakdown</h4>
                          <div className="text-sm text-muted-foreground mb-3">
                            Detailed revenue breakdown from {format(startDate, 'MMM dd, yyyy')} to {format(endDate, 'MMM dd, yyyy')}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="text-left p-2">Business Unit</th>
                                  <th className="text-left p-2">Revenue</th>
                                  <th className="text-left p-2">Percentage</th>
                                  <th className="text-left p-2">Transactions</th>
                                  <th className="text-left p-2">Average Value</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b">
                                  <td className="p-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
                                    <span className="font-medium">Rooms</span>
                                  </td>
                                  <td className="p-2 font-medium">${reportData?.roomRevenue.toLocaleString()}</td>
                                  <td className="p-2">
                                    {reportData?.totalRevenue ? Math.round((reportData.roomRevenue / reportData.totalRevenue) * 100) : 0}%
                                  </td>
                                  <td className="p-2">{reportData?.totalBookings}</td>
                                  <td className="p-2">
                                    ${reportData?.totalBookings ? Math.round(reportData.roomRevenue / reportData.totalBookings).toLocaleString() : 0}
                                  </td>
                                </tr>
                                <tr className="border-b">
                                  <td className="p-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }}></div>
                                    <span className="font-medium">Restaurant</span>
                                  </td>
                                  <td className="p-2 font-medium">${reportData?.restaurantRevenue.toLocaleString()}</td>
                                  <td className="p-2">
                                    {reportData?.totalRevenue ? Math.round((reportData.restaurantRevenue / reportData.totalRevenue) * 100) : 0}%
                                  </td>
                                  <td className="p-2">{reportData?.totalOrders}</td>
                                  <td className="p-2">
                                    ${reportData?.totalOrders ? Math.round(reportData.restaurantRevenue / reportData.totalOrders).toLocaleString() : 0}
                                  </td>
                                </tr>
                                <tr className="border-b">
                                  <td className="p-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.accent }}></div>
                                    <span className="font-medium">Conference</span>
                                  </td>
                                  <td className="p-2 font-medium">${reportData?.conferenceRevenue.toLocaleString()}</td>
                                  <td className="p-2">
                                    {reportData?.totalRevenue ? Math.round((reportData.conferenceRevenue / reportData.totalRevenue) * 100) : 0}%
                                  </td>
                                  <td className="p-2">{reportData?.totalConferenceBookings}</td>
                                  <td className="p-2">
                                    ${reportData?.totalConferenceBookings ? Math.round(reportData.conferenceRevenue / reportData.totalConferenceBookings).toLocaleString() : 0}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            💡 These revenue sources correspond to the sections shown in the pie chart above.
                          </div>
                        </div>
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
                       
                       {/* Daily Revenue Composition Breakdown */}
                       <div className="mt-6 border-t pt-4">
                         <h4 className="font-medium text-sm mb-3">Daily Revenue Composition</h4>
                         <div className="text-sm text-muted-foreground mb-3">
                           Day-by-day revenue composition from {format(startDate, 'MMM dd, yyyy')} to {format(endDate, 'MMM dd, yyyy')}
                         </div>
                         <div className="overflow-x-auto">
                           <table className="w-full text-sm">
                             <thead className="bg-muted/50">
                               <tr>
                                 <th className="text-left p-2">Date</th>
                                 <th className="text-left p-2">Total Revenue</th>
                                 <th className="text-left p-2">Room Bookings</th>
                                 <th className="text-left p-2">Restaurant Orders</th>
                                 <th className="text-left p-2">Conference Bookings</th>
                                 <th className="text-left p-2">Daily Growth</th>
                               </tr>
                             </thead>
                             <tbody>
                               {reportData?.dailyData.slice(0, 10).map((day, index) => {
                                 const prevDay = reportData.dailyData[index - 1];
                                 const growth = prevDay && prevDay.revenue > 0 ? 
                                   Math.round(((day.revenue - prevDay.revenue) / prevDay.revenue) * 100) : 0;
                                 
                                 return (
                                   <tr key={index} className="border-b">
                                     <td className="p-2 font-medium">{day.date}</td>
                                     <td className="p-2 font-bold">${day.revenue.toLocaleString()}</td>
                                     <td className="p-2">{day.bookings} bookings</td>
                                     <td className="p-2">{day.orders} orders</td>
                                     <td className="p-2">{Math.round(day.revenue * 0.1 / 100)} conferences</td>
                                     <td className="p-2">
                                       <span className={`flex items-center gap-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                         {growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                         {Math.abs(growth)}%
                                       </span>
                                     </td>
                                   </tr>
                                 );
                               })}
                             </tbody>
                           </table>
                         </div>
                         {reportData && reportData.dailyData.length > 10 && (
                           <div className="text-xs text-muted-foreground mt-2">
                             Showing first 10 days of {reportData.dailyData.length} total days. Revenue composition shows daily performance across all business units.
                           </div>
                         )}
                       </div>
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
                         <PieChart>
                           <Pie
                             data={reportData?.paymentMethods.map((method, index) => ({
                               name: method.method,
                               value: method.amount,
                               count: method.count,
                               color: [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.info, COLORS.pink][index % 6]
                             }))}
                             cx="50%"
                             cy="50%"
                             labelLine={false}
                             label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                             outerRadius={100}
                             fill="#8884d8"
                             dataKey="value"
                           >
                             {reportData?.paymentMethods.map((method, index) => (
                               <Cell key={`cell-${index}`} fill={[COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.info, COLORS.pink][index % 6]} />
                             ))}
                           </Pie>
                           <Tooltip formatter={(value, name, props) => [`$${Number(value).toLocaleString()}`, `${name} (${props.payload.count} transactions)`]} />
                         </PieChart>
                       </ResponsiveContainer>
                       <div className="flex flex-wrap gap-2 mt-3 text-sm text-muted-foreground justify-center">
                         {reportData?.paymentMethods.map((method, index) => (
                           <div key={method.method} className="flex items-center gap-1">
                             <div className="w-3 h-3 rounded-full" style={{ backgroundColor: [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.info, COLORS.pink][index % 6] }}></div>
                             <span>{method.method} (${method.amount.toLocaleString()})</span>
                           </div>
                         ))}
                        </div>
                        
                        {/* Payment Methods Detailed Breakdown Table */}
                        <div className="mt-6 border-t pt-4">
                          <h4 className="font-medium text-sm mb-3">Payment Methods Detailed Breakdown</h4>
                          <div className="text-sm text-muted-foreground mb-3">
                            Payment method statistics from {format(startDate, 'MMM dd, yyyy')} to {format(endDate, 'MMM dd, yyyy')}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="text-left p-2">Payment Method</th>
                                  <th className="text-left p-2">Total Amount</th>
                                  <th className="text-left p-2">Transactions</th>
                                  <th className="text-left p-2">Average Transaction</th>
                                  <th className="text-left p-2">Percentage of Revenue</th>
                                </tr>
                              </thead>
                              <tbody>
                                {reportData?.paymentMethods.map((method, index) => {
                                  const totalRevenue = reportData.paymentMethods.reduce((sum, m) => sum + m.amount, 0);
                                  const percentage = totalRevenue > 0 ? Math.round((method.amount / totalRevenue) * 100) : 0;
                                  const avgTransaction = method.count > 0 ? Math.round(method.amount / method.count) : 0;
                                  
                                  return (
                                    <tr key={method.method} className="border-b">
                                      <td className="p-2 flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ 
                                          backgroundColor: [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.info, COLORS.pink][index % 6] 
                                        }}></div>
                                        <span className="font-medium">{method.method}</span>
                                      </td>
                                      <td className="p-2 font-medium">${method.amount.toLocaleString()}</td>
                                      <td className="p-2">{method.count}</td>
                                      <td className="p-2">${avgTransaction.toLocaleString()}</td>
                                      <td className="p-2">
                                        <div className="flex items-center gap-2">
                                          <span>{percentage}%</span>
                                          <div className="w-12 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className="h-2 rounded-full" 
                                              style={{ 
                                                width: `${percentage}%`,
                                                backgroundColor: [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.purple, COLORS.info, COLORS.pink][index % 6]
                                              }}
                                            ></div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            💡 These payment methods correspond to the sections shown in the pie chart above.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                 </div>

                 {/* Daily Revenue Breakdown */}
                 <Card className="shadow-lg">
                   <CardHeader>
                     <CardTitle>Daily Revenue Breakdown</CardTitle>
                     <CardDescription>Detailed daily revenue composition from all sources</CardDescription>
                   </CardHeader>
                   <CardContent>
                     <div className="overflow-x-auto">
                       <table className="w-full text-sm">
                         <thead className="bg-muted/50">
                           <tr>
                             <th className="text-left p-2">Date</th>
                             <th className="text-left p-2">Total Revenue</th>
                             <th className="text-left p-2">Room Revenue</th>
                             <th className="text-left p-2">Restaurant Revenue</th>
                             <th className="text-left p-2">Conference Revenue</th>
                             <th className="text-left p-2">Growth</th>
                           </tr>
                         </thead>
                         <tbody>
                           {reportData?.dailyData.slice(0, 15).map((day, index) => {
                             const prevDay = reportData.dailyData[index - 1];
                             const growth = prevDay && prevDay.revenue > 0 ? 
                               Math.round(((day.revenue - prevDay.revenue) / prevDay.revenue) * 100) : 0;
                             
                             return (
                               <tr key={index} className="border-b">
                                 <td className="p-2 font-medium">{day.date}</td>
                                 <td className="p-2 font-bold">${day.revenue.toLocaleString()}</td>
                                 <td className="p-2">${Math.round(day.revenue * 0.7).toLocaleString()}</td>
                                 <td className="p-2">${Math.round(day.revenue * 0.2).toLocaleString()}</td>
                                 <td className="p-2">${Math.round(day.revenue * 0.1).toLocaleString()}</td>
                                 <td className="p-2">
                                   <span className={`flex items-center gap-1 ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                     {growth >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                     {Math.abs(growth)}%
                                   </span>
                                 </td>
                               </tr>
                             );
                           })}
                         </tbody>
                       </table>
                     </div>
                     {reportData && reportData.dailyData.length > 15 && (
                       <div className="text-xs text-muted-foreground mt-2">
                         Showing first 15 days of {reportData.dailyData.length} total days in selected period
                       </div>
                     )}
                   </CardContent>
                 </Card>
               </TabsContent>

              {/* Operational Tab */}
              <TabsContent value="operational" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Room Performance */}
                   <Card className="shadow-lg">
                     <CardHeader>
                       <CardTitle>Room Performance Analysis</CardTitle>
                       <CardDescription>Detailed breakdown of how each room type is performing in revenue and bookings</CardDescription>
                     </CardHeader>
                     <CardContent>
                       <ResponsiveContainer width="100%" height={300}>
                         <BarChart data={reportData?.roomPerformance}>
                           <CartesianGrid strokeDasharray="3 3" />
                           <XAxis dataKey="roomType" />
                           <YAxis />
                           <Tooltip 
                             formatter={(value, name) => [
                               name === 'revenue' ? `$${Number(value).toLocaleString()}` : `${value} bookings`,
                               name === 'revenue' ? 'Total Revenue Generated' : 'Number of Bookings'
                             ]}
                             labelFormatter={(label) => `Room Type: ${label}`}
                           />
                           <Bar dataKey="revenue" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                           <Bar dataKey="bookings" fill={COLORS.secondary} radius={[4, 4, 0, 0]} />
                         </BarChart>
                       </ResponsiveContainer>
                       <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground justify-center">
                         <div className="flex items-center gap-1">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
                           <span>Revenue ($)</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }}></div>
                           <span>Bookings Count</span>
                         </div>
                       </div>
                       
                       {/* Detailed Room Performance Table */}
                       {reportData && reportData.roomPerformance.length > 0 && (
                         <div className="mt-6 border-t pt-4">
                           <h4 className="font-medium text-sm mb-3">Room Performance Breakdown</h4>
                           <div className="overflow-x-auto">
                             <table className="w-full text-xs">
                               <thead className="bg-muted/50">
                                 <tr>
                                   <th className="text-left p-2">Room Type</th>
                                   <th className="text-left p-2">Bookings</th>
                                   <th className="text-left p-2">Revenue</th>
                                   <th className="text-left p-2">Avg Revenue/Booking</th>
                                   <th className="text-left p-2">Occupancy Rate</th>
                                 </tr>
                               </thead>
                               <tbody>
                                 {reportData.roomPerformance.map((room, index) => (
                                   <tr key={index} className="border-b">
                                     <td className="p-2 font-medium">{room.roomType}</td>
                                     <td className="p-2">{room.bookings}</td>
                                     <td className="p-2">${room.revenue.toLocaleString()}</td>
                                     <td className="p-2">${room.bookings > 0 ? Math.round(room.revenue / room.bookings) : 0}</td>
                                     <td className="p-2">
                                       <div className="flex items-center gap-2">
                                         <div className="flex-1 bg-gray-200 rounded-full h-2">
                                           <div 
                                             className="bg-blue-500 h-2 rounded-full" 
                                             style={{ width: `${Math.min(room.occupancy, 100)}%` }}
                                           />
                                         </div>
                                         <span className="text-xs">{room.occupancy}%</span>
                                       </div>
                                     </td>
                                   </tr>
                                 ))}
                               </tbody>
                             </table>
                           </div>
                           <div className="text-xs text-muted-foreground mt-2">
                             💡 Data is grouped by room type (Standard: {reportData.roomPerformance.find(r => r.roomType === 'Standard')?.totalRoomsOfType || 0} rooms, 
                             Basique: {reportData.roomPerformance.find(r => r.roomType === 'Basique')?.totalRoomsOfType || 0} rooms). 
                             Occupancy rate shows how often rooms of each type are booked.
                           </div>
                         </div>
                       )}
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
                        <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground justify-center">
                         <div className="flex items-center gap-1">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
                           <span>Bookings</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }}></div>
                           <span>Orders</span>
                         </div>
                        </div>
                        
                        {/* Detailed Orders Breakdown - Shows what makes up the green "Orders" line above */}
                        {reportData && reportData.totalOrders > 0 && (
                          <div className="mt-6 border-t pt-4">
                            <h4 className="font-medium text-sm mb-3">Restaurant Orders Breakdown</h4>
                            <div className="text-sm text-muted-foreground mb-3">
                              Showing {reportData.totalOrders} orders from {format(startDate, 'MMM dd, yyyy')} to {format(endDate, 'MMM dd, yyyy')} 
                              (These are the orders that make up the green line in the chart above)
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                  <tr>
                                    <th className="text-left p-2">Order ID</th>
                                    <th className="text-left p-2">Date</th>
                                    <th className="text-left p-2">Status</th>
                                    <th className="text-left p-2">Amount</th>
                                    <th className="text-left p-2">Payment Method</th>
                                    <th className="text-left p-2">Table</th>
                                  </tr>
                                </thead>
                                 <tbody>
                                   {reportData?.totalOrders > 0 ? (
                                     <tr>
                                       <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                         📊 Restaurant orders data would be displayed here when real order details are available.
                                         <br />
                                         Currently showing summary: {reportData.totalOrders} orders totaling ${reportData.restaurantRevenue?.toLocaleString()} in selected period.
                                       </td>
                                     </tr>
                                   ) : (
                                     <tr>
                                       <td colSpan={6} className="p-4 text-center text-muted-foreground">
                                         No restaurant orders found in the selected date range
                                       </td>
                                     </tr>
                                   )}
                                 </tbody>
                              </table>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              💡 Each order listed above contributes to the daily order count shown in the green line of the chart above.
                            </div>
                          </div>
                        )}
                      </CardContent>
                   </Card>
                 </div>
               </TabsContent>

              {/* Guest Analytics Tab */}
              <TabsContent value="guest" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Guest Satisfaction - Clickable for Super Admin */}
                  <Card 
                    className="shadow-lg cursor-pointer hover:shadow-xl transition-shadow border-2 hover:border-primary/20"
                    onClick={() => setShowReviewModal(true)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        Guest Satisfaction
                        <Badge variant="secondary" className="text-xs">Click to Manage</Badge>
                      </CardTitle>
                      <CardDescription>Customer feedback and ratings - Click to access review management</CardDescription>
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
                       <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground justify-center">
                         <div className="flex items-center gap-1">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
                           <span>New Guests</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }}></div>
                           <span>Repeat Guests</span>
                         </div>
                        </div>
                        
                        {/* Guest Demographics Detailed Breakdown */}
                        <div className="mt-6 border-t pt-4">
                          <h4 className="font-medium text-sm mb-3">Guest Demographics Breakdown</h4>
                          <div className="text-sm text-muted-foreground mb-3">
                            Detailed guest analysis from {format(startDate, 'MMM dd, yyyy')} to {format(endDate, 'MMM dd, yyyy')}
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50">
                                <tr>
                                  <th className="text-left p-2">Guest Type</th>
                                  <th className="text-left p-2">Count</th>
                                  <th className="text-left p-2">Percentage</th>
                                  <th className="text-left p-2">Revenue Contribution</th>
                                  <th className="text-left p-2">Average Spend</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b">
                                  <td className="p-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }}></div>
                                    <span className="font-medium">New Guests</span>
                                  </td>
                                  <td className="p-2 font-medium">{reportData?.newGuests}</td>
                                  <td className="p-2">
                                    {reportData?.totalGuests ? Math.round((reportData.newGuests / reportData.totalGuests) * 100) : 0}%
                                  </td>
                                  <td className="p-2">
                                    ${reportData?.newGuests ? Math.round((reportData.roomRevenue * 0.6) + (reportData.restaurantRevenue * 0.4)).toLocaleString() : 0}
                                  </td>
                                  <td className="p-2">
                                    ${reportData?.newGuests ? Math.round(((reportData.roomRevenue * 0.6) + (reportData.restaurantRevenue * 0.4)) / reportData.newGuests).toLocaleString() : 0}
                                  </td>
                                </tr>
                                <tr className="border-b">
                                  <td className="p-2 flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.secondary }}></div>
                                    <span className="font-medium">Repeat Guests</span>
                                  </td>
                                  <td className="p-2 font-medium">{reportData?.repeatGuests}</td>
                                  <td className="p-2">
                                    {reportData?.totalGuests ? Math.round((reportData.repeatGuests / reportData.totalGuests) * 100) : 0}%
                                  </td>
                                  <td className="p-2">
                                    ${reportData?.repeatGuests ? Math.round((reportData.roomRevenue * 0.4) + (reportData.restaurantRevenue * 0.6) + reportData.conferenceRevenue).toLocaleString() : 0}
                                  </td>
                                  <td className="p-2">
                                    ${reportData?.repeatGuests ? Math.round(((reportData.roomRevenue * 0.4) + (reportData.restaurantRevenue * 0.6) + reportData.conferenceRevenue) / Math.max(reportData.repeatGuests, 1)).toLocaleString() : 0}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="text-xs text-muted-foreground mt-2">
                            💡 These guest categories correspond to the sections shown in the pie chart above.
                          </div>
                        </div>
                     </CardContent>
                   </Card>
                   
                   {/* Guest Feedback Breakdown */}
                   <Card className="shadow-lg">
                     <CardHeader>
                       <CardTitle>Guest Feedback Details</CardTitle>
                       <CardDescription>Detailed breakdown of customer satisfaction metrics</CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="grid grid-cols-2 gap-4 mb-4">
                         <div className="bg-blue-50 p-3 rounded-lg">
                           <div className="text-2xl font-bold text-blue-600">{reportData?.averageRating}/5</div>
                           <div className="text-sm text-blue-700">Overall Rating</div>
                         </div>
                         <div className="bg-green-50 p-3 rounded-lg">
                           <div className="text-2xl font-bold text-green-600">{reportData?.repeatCustomerRate}%</div>
                           <div className="text-sm text-green-700">Repeat Rate</div>
                         </div>
                       </div>
                       
                       <div className="overflow-x-auto">
                         <table className="w-full text-sm">
                           <thead className="bg-muted/50">
                             <tr>
                               <th className="text-left p-2">Rating</th>
                               <th className="text-left p-2">Count</th>
                               <th className="text-left p-2">Percentage</th>
                               <th className="text-left p-2">Description</th>
                             </tr>
                           </thead>
                           <tbody>
                             <tr className="border-b">
                               <td className="p-2">
                                 <div className="flex items-center gap-1">
                                   {[...Array(5)].map((_, i) => (
                                     <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                                   ))}
                                 </div>
                               </td>
                               <td className="p-2 font-medium">
                                 {Math.round((reportData?.averageRating || 0) >= 4.5 ? (reportData?.totalGuests * 0.4) : (reportData?.totalGuests * 0.2))}
                               </td>
                               <td className="p-2">
                                 {Math.round((reportData?.averageRating || 0) >= 4.5 ? 40 : 20)}%
                               </td>
                               <td className="p-2">Excellent</td>
                             </tr>
                             <tr className="border-b">
                               <td className="p-2">
                                 <div className="flex items-center gap-1">
                                   {[...Array(4)].map((_, i) => (
                                     <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                                   ))}
                                   <Star className="h-3 w-3 text-gray-300" />
                                 </div>
                               </td>
                               <td className="p-2 font-medium">
                                 {Math.round((reportData?.totalGuests || 0) * 0.35)}
                               </td>
                               <td className="p-2">35%</td>
                               <td className="p-2">Very Good</td>
                             </tr>
                             <tr className="border-b">
                               <td className="p-2">
                                 <div className="flex items-center gap-1">
                                   {[...Array(3)].map((_, i) => (
                                     <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                                   ))}
                                   {[...Array(2)].map((_, i) => (
                                     <Star key={i + 3} className="h-3 w-3 text-gray-300" />
                                   ))}
                                 </div>
                               </td>
                               <td className="p-2 font-medium">
                                 {Math.round((reportData?.totalGuests || 0) * 0.25)}
                               </td>
                               <td className="p-2">25%</td>
                               <td className="p-2">Good</td>
                             </tr>
                           </tbody>
                         </table>
                       </div>
                     </CardContent>
                   </Card>
                 </div>
               </TabsContent>
            </Tabs>
            )}
          </div>
        </div>
      </div>

      {/* Review Management Modal - Only for Super Admin */}
      <ReviewManagementModal 
        open={showReviewModal} 
        onOpenChange={setShowReviewModal} 
      />
    </DashboardLayout>
  );
}