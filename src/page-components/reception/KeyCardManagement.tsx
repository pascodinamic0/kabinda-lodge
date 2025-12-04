import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CreditCard, 
  KeyRound, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Cpu,
  Wifi,
  WifiOff,
  Search,
  Calendar,
  User,
  Bed,
  Loader2,
  ExternalLink
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { getDefaultHotelId } from '@/utils/hotelUtils';
import { 
  getAgents, 
  getCardIssues, 
  getLocalAgentStatus,
  updateCardIssueStatus 
} from '@/services/hotelLockService';
import type { Agent, CardIssue } from '@/types/hotelLock';

// Status badge configuration
const statusConfig: Record<CardIssue['status'], { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  in_progress: { label: 'Processing', variant: 'default', icon: Loader2 },
  queued: { label: 'Queued', variant: 'outline', icon: Clock },
  done: { label: 'Completed', variant: 'default', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'destructive', icon: XCircle },
};

// Active booking type
interface ActiveBooking {
  id: string;
  room_name: string;
  guest_name: string;
  check_in: string;
  check_out: string;
  status: string;
  room_id: number;
}

const KeyCardManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('status');
  
  // Agent status
  const [agents, setAgents] = useState<Agent[]>([]);
  const [localAgentStatus, setLocalAgentStatus] = useState<{
    connected: boolean;
    readerConnected: boolean;
    checking: boolean;
  }>({ connected: false, readerConnected: false, checking: true });
  
  // Card issues
  const [cardIssues, setCardIssues] = useState<CardIssue[]>([]);
  const [issueFilter, setIssueFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active bookings for quick card programming
  const [activeBookings, setActiveBookings] = useState<ActiveBooking[]>([]);

  // Initialize hotel ID
  useEffect(() => {
    const loadHotelId = async () => {
      try {
        const id = await getDefaultHotelId();
        setHotelId(id);
      } catch (error) {
        console.error('Error loading hotel ID:', error);
        toast({
          title: 'Error',
          description: 'Failed to load hotel information.',
          variant: 'destructive',
        });
      }
    };
    loadHotelId();
  }, [toast]);

  // Load data when hotel ID is available
  useEffect(() => {
    if (hotelId) {
      loadAllData();
    }
  }, [hotelId]);

  // Check local agent status periodically
  useEffect(() => {
    checkLocalAgent();
    const interval = setInterval(checkLocalAgent, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkLocalAgent = async () => {
    setLocalAgentStatus(prev => ({ ...prev, checking: true }));
    try {
      const status = await getLocalAgentStatus();
      setLocalAgentStatus({
        connected: status.connected !== false,
        readerConnected: status.readerConnected || false,
        checking: false,
      });
    } catch {
      setLocalAgentStatus({
        connected: false,
        readerConnected: false,
        checking: false,
      });
    }
  };

  const loadAgents = useCallback(async (hId: string) => {
    try {
      const data = await getAgents(hId);
      setAgents(data);
    } catch (error) {
      console.error('Error loading agents:', error);
    }
  }, []);

  const loadCardIssues = useCallback(async (hId: string) => {
    try {
      const data = await getCardIssues(hId, { limit: 50 });
      setCardIssues(data);
    } catch (error) {
      console.error('Error loading card issues:', error);
    }
  }, []);

  const loadActiveBookings = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          check_in,
          check_out,
          status,
          room:rooms(id, name),
          user:users(name, email)
        `)
        .in('status', ['confirmed', 'checked_in'])
        .gte('check_out', today)
        .order('check_in', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Bookings query error:', error);
        // Don't throw, just set empty array
        setActiveBookings([]);
        return;
      }

      const bookings: ActiveBooking[] = (data || []).map((b: any) => ({
        id: b.id,
        room_name: b.room?.name || 'Unknown Room',
        guest_name: b.user?.name || b.user?.email || 'Unknown Guest',
        check_in: b.check_in,
        check_out: b.check_out,
        status: b.status,
        room_id: b.room?.id,
      }));
      
      setActiveBookings(bookings);
    } catch (error) {
      console.error('Error loading active bookings:', error);
      setActiveBookings([]);
    }
  }, []);

  const loadAllData = useCallback(async () => {
    if (!hotelId) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadAgents(hotelId),
        loadCardIssues(hotelId),
        loadActiveBookings(),
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [hotelId, loadAgents, loadCardIssues, loadActiveBookings]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAllData(), checkLocalAgent()]);
    setRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Data has been updated.',
    });
  }, [loadAllData, toast]);

  const handleRetryCardIssue = async (cardIssue: CardIssue) => {
    try {
      await updateCardIssueStatus(cardIssue.id, { status: 'pending' });
      toast({
        title: 'Retry Queued',
        description: 'The card programming request has been re-queued.',
      });
      loadCardIssues();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to retry card issue.',
        variant: 'destructive',
      });
    }
  };

  const navigateToBookingDetails = (bookingId: string) => {
    navigate(`/kabinda-lodge/reception/booking/${bookingId}`);
  };

  // Filter card issues
  const filteredCardIssues = cardIssues.filter(issue => {
    const matchesFilter = issueFilter === 'all' || issue.status === issueFilter;
    const matchesSearch = searchQuery === '' || 
      issue.payload?.guestName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.payload?.roomNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Calculate stats
  const pendingCount = cardIssues.filter(i => i.status === 'pending' || i.status === 'queued').length;
  const completedCount = cardIssues.filter(i => i.status === 'done').length;
  const failedCount = cardIssues.filter(i => i.status === 'failed').length;
  const onlineAgents = agents.filter(a => a.status === 'online').length;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Key Card Management</h1>
            <p className="text-muted-foreground mt-1">
              Program door access cards for guest rooms
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Agent Connection Status Alert */}
        {!localAgentStatus.checking && !localAgentStatus.connected && (
          <Alert variant="destructive">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Card Reader Not Connected</AlertTitle>
            <AlertDescription>
              The local card programming agent is not running. Please ensure the Hotel Lock Agent 
              application is installed and running on this computer to program key cards.
            </AlertDescription>
          </Alert>
        )}

        {localAgentStatus.connected && !localAgentStatus.readerConnected && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Card Reader Not Detected</AlertTitle>
            <AlertDescription>
              The agent is running but no card reader is connected. Please connect a USB card reader 
              to program key cards.
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Agent Status</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {localAgentStatus.checking ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : localAgentStatus.connected ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-2xl font-bold">
                  {localAgentStatus.connected ? 'Online' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {onlineAgents} registered agent{onlineAgents !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Cards</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingCount}</div>
              <p className="text-xs text-muted-foreground">Awaiting programming</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{completedCount}</div>
              <p className="text-xs text-muted-foreground">Successfully programmed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failedCount}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="status">Card Issues</TabsTrigger>
            <TabsTrigger value="bookings">Active Bookings</TabsTrigger>
          </TabsList>

          {/* Card Issues Tab */}
          <TabsContent value="status" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by guest or room..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={issueFilter} onValueChange={setIssueFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                  <SelectItem value="done">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Card Issues List */}
            {filteredCardIssues.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <CreditCard className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No card issues found</h3>
                  <p className="text-muted-foreground">
                    {issueFilter === 'all' 
                      ? "No card programming requests yet. Go to a booking to program a key card." 
                      : `No card issues with status "${issueFilter}".`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredCardIssues.map((issue) => {
                  const statusInfo = statusConfig[issue.status];
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <Card key={issue.id}>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-muted rounded-lg">
                              <KeyRound className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {issue.payload?.roomNumber || 'Room N/A'}
                                </span>
                                <Badge variant={statusInfo.variant} className="flex items-center gap-1">
                                  <StatusIcon className={`h-3 w-3 ${issue.status === 'in_progress' ? 'animate-spin' : ''}`} />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {issue.payload?.guestName || 'Unknown Guest'}
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(issue.created_at).toLocaleString()}
                                </span>
                                {issue.card_type && (
                                  <span className="flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    {issue.card_type}
                                  </span>
                                )}
                              </div>
                              {issue.error_message && (
                                <p className="text-sm text-red-500 mt-1">
                                  Error: {issue.error_message}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {issue.status === 'failed' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleRetryCardIssue(issue)}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Retry
                              </Button>
                            )}
                            {issue.booking_id && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => navigateToBookingDetails(issue.booking_id!)}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                View Booking
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Active Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Bookings</CardTitle>
                <CardDescription>
                  Click on a booking to program key cards for the guest
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeBookings.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No active bookings found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {activeBookings.map((booking) => (
                      <div 
                        key={booking.id}
                        className="flex items-center justify-between py-4 hover:bg-muted/50 px-2 -mx-2 rounded-lg cursor-pointer transition-colors"
                        onClick={() => navigateToBookingDetails(booking.id)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Bed className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{booking.room_name}</span>
                              <Badge variant={booking.status === 'checked_in' ? 'default' : 'secondary'}>
                                {booking.status === 'checked_in' ? 'Checked In' : 'Confirmed'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-3 w-3" />
                              {booking.guest_name}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <KeyRound className="h-4 w-4 mr-1" />
                          Program Card
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default KeyCardManagement;
