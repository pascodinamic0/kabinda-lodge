import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ConferenceRoomModal from '@/components/admin/ConferenceRoomModal';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface ConferenceRoom {
  id: number;
  name: string;
  capacity: number;
  hourly_rate: number;
  status: string;
  description: string | null;
  features: string[];
  created_at: string;
}

export default function ConferenceRoomManagement() {
  const { toast } = useToast();
  const [conferenceRooms, setConferenceRooms] = useState<ConferenceRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<ConferenceRoom | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchConferenceRooms();
  }, []);

  const fetchConferenceRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('conference_rooms')
        .select('*')
        .order('name');

      if (error) throw error;
      setConferenceRooms(data || []);
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
              <Button onClick={handleAddRoom} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Add Conference Room
              </Button>
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
                      <TableHead className="min-w-[100px]">Hourly Rate</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
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
                        <TableCell className="font-medium">${room.hourly_rate}/hour</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(room.status)}>
                            {room.status}
                          </Badge>
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
      </div>
    </DashboardLayout>
  );
}