import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Bed, 
  Sparkles, 
  Wrench, 
  CheckCircle, 
  Clock,
  Users,
  DollarSign,
  Lock,
  Unlock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { getGuestName } from '@/utils/guestNameUtils';
import { useToast } from '@/hooks/use-toast';
import { filterActiveBookings } from '@/utils/bookingUtils';
import { useRealtimeRooms } from '@/hooks/useRealtimeData';

interface Room {
  id: number;
  name: string;
  type: string;
  status: string;
  price: number;
  description?: string;
  currentGuest?: string;
  checkOutTime?: string;
  checkInTime?: string;
  manual_override: boolean;
  override_reason?: string | null;
  override_set_at?: string | null;
  override_set_by?: string | null;
}

const statusConfig = {
  available: { 
    label: 'Available', 
    variant: 'default' as const, 
    icon: CheckCircle, 
    color: 'text-green-600' 
  },
  occupied: { 
    label: 'Occupied', 
    variant: 'destructive' as const, 
    icon: Users, 
    color: 'text-red-600' 
  },
  maintenance: { 
    label: 'Maintenance', 
    variant: 'secondary' as const, 
    icon: Wrench, 
    color: 'text-orange-600' 
  }
};

export default function RoomStatus() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const { toast } = useToast();
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const recentlyUpdatedRoomsRef = useRef<Map<number, number>>(new Map()); // roomId -> timestamp

  const fetchUserRole = async () => {
    if (user) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setUserRole(data.role);
      } catch (error) {
        console.error('Error fetching user role:', error);
      }
    }
  };

  const fetchRooms = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if we should skip this fetch due to recent manual updates (prevent overwriting optimistic updates)
      const now = Date.now();
      const recentlyUpdated = Array.from(recentlyUpdatedRoomsRef.current.entries()).some(([roomId, timestamp]) => {
        const timeSinceUpdate = now - timestamp;
        return timeSinceUpdate < 2000; // Skip if updated within last 2 seconds
      });
      
      if (recentlyUpdated) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoomStatus.tsx:100',message:'Skipping fetchRooms - recent manual update',data:{recentlyUpdatedRooms:Array.from(recentlyUpdatedRoomsRef.current.entries())},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,E'})}).catch(()=>{});
        // #endregion
        setLoading(false);
        return; // Skip this fetch to preserve optimistic update
      }
      
      // First, update room statuses to ensure they reflect current booking expiration (9:30 AM)
      await supabase.rpc('check_expired_bookings');
      
      // Get rooms with current booking information
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('*')
        .order('name');

      if (roomsError) throw roomsError;

      // Get current bookings for each room (considering 9:30 AM expiration)
      const roomsWithBookings = await Promise.all(
        rooms.map(async (room) => {
          // Fetch all bookings for this room that might be active (include role to exclude staff)
          const { data: allBookings } = await supabase
            .from('bookings')
            .select('*, user:users(name, role)')
            .eq('room_id', room.id)
            .in('status', ['booked', 'confirmed', 'pending_verification']);

          // Filter to only active bookings (considering 9:30 AM expiration)
          const activeBookings = filterActiveBookings(allBookings || []);
          
          // Get the most relevant current booking (if any)
          const currentBooking = activeBookings.length > 0 ? activeBookings[0] : null;

          // Get guest name - NEVER show staff names
          let guestName = undefined;
          if (currentBooking) {
            guestName = getGuestName(currentBooking, (currentBooking.user as any) || null);
            // Only set if not default "Guest"
            if (guestName === 'Guest') {
              guestName = undefined;
            }
          }

          // Calculate dynamic status with same priority logic as RoomManagement:
          // Priority 1: If manual override is active, respect the DB status
          // Priority 2: If DB status is "maintenance", use that (even without manual_override)
          // Priority 3: If DB status is "occupied" and there's no active booking, preserve it (manually set)
          // Priority 4: Calculate from bookings (occupied if active booking, available otherwise)
          let calculatedStatus: string;
          if (room.manual_override) {
            calculatedStatus = room.status;
          } else if (room.status === 'maintenance') {
            calculatedStatus = room.status;
          } else if (room.status === 'occupied' && !currentBooking) {
            // Preserve manually set "occupied" status even without active booking
            calculatedStatus = room.status;
          } else {
            calculatedStatus = currentBooking ? 'occupied' : 'available';
          }
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoomStatus.tsx:138',message:'Status calculation in fetchRooms',data:{roomId:room.id,dbStatus:room.status,manualOverride:room.manual_override,hasBooking:!!currentBooking,calculatedStatus,priority:room.manual_override?'1':(room.status==='maintenance')?'2':'3'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,C,E'})}).catch(()=>{});
          // #endregion

          return {
            ...room,
            status: calculatedStatus,
            currentGuest: guestName,
            checkOutTime: currentBooking?.end_date,
            checkInTime: currentBooking?.start_date
          };
        })
      );

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoomStatus.tsx:157',message:'setRooms called in fetchRooms',data:{roomsCount:roomsWithBookings.length,allRoomStatuses:roomsWithBookings.map(r=>({id:r.id,status:r.status}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,E'})}).catch(()=>{});
      // #endregion
      setRooms(roomsWithBookings);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load room data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRooms();
    fetchUserRole();
  }, [fetchRooms]);

  // Subscribe to real-time room status changes
  useRealtimeRooms(fetchRooms);

  const updateRoomStatus = async (roomId: number, newStatus: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoomStatus.tsx:178',message:'updateRoomStatus called',data:{roomId,newStatus,currentStatus:rooms.find(r=>r.id===roomId)?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E'})}).catch(()=>{});
    // #endregion
    const room = rooms.find(r => r.id === roomId);
    if (room?.manual_override) {
      toast({
        title: "Cannot Update",
        description: "This room has manual override enabled. Only admins can change its status.",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, verify the room exists and can be updated
      const { data: existingRoom, error: fetchError } = await supabase
        .from('rooms')
        .select('id, status, manual_override')
        .eq('id', roomId)
        .single();

      if (fetchError) {
        console.error('Error fetching room:', fetchError);
        throw new Error(`Room not found: ${fetchError.message}`);
      }

      if (!existingRoom) {
        throw new Error('Room not found');
      }

      if (existingRoom.manual_override) {
        toast({
          title: "Cannot Update",
          description: "This room has manual override enabled. Only admins can change its status.",
          variant: "destructive"
        });
        return;
      }

      // Update the room status
      const { data, error } = await supabase
        .from('rooms')
        .update({ status: newStatus })
        .eq('id', roomId)
        .select();
      
      // #region agent log
      const errorKeyCount = error ? Object.keys(error).length : 0;
      fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoomStatus.tsx:216',message:'Supabase update response',data:{roomId,newStatus,hasError:!!error,errorKeyCount,errorType:typeof error,dataLength:data?.length,returnedStatus:data?.[0]?.status,errorCode:(error as any)?.code,errorMessage:(error as any)?.message,updateSucceeded:!!(data && data.length > 0)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion

      // Check if update succeeded - Supabase returns empty array when RLS blocks update
      // but doesn't return an error object
      const updateSucceeded = data && data.length > 0;
      
      if (!updateSucceeded) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoomStatus.tsx:220',message:'Update failed - no data returned (likely RLS)',data:{roomId,newStatus,data,error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        throw new Error('Unable to update room status. You may not have permission to update this room.');
      }
      
      // Check for error - handle both truthy error and error object with properties
      // Skip empty error objects {} which Supabase sometimes returns
      const hasActualError = error !== null && error !== undefined && 
        (typeof error === 'string' || 
         error instanceof Error || 
         (typeof error === 'object' && Object.keys(error).length > 0));
      
      if (hasActualError) {
        // Try to extract error message in multiple ways
        let errorMsg = 'Unknown error';
        
        if (typeof error === 'string') {
          errorMsg = error;
        } else if (error instanceof Error) {
          errorMsg = error.message || error.toString();
        } else if (typeof error === 'object' && error !== null) {
          // Try all possible error properties
          const errorObj = error as Record<string, unknown>;
          errorMsg = String(errorObj.message || 
                    errorObj.details || 
                    errorObj.hint || 
                    errorObj.code || 
                    'Database update failed');
        }
        
        // Log comprehensive error information
        const errorInfo: any = {
          error,
          errorType: typeof error,
          errorConstructor: (error as any)?.constructor?.name,
          errorMessage: errorMsg,
          errorString: String(error),
          errorJSON: JSON.stringify(error),
          hasMessage: 'message' in (error || {}),
          hasDetails: 'details' in (error || {}),
          hasCode: 'code' in (error || {}),
          roomId,
          newStatus
        };
        
        // Try to get all properties of the error object
        try {
          errorInfo.errorKeys = Object.keys(error || {});
          errorInfo.errorValues = Object.values(error || {});
          errorInfo.errorEntries = Object.entries(error || {});
          errorInfo.errorCode = (error as any)?.code;
          errorInfo.errorMessage = (error as any)?.message;
          errorInfo.errorDetails = (error as any)?.details;
          errorInfo.errorHint = (error as any)?.hint;
        } catch (e) {
          errorInfo.propertyExtractionError = String(e);
        }
        
        console.error('Supabase update error - Full details:', errorInfo);
        
        throw new Error(errorMsg);
      }
      
      // Verify we got data back
      if (!data || data.length === 0) {
        console.warn('Update may have succeeded but no data returned', { roomId, newStatus });
        // Don't throw - the update might have succeeded even without returned data
      }

      // Update local state optimistically
      try {
        // Mark this room as recently updated to prevent real-time subscription from overwriting
        const now = Date.now();
        recentlyUpdatedRoomsRef.current.set(roomId, now);
        // Clean up old entries (older than 5 seconds)
        Array.from(recentlyUpdatedRoomsRef.current.entries()).forEach(([id, timestamp]) => {
          if (now - timestamp > 5000) {
            recentlyUpdatedRoomsRef.current.delete(id);
          }
        });
        
        setRooms(prevRooms => {
          const updated = prevRooms.map(room => 
            room.id === roomId ? { ...room, status: newStatus } : room
          );
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoomStatus.tsx:317',message:'Optimistic state update',data:{roomId,newStatus,updatedRoomStatus:updated.find(r=>r.id===roomId)?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E'})}).catch(()=>{});
          // #endregion
          return updated;
        });
      } catch (stateError) {
        console.error('Error updating local state:', stateError);
        // Don't throw - the database update succeeded, just log the state error
      }

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ef9571da-842e-45a8-ae05-0af3077edbe8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'RoomStatus.tsx:356',message:'Room status update SUCCESS - database and UI updated',data:{roomId,newStatus,optimisticUIState:rooms.find(r=>r.id===roomId)?.status},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,E,G'})}).catch(()=>{});
      // #endregion
      toast({
        title: "Success",
        description: "Room status updated successfully"
      });
    } catch (error: any) {
      // Enhanced error logging with multiple fallbacks
      let errorMessage = 'Failed to update room status. Please try again.';
      
      try {
        // Try multiple ways to extract error information
        if (error) {
          if (typeof error === 'string') {
            errorMessage = error;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.details) {
            errorMessage = error.details;
          } else if (error.hint) {
            errorMessage = error.hint;
          } else if (error.code) {
            errorMessage = `Error code: ${error.code}`;
          } else {
            // Try to stringify the entire error
            const errorStr = JSON.stringify(error, null, 2);
            if (errorStr !== '{}') {
              errorMessage = errorStr;
            } else {
              // Last resort: use Object.getOwnPropertyNames
              const props = Object.getOwnPropertyNames(error);
              if (props.length > 0) {
                errorMessage = `Error: ${props.map(p => `${p}: ${error[p]}`).join(', ')}`;
              }
            }
          }
        }
        
        // Log comprehensive error info
        console.error('Error updating room status - Full Details:', {
          error,
          errorType: typeof error,
          errorConstructor: error?.constructor?.name,
          errorMessage,
          errorCode: error?.code,
          errorDetails: error?.details,
          errorHint: error?.hint,
          errorString: String(error),
          errorJSON: JSON.stringify(error, null, 2),
          errorProps: Object.getOwnPropertyNames(error),
          roomId,
          newStatus
        });
      } catch (logError) {
        // If even logging fails, use basic error info
        console.error('Error updating room status (logging failed):', {
          originalError: error,
          logError,
          roomId,
          newStatus
        });
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const clearRoomOverride = async (roomId: number) => {
    try {
      const { error } = await supabase.rpc('set_room_override', {
        p_room_id: roomId,
        p_override: false,
        p_reason: null
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Manual override cleared successfully"
      });

      fetchRooms();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear override",
        variant: "destructive",
      });
    }
  };

  const filteredRooms = rooms.filter(room => 
    filter === 'all' || room.status === filter
  );

  const getStatusCounts = () => {
    return Object.keys(statusConfig).reduce((acc, status) => {
      acc[status] = rooms.filter(room => room.status === status).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Room Status</h1>
        <p className="text-muted-foreground">Monitor and update room availability and status</p>
      </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(statusConfig).map(([status, config]) => {
            const Icon = config.icon;
            return (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{config.label}</p>
                      <p className="text-2xl font-bold text-foreground">{statusCounts[status] || 0}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${config.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filter */}
        <div className="flex justify-between items-center mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={fetchRooms} disabled={loading}>
            Refresh
          </Button>
        </div>

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            filteredRooms.map((room) => {
              const statusInfo = statusConfig[room.status as keyof typeof statusConfig];
              const StatusIcon = statusInfo?.icon || Bed;
              
              return (
                <Card key={room.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {room.name}
                        {room.manual_override && (
                          <div title={`Manual Override: ${room.override_reason || 'No reason provided'}`}>
                            <Lock className="h-4 w-4 text-orange-500" />
                          </div>
                        )}
                      </CardTitle>
                      <Badge variant={statusInfo?.variant || 'default'}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusInfo?.label || room.status}
                      </Badge>
                    </div>
                    <CardDescription>{room.type}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Price per night</span>
                      <span className="font-semibold flex items-center">
                        <DollarSign className="h-4 w-4" />
                        {room.price}
                      </span>
                    </div>
                    
                    {room.currentGuest && (
                      <div className="space-y-2 p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Current Guest:</span>
                          <span className="font-medium">{room.currentGuest}</span>
                        </div>
                        {room.checkOutTime && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Check-out:</span>
                            <span>{new Date(room.checkOutTime).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {room.manual_override && room.override_reason && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm">
                          <Lock className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-700">Manual Override Active</span>
                        </div>
                        <p className="text-xs text-orange-600 mt-1">{room.override_reason}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Select
                        value={room.status}
                        onValueChange={(value) => updateRoomStatus(room.id, value)}
                        disabled={room.manual_override}
                      >
                        <SelectTrigger className={`flex-1 ${room.manual_override ? 'opacity-50' : ''}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Available</SelectItem>
                          <SelectItem value="occupied">Occupied</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {room.manual_override && userRole === 'Admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => clearRoomOverride(room.id)}
                          title="Clear manual override"
                        >
                          <Unlock className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
    </DashboardLayout>
  );
}