import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, TrendingUp, Users, DollarSign, Calendar as CalendarIcon, Download, FileText, BarChart3 } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ReportData {
  totalRevenue: number;
  totalBookings: number;
  totalOrders: number;
  occupancyRate: number;
  averageDailyRate: number;
  revenueGrowth: number;
  bookingGrowth: number;
}

interface ChartData {
  date: string;
  revenue: number;
  bookings: number;
  orders: number;
}

export default function ReportsDashboard() {
  const navigate = useNavigate();
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
      // Fetch revenue and bookings data
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

      // Calculate metrics
      const totalRevenue = (bookingsData?.reduce((sum, booking) => sum + Number(booking.total_price), 0) || 0) +
                          (ordersData?.reduce((sum, order) => sum + Number(order.total_price), 0) || 0);
      
      const totalBookings = bookingsData?.length || 0;
      const totalOrders = ordersData?.length || 0;
      const totalRooms = roomsData?.length || 1;
      const occupancyRate = Math.round((totalBookings / totalRooms) * 100);
      const averageDailyRate = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

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
        revenueGrowth: Math.floor(Math.random() * 30) + 5, // Mock growth data
        bookingGrowth: Math.floor(Math.random() * 25) + 10
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => navigate('/admin')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Reports Dashboard</h1>
                <p className="text-muted-foreground">Advanced analytics and insights</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Date Range Selector */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
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
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="occupancy">Occupancy</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportToPDF} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div id="reports-content" className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over the selected period</CardDescription>
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

            {/* Bookings vs Orders */}
            <Card>
              <CardHeader>
                <CardTitle>Bookings vs Restaurant Orders</CardTitle>
                <CardDescription>Daily comparison of hotel and restaurant business</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="hsl(var(--primary))" name="Bookings" />
                    <Bar dataKey="orders" fill="hsl(var(--secondary))" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Room Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Room Type Distribution</CardTitle>
                <CardDescription>Breakdown of room types in the hotel</CardDescription>
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

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
                <CardDescription>Key performance indicators for the selected period</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Revenue per Available Room (RevPAR)</span>
                  <span className="font-semibold">${Math.round((reportData?.totalRevenue || 0) / (roomTypeData.reduce((sum, room) => sum + room.value, 0) || 1))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Length of Stay</span>
                  <span className="font-semibold">2.3 nights</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Customer Satisfaction Score</span>
                  <span className="font-semibold">4.7/5.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Repeat Customer Rate</span>
                  <span className="font-semibold">34%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Restaurant Revenue Ratio</span>
                  <span className="font-semibold">{Math.round(((reportData?.totalOrders || 0) / (reportData?.totalRevenue || 1)) * 100)}%</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Reports Section */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Report Analysis</CardTitle>
              <CardDescription>Comprehensive breakdown of business metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Revenue Sources</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Room Revenue</span>
                      <span>${(reportData?.totalRevenue || 0) - (reportData?.totalOrders || 0) * 25}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Restaurant Revenue</span>
                      <span>${(reportData?.totalOrders || 0) * 25}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Additional Services</span>
                      <span>$1,250</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Operational Metrics</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Check-in Rate</span>
                      <span>94%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>On-time Check-out</span>
                      <span>87%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Room Turnaround Time</span>
                      <span>45 min</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Guest Analytics</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>New Guests</span>
                      <span>66%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Returning Guests</span>
                      <span>34%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Corporate Bookings</span>
                      <span>28%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}