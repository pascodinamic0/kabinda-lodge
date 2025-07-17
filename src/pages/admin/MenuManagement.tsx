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
        // Update existing menu item
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
        // Create new menu item
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
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 p-4 border-b bg-background">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold">Menu Management</h1>
              <p className="text-sm text-muted-foreground">View and manage restaurant menu items</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                onClick={() => setIsCategoryManagementOpen(true)}
                className="w-full sm:w-auto text-xs px-3 py-2"
                size="sm"
              >
                <Settings className="h-3 w-3 mr-2" />
                Categories
              </Button>
              <Button onClick={openCreateDialog} className="w-full sm:w-auto text-xs px-3 py-2" size="sm">
                <Plus className="h-3 w-3 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          <Card className="h-full flex flex-col">
            <CardContent className="flex-1 overflow-hidden p-0">
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="text-muted-foreground">Loading menu items...</div>
                </div>
              ) : (
                <div className="h-full overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow className="border-b">
                        <TableHead className="font-medium text-left py-3 px-3 w-[200px]">Name</TableHead>
                        <TableHead className="font-medium text-left py-3 px-3 w-[120px]">Category</TableHead>
                        <TableHead className="font-medium text-left py-3 px-3 w-[80px]">Price</TableHead>
                        <TableHead className="font-medium text-left py-3 px-3 w-[100px]">Status</TableHead>
                        <TableHead className="font-medium text-left py-3 px-3 flex-1 min-w-[200px]">Description</TableHead>
                        <TableHead className="font-medium text-right py-3 px-3 w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {menuItems.map((item) => (
                        <TableRow key={item.id} className="border-b hover:bg-accent/30 transition-colors">
                          <TableCell className="font-medium py-3 px-3 truncate max-w-[200px]" title={item.name}>
                            {item.name}
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            <Badge 
                              className={`${getCategoryBadgeColor(item.category)} text-white text-xs px-2 py-1`}
                            >
                              {item.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-3 font-medium text-sm">
                            ${item.price.toFixed(2)}
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            <Badge 
                              className={`${item.is_available ? 'bg-green-500' : 'bg-red-500'} text-white text-xs px-2 py-1`}
                            >
                              {item.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3 px-3 max-w-[200px]">
                            <div className="truncate text-sm" title={item.description || 'No description'}>
                              {item.description || 'No description'}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-3">
                            <div className="flex justify-end gap-1">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => openEditDialog(item)}
                                className="h-8 w-8 p-0"
                              >
                                <Pencil className="h-3 w-3" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                                    <Trash2 className="h-3 w-3" />
                                    <span className="sr-only">Delete</span>
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Create/Edit Menu Item Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
            <DialogHeader className="pb-3">
              <DialogTitle className="text-lg">
                {editingMenuItem ? 'Edit Menu Item' : 'Create New Menu Item'}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingMenuItem ? 'Update menu item details below.' : 'Enter the details for the new menu item.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Grilled Salmon"
                  className="text-sm"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the dish"
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="price" className="text-sm font-medium">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="24.99"
                    className="text-sm"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {categories.map(category => (
                        <SelectItem key={category} value={category} className="text-sm">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <Switch
                  id="available"
                  checked={formData.is_available}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                />
                <Label htmlFor="available" className="text-sm font-medium">Available for ordering</Label>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} size="sm">
                Cancel
              </Button>
              <Button onClick={handleSubmit} size="sm">
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