import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_available: boolean;
  created_at: string;
}

export default function MenuManagement() {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [isCategoryManagementOpen, setIsCategoryManagementOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    is_available: true
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
      is_available: true
    });
    setEditingMenuItem(null);
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
      is_available: menuItem.is_available
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
        is_available: formData.is_available
      };

      if (editingMenuItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(menuItemData)
          .eq('id', editingMenuItem.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Menu item updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([menuItemData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Menu item created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchMenuItems();
      fetchCategories();
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
      <div className="h-full flex flex-col overflow-hidden">
        {/* Ultra Compact Header */}
        <div className="flex-shrink-0 px-3 py-2 border-b bg-background/95">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-base font-semibold">Menu Management</h1>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsCategoryManagementOpen(true)}
                className="h-7 text-xs px-2"
              >
                <Settings className="h-3 w-3 mr-1" />
                Categories
              </Button>
              <Button 
                size="sm" 
                onClick={openCreateDialog}
                className="h-7 text-xs px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Compact Table Container */}
        <div className="flex-1 overflow-hidden px-3 py-1">
          <div className="h-full border rounded-md overflow-hidden bg-card">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-xs text-muted-foreground">Loading...</div>
              </div>
            ) : (
              <div className="h-full overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/80 border-b">
                    <tr>
                      <th className="text-left p-2 font-medium w-[25%]">Name</th>
                      <th className="text-left p-2 font-medium w-[15%]">Category</th>
                      <th className="text-left p-2 font-medium w-[10%]">Price</th>
                      <th className="text-left p-2 font-medium w-[12%]">Status</th>
                      <th className="text-left p-2 font-medium w-[28%]">Description</th>
                      <th className="text-right p-2 font-medium w-[10%]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {menuItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors">
                        <td className="p-2">
                          <div className="font-medium truncate text-xs" title={item.name}>
                            {item.name}
                          </div>
                        </td>
                        <td className="p-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white ${getCategoryBadgeColor(item.category)}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="p-2 font-medium text-xs">
                          ${item.price.toFixed(2)}
                        </td>
                        <td className="p-2">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium text-white ${item.is_available ? 'bg-green-500' : 'bg-red-500'}`}>
                            {item.is_available ? 'Available' : 'Unavailable'}
                          </span>
                        </td>
                        <td className="p-2">
                          <div className="text-xs text-muted-foreground truncate" title={item.description || 'No description'}>
                            {item.description || 'No description'}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex justify-end gap-0.5">
                            <button 
                              onClick={() => openEditDialog(item)}
                              className="h-6 w-6 flex items-center justify-center border rounded hover:bg-accent transition-colors"
                            >
                              <Pencil className="h-2.5 w-2.5" />
                            </button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button className="h-6 w-6 flex items-center justify-center border rounded hover:bg-accent transition-colors">
                                  <Trash2 className="h-2.5 w-2.5" />
                                </button>
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Ultra Compact Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[400px] max-h-[75vh] overflow-y-auto">
            <DialogHeader className="pb-1">
              <DialogTitle className="text-sm">
                {editingMenuItem ? 'Edit Item' : 'Add Item'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-2">
              <div>
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Item name"
                  className="h-7 text-xs mt-0.5"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-xs">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description"
                  rows={2}
                  className="text-xs resize-none mt-0.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <Label htmlFor="price" className="text-xs">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="0.00"
                    className="h-7 text-xs mt-0.5"
                  />
                </div>
                <div>
                  <Label htmlFor="category" className="text-xs">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="h-7 text-xs mt-0.5">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {categories.map(category => (
                        <SelectItem key={category} value={category} className="text-xs">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Switch
                  id="available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                />
                <Label htmlFor="available" className="text-xs">Available</Label>
              </div>
            </div>

            <DialogFooter className="pt-2 gap-1.5">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm" className="h-7 text-xs">
                Cancel
              </Button>
              <Button onClick={handleSubmit} size="sm" className="h-7 text-xs">
                {editingMenuItem ? 'Update' : 'Create'}
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