import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
  amenities?: Amenity[];
}

interface RoomTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomType?: RoomType | null;
  onSuccess: () => void;
}

export default function RoomTypeModal({ isOpen, onClose, roomType, onSuccess }: RoomTypeModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loadingAmenities, setLoadingAmenities] = useState(true);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: roomType?.name || '',
    description: roomType?.description || ''
  });

  const fetchAmenities = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('amenities')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setAmenities(data || []);
    } catch (error) {
      console.error('Error fetching amenities:', error);
      toast({
        title: "Warning",
        description: "Failed to load amenities",
        variant: "destructive",
      });
    } finally {
      setLoadingAmenities(false);
    }
  }, [toast]);

  const fetchRoomTypeAmenities = useCallback(async (roomTypeId: string) => {
    // Room type amenities table not implemented yet
    setSelectedAmenities([]);
  }, []);

  useEffect(() => {
    fetchAmenities();
  }, [fetchAmenities]);

  React.useEffect(() => {
    if (roomType) {
      setFormData({
        name: roomType.name,
        description: roomType.description || ''
      });
      fetchRoomTypeAmenities(roomType.id);
    } else {
      setFormData({
        name: '',
        description: ''
      });
      setSelectedAmenities([]);
    }
  }, [roomType, fetchRoomTypeAmenities]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roomTypeData = {
        name: formData.name,
        description: formData.description || null
      };

      let roomTypeId: string;

      if (roomType) {
        // Update existing room type
        const { error } = await supabase
          .from('room_types')
          .update(roomTypeData)
          .eq('id', roomType.id);

        if (error) throw error;
        roomTypeId = roomType.id;

        toast({
          title: "Success",
          description: "Room type updated successfully",
        });
      } else {
        // Create new room type
        const { data, error } = await supabase
          .from('room_types')
          .insert([roomTypeData])
          .select()
          .single();

        if (error) throw error;
        roomTypeId = data.id;

        toast({
          title: "Success",
          description: "Room type created successfully",
        });
      }

      // Room type amenities functionality not implemented yet
      console.log('Room type amenities associations will be handled when the table is available');

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save room type",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAmenityToggle = (amenityId: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenityId) 
        ? prev.filter(id => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const groupedAmenities = amenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, Amenity[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{roomType ? 'Edit Room Type' : 'Add New Room Type'}</DialogTitle>
          <DialogDescription>
            {roomType ? 'Update room type information' : 'Create a new room type'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Room Type Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Deluxe, Suite, Standard"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of this room type..."
              rows={3}
            />
          </div>

          {/* Room Type Amenities Selection */}
          <div className="space-y-4">
            <Label>Included Amenities</Label>
            <p className="text-sm text-muted-foreground">
              Select amenities that will be included with all rooms of this type
            </p>
            {loadingAmenities ? (
              <p className="text-sm text-muted-foreground">Loading amenities...</p>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {Object.entries(groupedAmenities).map(([category, categoryAmenities]) => (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-sm capitalize text-muted-foreground">{category}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {categoryAmenities.map((amenity) => (
                        <label key={amenity.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAmenities.includes(amenity.id)}
                            onChange={() => handleAmenityToggle(amenity.id)}
                            className="rounded"
                          />
                          <span className="text-sm">{amenity.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (roomType ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}