import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Settings, Lock, Unlock } from 'lucide-react';
import { RoomOverrideToggle } from '@/components/admin/RoomOverrideToggle';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import RoomModal from '@/components/admin/RoomModal';
import RoomTypeManagement from '@/components/admin/RoomTypeManagement';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Room {
  id: number;
  name: string;
  type: string;
  price: number;
  status: string;
  description: string | null;
  created_at: string;
  manual_override: boolean;
  override_reason: string | null;
  override_set_at: string | null;
  override_set_by: string | null;
}

export default function RoomManagement() {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoomTypeManagementOpen, setIsRoomTypeManagementOpen] = useState(false);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideRoom, setOverrideRoom] = useState<Room | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      toast({
        title: "Error",
        description: "Failed to fetch rooms",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setSelectedRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room: Room) => {
    setSelectedRoom(room);
    setIsModalOpen(true);
  };

  const handleDeleteRoom = async (roomId: number) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room deleted successfully",
      });

      fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      toast({
        title: "Error",
        description: "Failed to delete room",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500 hover:bg-green-600';
      case 'occupied':
        return 'bg-red-500 hover:bg-red-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const handleOverrideToggle = async (room: Room, enabled: boolean) => {
    if (enabled) {
      setOverrideRoom(room);
      setOverrideReason('');
      setOverrideDialogOpen(true);
    } else {
      await setRoomOverride(room.id, false);
    }
  };

  const setRoomOverride = async (roomId: number, override: boolean, reason?: string) => {
    try {
      const { error } = await supabase.rpc('set_room_override', {
        p_room_id: roomId,
        p_override: override,
        p_reason: reason || null
      });

      if (error) {
        console.error('RPC error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: `Room override ${override ? 'enabled' : 'disabled'} successfully`,
      });

      fetchRooms();
    } catch (error) {
      console.error('Error updating room override:', error);
      toast({
        title: "Warning",
        description: "Room override feature may not be available yet",
        variant: "destructive",
      });
    }
  };

  const handleOverrideConfirm = async () => {
    if (overrideRoom) {
      await setRoomOverride(overrideRoom.id, true, overrideReason);
      setOverrideDialogOpen(false);
      setOverrideRoom(null);
      setOverrideReason('');
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Room Management</CardTitle>
                <CardDescription className="text-sm">Manage hotel rooms and their details</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsRoomTypeManagementOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Room Type Management
                </Button>
                <Button onClick={handleAddRoom} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Room
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading rooms...</div>
              </div>
            ) : rooms.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">No rooms found. Add your first room!</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[100px]">Room</TableHead>
                      <TableHead className="min-w-[100px]">Type</TableHead>
                      <TableHead className="min-w-[80px]">Price</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[150px]">Manual Override</TableHead>
                      <TableHead className="min-w-[150px] hidden lg:table-cell">Description</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell className="font-medium">
                          <div className="truncate max-w-[100px]">{room.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="truncate max-w-[100px]">{room.type}</div>
                        </TableCell>
                        <TableCell className="font-medium">${room.price}/night</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadgeColor(room.status)}>
                              {room.status}
                            </Badge>
                            {room.manual_override && (
                              <div title="Manual Override Active">
                                <Lock className="h-4 w-4 text-orange-500" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoomOverrideToggle
                            isOverrideActive={room.manual_override}
                            onToggle={(enabled) => handleOverrideToggle(room, enabled)}
                            overrideReason={room.override_reason}
                          />
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="truncate max-w-[150px]">
                            {room.description || 'No description'}
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
                                    This action cannot be undone. This will permanently delete the room
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

        <RoomModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRoom(null);
          }}
          onSuccess={fetchRooms}
          room={selectedRoom}
        />

        <RoomTypeManagement
          isOpen={isRoomTypeManagementOpen}
          onClose={() => setIsRoomTypeManagementOpen(false)}
        />

        <Dialog open={overrideDialogOpen} onOpenChange={setOverrideDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enable Manual Override</DialogTitle>
              <DialogDescription>
                This will prevent automatic status changes for {overrideRoom?.name}. 
                Please provide a reason for this override.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Reason for manual override..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOverrideDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleOverrideConfirm} disabled={!overrideReason.trim()}>
                Enable Override
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}