import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, Users, DollarSign, Calendar as CalendarIcon, Download, FileText, BarChart3, Clock, Star, Repeat } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface ReportData {
  totalRevenue: number;
  totalBookings: number;
  totalOrders: number;
  occupancyRate: number;
  averageDailyRate: number;
  revenueGrowth: number;
  bookingGrowth: number;
  averageLengthOfStay: number;
  customerSatisfaction: number;
  repeatCustomerRate: number;
}

interface ChartData {
  date: string;
  revenue: number;
  bookings: number;
  orders: number;
}

export default function ReportsDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [roomTypeData, setRoomTypeData] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportType, setReportType] = useState<string>('overview');

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch current period data
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());

      if (bookingsError) throw bookingsError;

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());

      if (ordersError) throw ordersError;

      const { data: roomsData, error: roomsError } = await supabase
        .from('rooms')
        .select('*');

      if (roomsError) throw roomsError;

      // Fetch feedback data for customer satisfaction
      const { data: feedbackData, error: feedbackError } = await supabase
        .from('feedback')
        .select('rating, user_id')
        .gte('created_at', startOfDay(startDate).toISOString())
        .lte('created_at', endOfDay(endDate).toISOString());

      if (feedbackError) throw feedbackError;

      // Fetch previous period data for growth calculations
      const periodLength = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const previousStartDate = subDays(startDate, periodLength);
      const previousEndDate = subDays(endDate, periodLength);

      const { data: previousBookings } = await supabase
        .from('bookings')
        .select('total_price, user_id')
        .gte('created_at', startOfDay(previousStartDate).toISOString())
        .lte('created_at', endOfDay(previousEndDate).toISOString());

      const { data: previousOrders } = await supabase
        .from('orders')
        .select('total_price')
        .gte('created_at', startOfDay(previousStartDate).toISOString())
        .lte('created_at', endOfDay(previousEndDate).toISOString());

      // Calculate current period metrics
      const totalRevenue = (bookingsData?.reduce((sum, booking) => sum + Number(booking.total_price), 0) || 0) +
                          (ordersData?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0);
      
      const totalBookings = bookingsData?.length || 0;
      const totalOrders = ordersData?.length || 0;
      const totalRooms = roomsData?.length || 1;
      const occupancyRate = Math.round((totalBookings / totalRooms) * 100);
      const averageDailyRate = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

      // Calculate growth metrics
      const previousRevenue = (previousBookings?.reduce((sum, booking) => sum + Number(booking.total_price), 0) || 0) +
                             (previousOrders?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0);
      const previousBookingCount = previousBookings?.length || 0;

      const revenueGrowth = previousRevenue > 0 ? 
        Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100) : 0;
      const bookingGrowth = previousBookingCount > 0 ? 
        Math.round(((totalBookings - previousBookingCount) / previousBookingCount) * 100) : 0;

      // Calculate average length of stay
      const averageLengthOfStay = bookingsData && bookingsData.length > 0 ? 
        bookingsData.reduce((sum, booking) => {
          const start = new Date(booking.start_date);
          const end = new Date(booking.end_date);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / bookingsData.length : 0;

      // Calculate customer satisfaction (average rating)
      const customerSatisfaction = feedbackData && feedbackData.length > 0 ?
        feedbackData.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbackData.length : 0;

      // Calculate repeat customer rate
      const uniqueUsers = bookingsData ? [...new Set(bookingsData.map(b => b.user_id))] : [];
      const { data: allUserBookings } = await supabase
        .from('bookings')
        .select('user_id')
        .in('user_id', uniqueUsers);
        
      const userBookingCounts = allUserBookings?.reduce((acc, booking) => {
        acc[booking.user_id] = (acc[booking.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const repeatCustomers = Object.values(userBookingCounts).filter(count => count > 1).length;
      const repeatCustomerRate = uniqueUsers.length > 0 ? 
        Math.round((repeatCustomers / uniqueUsers.length) * 100) : 0;

      // Generate chart data for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(endDate, 6 - i);
        const dayBookings = bookingsData?.filter(b => 
          format(new Date(b.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ) || [];
        const dayOrders = ordersData?.filter(o => 
          format(new Date(o.created_at), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        ) || [];
        
        return {
          date: format(date, 'MMM dd'),
          revenue: dayBookings.reduce((sum, b) => sum + Number(b.total_price), 0) +
                  dayOrders.reduce((sum, o) => sum + Number(o.total_price), 0),
          bookings: dayBookings.length,
          orders: dayOrders.length
        };
      });

      // Room type distribution
      const roomTypes = roomsData?.reduce((acc, room) => {
        acc[room.type] = (acc[room.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const roomTypeChartData = Object.entries(roomTypes).map(([type, count]) => ({
        name: type,
        value: count,
        color: `hsl(${Math.random() * 360}, 70%, 50%)`
      }));

      setReportData({
        totalRevenue,
        totalBookings,
        totalOrders,
        occupancyRate,
        averageDailyRate,
        revenueGrowth,
        bookingGrowth,
        averageLengthOfStay: Math.round(averageLengthOfStay * 10) / 10,
        customerSatisfaction: Math.round(customerSatisfaction * 10) / 10,
        repeatCustomerRate
      });
      
      setChartData(last7Days);
      setRoomTypeData(roomTypeChartData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    const reportElement = document.getElementById('reports-content');
    if (!reportElement) return;

    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your report...",
      });

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`hotel-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

      toast({
        title: "Success",
        description: "Report exported successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading reports...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              {/* Date Range Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate && endDate ? (
                    `${format(startDate, 'MMM dd, yyyy')} - ${format(endDate, 'MMM dd, yyyy')}`
                  ) : (
                    <span>Pick a date range</span>
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
                      className="pointer-events-auto"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">End Date</label>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => date && setEndDate(date)}
                      className="pointer-events-auto"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>

              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="overview">Overview</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="occupancy">Occupancy</SelectItem>
                <SelectItem value="restaurant">Restaurant</SelectItem>
              </SelectContent>
            </Select>

              <Button onClick={exportToPDF} className="flex items-center gap-2 w-full sm:w-auto">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>

        <div id="reports-content" className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${reportData?.totalRevenue.toLocaleString()}</div>
                <p className="text-xs opacity-90">+{reportData?.revenueGrowth}% from last period</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.totalBookings}</div>
                <p className="text-xs opacity-90">+{reportData?.bookingGrowth}% from last period</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Restaurant Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.totalOrders}</div>
                <p className="text-xs opacity-90">Food & beverage sales</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Occupancy Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.occupancyRate}%</div>
                <p className="text-xs opacity-90">Current occupancy</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-teal-500 to-teal-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Avg Daily Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${reportData?.averageDailyRate}</div>
                <p className="text-xs opacity-90">Per booking average</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Avg Length of Stay
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.averageLengthOfStay} days</div>
                <p className="text-xs opacity-90">Average guest stay duration</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Customer Satisfaction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.customerSatisfaction}/5</div>
                <p className="text-xs opacity-90">Average rating from feedback</p>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Repeat className="h-4 w-4" />
                  Repeat Customer Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.repeatCustomerRate}%</div>
                <p className="text-xs opacity-90">Customers with multiple bookings</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Room Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roomTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roomTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}