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
import { Plus, Pencil, Trash2, Settings, ChefHat, MapPin } from 'lucide-react';
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

interface Restaurant {
  id: number;
  name: string;
  type: string;
}

interface RestaurantTable {
  id: number;
  table_number: string;
  capacity: number;
  status: string;
  location_description?: string;
  restaurant_id: number;
  restaurant?: Restaurant;
  created_at: string;
  updated_at: string;
}

interface TableFormData {
  table_number: string;
  capacity: number;
  restaurant_id: string;
  location_description: string;
  status: string;
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
  
  // Restaurant Tables state
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isTableDialogOpen, setIsTableDialogOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [tablesLoading, setTablesLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    is_available: true,
    image_url: ''
  });
  
  const [tableFormData, setTableFormData] = useState<TableFormData>({
    table_number: '',
    capacity: 4,
    restaurant_id: '',
    location_description: '',
    status: 'available'
  });

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
    fetchRestaurantData();
    
    // Set up real-time subscription for restaurant tables
    const channel = supabase
      .channel('restaurant-tables-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables'
        },
        () => {
          fetchRestaurantTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

  const fetchRestaurantData = async () => {
    try {
      // Fetch restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (restaurantsError) throw restaurantsError;
      setRestaurants(restaurantsData || []);

      await fetchRestaurantTables();
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurant data",
        variant: "destructive"
      });
    }
  };

  const fetchRestaurantTables = async () => {
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .from('restaurant_tables')
        .select(`
          *,
          restaurant:restaurants(id, name, type)
        `)
        .order('restaurant_id', { ascending: true })
        .order('table_number', { ascending: true });

      if (tablesError) throw tablesError;
      setTables(tablesData || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurant tables",
        variant: "destructive"
      });
    } finally {
      setTablesLoading(false);
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

  // Restaurant Table Management Functions
  const resetTableForm = () => {
    setTableFormData({
      table_number: '',
      capacity: 4,
      restaurant_id: '',
      location_description: '',
      status: 'available'
    });
    setEditingTable(null);
  };

  const openCreateTableDialog = () => {
    resetTableForm();
    setIsTableDialogOpen(true);
  };

  const openEditTableDialog = (table: RestaurantTable) => {
    setEditingTable(table);
    setTableFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      restaurant_id: table.restaurant_id.toString(),
      location_description: table.location_description || '',
      status: table.status
    });
    setIsTableDialogOpen(true);
  };

  const handleTableSubmit = async () => {
    if (!tableFormData.table_number || !tableFormData.restaurant_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const tableData = {
        table_number: tableFormData.table_number,
        capacity: tableFormData.capacity,
        restaurant_id: parseInt(tableFormData.restaurant_id),
        location_description: tableFormData.location_description || null,
        status: tableFormData.status
      };

      if (editingTable) {
        const { error } = await supabase
          .from('restaurant_tables')
          .update(tableData)
          .eq('id', editingTable.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Table updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('restaurant_tables')
          .insert(tableData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Table added successfully"
        });
      }

      setIsTableDialogOpen(false);
      resetTableForm();
      fetchRestaurantTables();
    } catch (error) {
      console.error('Error saving table:', error);
      toast({
        title: "Error",
        description: "Failed to save table",
        variant: "destructive"
      });
    }
  };

  const handleTableDelete = async (table: RestaurantTable) => {
    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', table.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Table deleted successfully"
      });
      fetchRestaurantTables();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: "Error",
        description: "Failed to delete table",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: 'Available', variant: 'default' as const },
      occupied: { label: 'Occupied', variant: 'destructive' as const },
      reserved: { label: 'Reserved', variant: 'secondary' as const },
      maintenance: { label: 'Maintenance', variant: 'outline' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.available;
    return <Badge variant={config.variant}>{config.label}</Badge>;
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

          {/* Restaurant Table Management Section */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                    <ChefHat className="h-5 w-5" />
                    Restaurant Table Management
                  </CardTitle>
                  <CardDescription className="text-sm">Manage restaurant tables and seating arrangements</CardDescription>
                </div>
                <Button onClick={openCreateTableDialog} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Table
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tablesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="text-muted-foreground">Loading tables...</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restaurant</TableHead>
                      <TableHead>Table Number</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tables.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No tables found. Add your first restaurant table.
                        </TableCell>
                      </TableRow>
                    ) : (
                      tables.map((table) => (
                        <TableRow key={table.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{table.restaurant?.name}</div>
                              <div className="text-sm text-muted-foreground">{table.restaurant?.type}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{table.table_number}</TableCell>
                          <TableCell>{table.capacity} guests</TableCell>
                          <TableCell>{getStatusBadge(table.status)}</TableCell>
                          <TableCell>
                            {table.location_description ? (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                                <span className="text-sm">{table.location_description}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No location set</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditTableDialog(table)}
                              >
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Table</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete table "{table.table_number}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleTableDelete(table)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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

         {/* Restaurant Table Dialog */}
         <Dialog open={isTableDialogOpen} onOpenChange={setIsTableDialogOpen}>
           <DialogContent className="sm:max-w-[425px]">
             <DialogHeader>
               <DialogTitle>
                 {editingTable ? 'Edit Table' : 'Add New Table'}
               </DialogTitle>
               <DialogDescription>
                 {editingTable ? 'Update table details below.' : 'Enter the details for the new restaurant table.'}
               </DialogDescription>
             </DialogHeader>

             <div className="grid gap-4 py-4">
               <div className="grid gap-2">
                 <Label htmlFor="table-restaurant">Restaurant *</Label>
                 <Select 
                   value={tableFormData.restaurant_id} 
                   onValueChange={(value) => setTableFormData(prev => ({ ...prev, restaurant_id: value }))}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select a restaurant" />
                   </SelectTrigger>
                   <SelectContent>
                     {restaurants.map(restaurant => (
                       <SelectItem key={restaurant.id} value={restaurant.id.toString()}>
                         {restaurant.name} - {restaurant.type}
                       </SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
               </div>

               <div className="grid gap-2">
                 <Label htmlFor="table-number">Table Number *</Label>
                 <Input
                   id="table-number"
                   value={tableFormData.table_number}
                   onChange={(e) => setTableFormData(prev => ({ ...prev, table_number: e.target.value }))}
                   placeholder="e.g., T01, A1, etc."
                 />
               </div>

               <div className="grid gap-2">
                 <Label htmlFor="table-capacity">Capacity *</Label>
                 <Input
                   id="table-capacity"
                   type="number"
                   min="1"
                   max="20"
                   value={tableFormData.capacity}
                   onChange={(e) => setTableFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                 />
               </div>

               <div className="grid gap-2">
                 <Label htmlFor="table-status">Status</Label>
                 <Select 
                   value={tableFormData.status} 
                   onValueChange={(value) => setTableFormData(prev => ({ ...prev, status: value }))}
                 >
                   <SelectTrigger>
                     <SelectValue />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="available">Available</SelectItem>
                     <SelectItem value="occupied">Occupied</SelectItem>
                     <SelectItem value="reserved">Reserved</SelectItem>
                     <SelectItem value="maintenance">Maintenance</SelectItem>
                   </SelectContent>
                 </Select>
               </div>

               <div className="grid gap-2">
                 <Label htmlFor="table-location">Location Description</Label>
                 <Textarea
                   id="table-location"
                   value={tableFormData.location_description}
                   onChange={(e) => setTableFormData(prev => ({ ...prev, location_description: e.target.value }))}
                   placeholder="e.g., Near window, Corner table, etc."
                   rows={3}
                 />
               </div>
             </div>

             <DialogFooter>
               <Button variant="outline" onClick={() => setIsTableDialogOpen(false)}>
                 Cancel
               </Button>
               <Button onClick={handleTableSubmit}>
                 {editingTable ? 'Update Table' : 'Add Table'}
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