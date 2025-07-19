import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CategoryManagement from '@/components/admin/CategoryManagement';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import MediaUpload from '@/components/ui/media-upload';

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_available: boolean;
  created_at: string;
  image_url: string | null;
}

export default function MenuManagement() {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    is_available: true,
    image_url: ''
  });

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('category')
        .order('category', { ascending: true });

      if (error) throw error;
      
      // Get unique categories from existing menu items
      const uniqueCategories = [...new Set(data?.map(item => item.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'appetizer':
        return 'bg-green-500';
      case 'main course':
        return 'bg-blue-500';
      case 'dessert':
        return 'bg-purple-500';
      case 'beverage':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      is_available: true,
      image_url: ''
    });
    setEditingMenuItem(null);
    setUploadedImages([]);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (menuItem: MenuItem) => {
    setFormData({
      name: menuItem.name,
      description: menuItem.description || '',
      price: menuItem.price.toString(),
      category: menuItem.category,
      is_available: menuItem.is_available,
      image_url: menuItem.image_url || ''
    });
    setEditingMenuItem(menuItem);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const menuItemData = {
        name: formData.name,
        description: formData.description || null,
        price: Number(formData.price),
        category: formData.category,
        is_available: formData.is_available,
        image_url: uploadedImages.length > 0 ? uploadedImages[0] : formData.image_url || null
      };

      let menuItemId: number;

      if (editingMenuItem) {
        // Update existing menu item
        const { error } = await supabase
          .from('menu_items')
          .update(menuItemData)
          .eq('id', editingMenuItem.id);

        if (error) throw error;
        menuItemId = editingMenuItem.id;

        toast({
          title: "Success",
          description: "Menu item updated successfully",
        });
      } else {
        // Create new menu item
        const { data, error } = await supabase
          .from('menu_items')
          .insert([menuItemData])
          .select()
          .single();

        if (error) throw error;
        menuItemId = data.id;

        toast({
          title: "Success",
          description: "Menu item created successfully",
        });
      }

      // Save menu item images if any were uploaded
      if (uploadedImages.length > 0) {
        // First, delete existing images for this menu item
        const { error: deleteError } = await supabase
          .from('menu_images')
          .delete()
          .eq('menu_item_id', menuItemId);

        if (deleteError) {
          console.error('Error deleting existing menu images:', deleteError);
        }

        // Then insert new images
        const imageData = uploadedImages.map((imageUrl, index) => ({
          menu_item_id: menuItemId,
          image_url: imageUrl,
          display_order: index + 1,
          alt_text: `${formData.name} - Image ${index + 1}`
        }));

        const { error: imageError } = await supabase
          .from('menu_images')
          .insert(imageData);

        if (imageError) {
          console.error('Error saving menu images:', imageError);
          toast({
            title: "Warning",
            description: "Menu item saved but some images may not have been uploaded",
            variant: "destructive",
          });
        }
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMenuItems();
      fetchCategories(); // Refresh categories list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save menu item",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (menuItemId: number) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', menuItemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });

      fetchMenuItems();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };


  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Menu Management</CardTitle>
                <CardDescription className="text-sm">View and manage restaurant menu items</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCategoryManagementOpen(true)}
                  className="w-full sm:w-auto"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Categories
                </Button>
                <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Menu Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="text-muted-foreground">Loading menu items...</div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryBadgeColor(item.category)}>
                          {item.category}
                        </Badge>
                      </TableCell>
                      <TableCell>${item.price}</TableCell>
                      <TableCell>
                        <Badge className={item.is_available ? 'bg-green-500' : 'bg-red-500'}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {item.description || 'No description'}
                      </TableCell>
                       <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                           <Button 
                             variant="outline" 
                             size="sm"
                             onClick={() => openEditDialog(item)}
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
                                 <AlertDialogTitle>Delete Menu Item</AlertDialogTitle>
                                 <AlertDialogDescription>
                                   Are you sure you want to delete "{item.name}"? This action cannot be undone.
                                 </AlertDialogDescription>
                               </AlertDialogHeader>
                               <AlertDialogFooter>
                                 <AlertDialogCancel>Cancel</AlertDialogCancel>
                                 <AlertDialogAction onClick={() => handleDelete(item.id)}>
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

         {/* Create/Edit Menu Item Dialog */}
         <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogContent className="sm:max-w-[600px]">
             <DialogHeader>
               <DialogTitle>
                 {editingMenuItem ? 'Edit Menu Item' : 'Create New Menu Item'}
               </DialogTitle>
               <DialogDescription>
                 {editingMenuItem ? 'Update menu item details below.' : 'Enter the details for the new menu item.'}
               </DialogDescription>
             </DialogHeader>

             <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="name">Name</Label>
                 <Input
                   id="name"
                   value={formData.name}
                   onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                   placeholder="e.g., Grilled Salmon"
                 />
               </div>

               <div className="grid gap-2">
                 <Label htmlFor="description">Description</Label>
                 <Textarea
                   id="description"
                   value={formData.description}
                   onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                   placeholder="Brief description of the dish"
                   rows={3}
                 />
               </div>

               <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-2">
                   <Label htmlFor="price">Price ($)</Label>
                   <Input
                     id="price"
                     type="number"
                     min="0"
                     step="0.01"
                     value={formData.price}
                     onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                     placeholder="e.g., 24.99"
                   />
                 </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* All available categories */}
                        {categories.map(category => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
               </div>

                {/* Menu Item Image Upload */}
                <div className="space-y-2">
                  <Label>Menu Item Images</Label>
                  <MediaUpload
                    bucketName="menu-images"
                    allowedTypes={['image/*']}
                    maxFileSize={5}
                    multiple={true}
                    currentImage={uploadedImages.length > 0 ? uploadedImages[uploadedImages.length - 1] : formData.image_url}
                    placeholder="Upload menu item images (multiple files supported)"
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
                        {uploadedImages.length} image(s) ready to be saved with menu item
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {uploadedImages.map((imageUrl, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={imageUrl} 
                              alt={`Menu item image ${index + 1}`}
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

                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  />
                  <Label htmlFor="available">Available for ordering</Label>
                </div>
             </div>

             <DialogFooter>
               <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                 Cancel
               </Button>
               <Button onClick={handleSubmit}>
                 {editingMenuItem ? 'Update Item' : 'Create Item'}
               </Button>
             </DialogFooter>
           </DialogContent>
          </Dialog>

        <CategoryManagement
          isOpen={isCategoryManagementOpen}
          onClose={() => setIsCategoryManagementOpen(false)}
        />
      </div>
    </DashboardLayout>
  );
}