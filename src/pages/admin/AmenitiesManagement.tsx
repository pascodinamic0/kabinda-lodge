import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AmenitiesModal from '@/components/admin/AmenitiesModal';
import DashboardLayout from '@/components/dashboard/DashboardLayout';

interface Amenity {
  id: string;
  name: string;
  icon_name: string | null;
  category: string;
  created_at: string;
}

export default function AmenitiesManagement() {
  const { toast } = useToast();
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchAmenities();
  }, []);

  const fetchAmenities = async () => {
    try {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setAmenities(data || []);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch amenities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAmenity = () => {
    setSelectedAmenity(null);
    setIsModalOpen(true);
  };

  const handleEditAmenity = (amenity: Amenity) => {
    setSelectedAmenity(amenity);
    setIsModalOpen(true);
  };

  const handleDeleteAmenity = async (amenityId: string, amenityName: string) => {
    try {
      // Room type amenities table not implemented yet - skip usage check
      console.log('Room type amenities usage check not available yet');
      const roomTypeCount = 0;

      // Check if amenity is being used by any rooms
      const { count: roomCount, error: roomError } = await supabase
        .from('room_amenities')
        .select('*', { count: 'exact', head: true })
        .eq('amenity_id', amenityId);

      if (roomError) throw roomError;

      const totalUsage = (roomTypeCount || 0) + (roomCount || 0);

      if (totalUsage > 0) {
        toast({
          title: "Cannot Delete",
          description: `This amenity is being used by ${totalUsage} room type(s) or room(s). Please remove it from all rooms first.`,
          variant: "destructive",
        });
        return;
      }

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

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'technology': 'bg-blue-100 text-blue-800',
      'comfort': 'bg-green-100 text-green-800',
      'services': 'bg-purple-100 text-purple-800',
      'accessibility': 'bg-orange-100 text-orange-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Amenities Management</h1>
            <p className="text-muted-foreground">Manage available amenities for rooms and conference rooms</p>
          </div>
          <Button onClick={handleAddAmenity}>
            <Plus className="h-4 w-4 mr-2" />
            Add Amenity
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
            <CardDescription>All available amenities in the system</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading amenities...</div>
              </div>
            ) : amenities.length === 0 ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">No amenities found</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {amenities.map((amenity) => (
                    <TableRow key={amenity.id}>
                      <TableCell className="font-medium">{amenity.name}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(amenity.category)}>
                          {amenity.category.charAt(0).toUpperCase() + amenity.category.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {amenity.icon_name ? (
                          <Badge variant="outline">{amenity.icon_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">No icon</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(amenity.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditAmenity(amenity)}
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
                                  This action cannot be undone. This will permanently delete the amenity
                                  "{amenity.name}" from the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteAmenity(amenity.id, amenity.name)}>
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

        <AmenitiesModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAmenity(null);
          }}
          onSuccess={fetchAmenities}
          amenity={selectedAmenity}
        />
      </div>
    </DashboardLayout>
  );
}





