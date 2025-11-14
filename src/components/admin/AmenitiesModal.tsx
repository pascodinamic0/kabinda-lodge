import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface Amenity {
  id: string;
  name: string;
  icon_name: string | null;
  category: string;
  created_at: string;
}

interface AmenitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  amenity?: Amenity | null;
  onSuccess: () => void;
}

const iconOptions = [
  { value: 'Wifi', label: 'Wi-Fi' },
  { value: 'Monitor', label: 'Monitor/Display' },
  { value: 'Mic', label: 'Microphone' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Coffee', label: 'Coffee/Refreshments' },
  { value: 'Car', label: 'Parking' },
  { value: 'Snowflake', label: 'Air Conditioning' },
  { value: 'Lightbulb', label: 'Good Lighting' },
  { value: 'Users', label: 'Seating Arrangement' },
  { value: 'Presentation', label: 'Projector' },
  { value: 'Volume2', label: 'Sound System' },
  { value: 'Camera', label: 'Video Conferencing' },
  { value: 'Printer', label: 'Printer' },
  { value: 'Shield', label: 'Security' },
  { value: 'Utensils', label: 'Catering' },
  { value: 'Clock', label: 'Clock' },
  { value: 'MapPin', label: 'Location Access' },
  { value: 'Zap', label: 'Power Outlets' },
];

const categoryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'comfort', label: 'Comfort' },
  { value: 'services', label: 'Services' },
  { value: 'accessibility', label: 'Accessibility' },
  { value: 'general', label: 'General' },
];

export default function AmenitiesModal({ isOpen, onClose, amenity, onSuccess }: AmenitiesModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: amenity?.name || '',
    icon_name: amenity?.icon_name || '',
    category: amenity?.category || 'general'
  });

  useEffect(() => {
    if (amenity) {
      setFormData({
        name: amenity.name,
        icon_name: amenity.icon_name || '',
        category: amenity.category
      });
    } else {
      setFormData({
        name: '',
        icon_name: '',
        category: 'general'
      });
    }
  }, [amenity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const amenityData = {
        name: formData.name,
        icon_name: formData.icon_name || null,
        category: formData.category
      };

      if (amenity) {
        // Update existing amenity
        const { error } = await supabase
          .from('amenities')
          .update(amenityData)
          .eq('id', amenity.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Amenity updated successfully",
        });
      } else {
        // Create new amenity
        const { error } = await supabase
          .from('amenities')
          .insert([amenityData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Amenity created successfully",
        });
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save amenity",
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
          <DialogTitle>{amenity ? 'Edit Amenity' : 'Add New Amenity'}</DialogTitle>
          <DialogDescription>
            {amenity ? 'Update amenity information' : 'Create a new amenity for rooms and conference rooms'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Amenity Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., High-Speed Wi-Fi, Projector"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="icon">Icon</Label>
            <Select 
              value={formData.icon_name} 
              onValueChange={(value) => handleChange('icon_name', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an icon (optional)" />
              </SelectTrigger>
              <SelectContent>
                {iconOptions.map((icon) => (
                  <SelectItem key={icon.value} value={icon.value}>
                    {icon.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => handleChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (amenity ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}