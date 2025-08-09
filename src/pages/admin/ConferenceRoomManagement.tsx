import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ConferenceRoomModal from '@/components/admin/ConferenceRoomModal';
import AmenitiesModal from '@/components/admin/AmenitiesModal';
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
              <div className="flex gap-2">
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
                      <TableHead className="min-w-[100px]">Hourly Rate</TableHead>
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
                        <TableCell className="font-medium">${room.hourly_rate}/hour</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusBadgeColor(room.status)}>
                              {room.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStatusToggle(room.id, room.status)}
                              className="h-6 w-6 p-0"
                              title="Quick status toggle"
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
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
      </div>
    </DashboardLayout>
  );
}