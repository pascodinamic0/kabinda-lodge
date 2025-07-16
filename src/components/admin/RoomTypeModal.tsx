import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface RoomType {
  id: string;
  name: string;
  description: string | null;
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
  const [formData, setFormData] = useState({
    name: roomType?.name || '',
    description: roomType?.description || ''
  });

  React.useEffect(() => {
    if (roomType) {
      setFormData({
        name: roomType.name,
        description: roomType.description || ''
      });
    } else {
      setFormData({
        name: '',
        description: ''
      });
    }
  }, [roomType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roomTypeData = {
        name: formData.name,
        description: formData.description || null
      };

      if (roomType) {
        // Update existing room type
        const { error } = await supabase
          .from('room_types')
          .update(roomTypeData)
          .eq('id', roomType.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Room type updated successfully",
        });
      } else {
        // Create new room type
        const { error } = await supabase
          .from('room_types')
          .insert([roomTypeData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Room type created successfully",
        });
      }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
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