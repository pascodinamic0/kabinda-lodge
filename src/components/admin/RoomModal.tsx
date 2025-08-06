import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import MediaUpload from '@/components/ui/media-upload';

interface RoomType {
  id: string;
  name: string;
  description: string | null;
}

interface Room {
  id: number;
  name: string;
  type: string;
  price: number;
  status: string;
  description: string | null;
}

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room?: Room | null;
  onSuccess: () => void;
}

export default function RoomModal({ isOpen, onClose, room, onSuccess }: RoomModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loadingRoomTypes, setLoadingRoomTypes] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: room?.name || '',
    type: room?.type || '',
    price: room?.price?.toString() || '',
    status: room?.status || 'available',
    description: room?.description || ''
  });

  const fetchRoomTypes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('room_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setRoomTypes(data || []);
    } catch (error) {
      console.error('Error fetching room types:', error);
      toast({
        title: "Warning",
        description: "Failed to load room types",
        variant: "destructive",
      });
    } finally {
      setLoadingRoomTypes(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRoomTypes();
  }, [fetchRoomTypes]);

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        type: room.type,
        price: room.price.toString(),
        status: room.status,
        description: room.description || ''
      });
    } else {
      setFormData({
        name: '',
        type: '',
        price: '',
        status: 'available',
        description: ''
      });
    }
  }, [room]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roomData = {
        name: formData.name,
        type: formData.type,
        price: Number(formData.price),
        status: formData.status,
        description: formData.description || null
      };

      let roomId: number;

      if (room) {
        // Update existing room
        const { error } = await supabase
          .from('rooms')
          .update(roomData)
          .eq('id', room.id);

        if (error) throw error;
        roomId = room.id;

        toast({
          title: "Success",
          description: "Room updated successfully",
        });
      } else {
        // Create new room
        const { data, error } = await supabase
          .from('rooms')
          .insert([roomData])
          .select()
          .single();

        if (error) throw error;
        roomId = data.id;

        toast({
          title: "Success",
          description: "Room created successfully",
        });
      }

      // Save room images if any were uploaded
      if (uploadedImages.length > 0) {
        // First, delete existing images for this room
        const { error: deleteError } = await supabase
          .from('room_images')
          .delete()
          .eq('room_id', roomId);

        if (deleteError) {
          console.error('Error deleting existing room images:', deleteError);
        }

        // Then insert new images
        const imageData = uploadedImages.map((imageUrl, index) => ({
          room_id: roomId,
          image_url: imageUrl,
          display_order: index + 1,
          alt_text: `${formData.name} - Image ${index + 1}`
        }));

        const { error: imageError } = await supabase
          .from('room_images')
          .insert(imageData);

        if (imageError) {
          console.error('Error saving room images:', imageError);
          toast({
            title: "Warning",
            description: "Room saved but some images may not have been uploaded",
            variant: "destructive",
          });
        }
      }

      onSuccess();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save room",
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{room ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          <DialogDescription>
            {room ? 'Update room information' : 'Create a new room'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Room Name/Number</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Room 101, Presidential Suite"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Room Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => handleChange('type', value)}
              disabled={loadingRoomTypes}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingRoomTypes ? "Loading..." : "Select room type"} />
              </SelectTrigger>
              <SelectContent>
                {roomTypes.map((roomType) => (
                  <SelectItem key={roomType.id} value={roomType.name}>
                    {roomType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price per Night ($)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleChange('price', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="occupied">Occupied</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Status automatically updates based on bookings
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Room amenities, view, special features..."
              rows={3}
            />
          </div>

          {/* Room Images Upload */}
          <div className="space-y-2">
            <Label>Room Images</Label>
            <MediaUpload
              bucketName="room-images"
              allowedTypes={['image/*']}
              maxFileSize={8}
              multiple={true}
              placeholder="Upload room images (multiple files supported)"
              currentImage={uploadedImages.length > 0 ? uploadedImages[uploadedImages.length - 1] : ''}
              onUploadSuccess={(url, fileName) => {
                setUploadedImages(prev => [...prev, url]);
                toast({
                  title: "Image uploaded",
                  description: `${fileName} uploaded successfully. Preview updated.`,
                });
              }}
              onUploadError={(error) => {
                toast({
                  title: "Upload failed",
                  description: error,
                  variant: "destructive",
                });
              }}
            />
            {uploadedImages.length > 0 && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  {uploadedImages.length} image(s) ready to be saved with room
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {uploadedImages.map((imageUrl, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={imageUrl} 
                        alt={`Room image ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (room ? 'Update' : 'Create')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}