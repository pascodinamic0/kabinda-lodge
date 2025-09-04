import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import RoomTypeModal from './RoomTypeModal';

interface Amenity {
  id: string;
  name: string;
  icon_name: string | null;
  category: string;
}

interface RoomType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  amenities?: Amenity[];
}

interface RoomTypeManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RoomTypeManagement({ isOpen, onClose }: RoomTypeManagementProps) {
  const { toast } = useToast();
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setHasError(false);
      fetchRoomTypes();
    } else {
      // Reset state when modal closes
      setLoading(true);
      setHasError(false);
      setRoomTypes([]);
    }
  }, [isOpen]);

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      setHasError(false);
      
      // Always start with basic room types query for reliability
      const { data: basicRoomTypes, error: basicError } = await supabase
        .from('room_types')
        .select('*')
        .order('name');
      
      if (basicError) {
        throw basicError;
      }
      
      if (!basicRoomTypes) {
        setRoomTypes([]);
        return;
      }
      
      // Try to enhance with amenities if the table exists
      const roomTypesWithAmenities = await Promise.all(
        basicRoomTypes.map(async (roomType) => {
          try {
            const { data: amenitiesData, error: amenitiesError } = await supabase
              .from('room_type_amenities')
              .select(`
                amenities(
                  id,
                  name,
                  icon_name,
                  category
                )
              `)
              .eq('room_type_id', roomType.id);
            
            if (amenitiesError || !amenitiesData) {
              // If amenities query fails, just return room type without amenities
              return {
                ...roomType,
                amenities: []
              };
            }
            
            const amenities = amenitiesData
              .map(item => item.amenities)
              .filter(Boolean) as Amenity[];
            
            return {
              ...roomType,
              amenities
            };
          } catch (amenityError) {
            console.log(`Could not fetch amenities for room type ${roomType.id}:`, amenityError);
            return {
              ...roomType,
              amenities: []
            };
          }
        })
      );
      
      setRoomTypes(roomTypesWithAmenities);
      
    } catch (error) {
      console.error('Error fetching room types:', error);
      setHasError(true);
      toast({
        title: "Error",
        description: "Failed to fetch room types",
        variant: "destructive",
      });
      // Set empty array on error so component doesn't crash
      setRoomTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoomType = () => {
    setSelectedRoomType(null);
    setIsModalOpen(true);
  };

  const handleEditRoomType = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setIsModalOpen(true);
  };

  const handleDeleteRoomType = async (roomTypeId: string, roomTypeName: string) => {
    try {
      // Check if any rooms are using this room type
      const { count, error: countError } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })
        .eq('type', roomTypeName);

      if (countError) throw countError;

      if (count && count > 0) {
        toast({
          title: "Cannot Delete",
          description: `This room type is being used by ${count} room(s). Please update those rooms first.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('room_types')
        .delete()
        .eq('id', roomTypeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Room type deleted successfully",
      });

      fetchRoomTypes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete room type",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Room Type Management</CardTitle>
              <CardDescription>Manage available room types</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddRoomType}>
                <Plus className="h-4 w-4 mr-2" />
                Add Room Type
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">Loading room types...</div>
            </div>
          ) : hasError ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="text-muted-foreground">Failed to load room types</div>
              <Button onClick={fetchRoomTypes} variant="outline">
                Try Again
              </Button>
            </div>
          ) : roomTypes.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="text-muted-foreground">No room types found</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amenities</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roomTypes.map((roomType) => (
                  <TableRow key={roomType.id}>
                    <TableCell className="font-medium">{roomType.name}</TableCell>
                    <TableCell>{roomType.description || 'No description'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {roomType.amenities && roomType.amenities.length > 0 ? (
                          roomType.amenities.slice(0, 3).map((amenity) => (
                            <Badge key={amenity.id} variant="secondary" className="text-xs">
                              {amenity.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No amenities</span>
                        )}
                        {roomType.amenities && roomType.amenities.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{roomType.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditRoomType(roomType)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the room type
                                "{roomType.name}" from the system.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteRoomType(roomType.id, roomType.name)}>
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
          )}
        </CardContent>
      </Card>

      <RoomTypeModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRoomType(null);
        }}
        onSuccess={fetchRoomTypes}
        roomType={selectedRoomType}
      />
    </div>
  );
}