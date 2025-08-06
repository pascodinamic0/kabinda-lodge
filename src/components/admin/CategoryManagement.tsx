import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Category {
  name: string;
  count: number;
}

interface CategoryManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CategoryManagement({ isOpen, onClose }: CategoryManagementProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const fetchCategories = useCallback(async () => {
    try {
      // Get all categories with their usage count
      const { data, error } = await supabase
        .from('menu_items')
        .select('category')
        .order('category');

      if (error) throw error;

      // Count occurrences of each category
      const categoryCount: { [key: string]: number } = {};
      data?.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });

      const categoryList = Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count
      }));

      setCategories(categoryList.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      description: ''
    });
    setSelectedCategory(null);
  };

  const handleAddCategory = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setFormData({
      name: category.name,
      description: ''
    });
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (selectedCategory) {
        // Update existing category by updating all menu items with this category
        const { error } = await supabase
          .from('menu_items')
          .update({ category: formData.name })
          .eq('category', selectedCategory.name);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        // For new categories, they will be created when a menu item uses them
        toast({
          title: "Info",
          description: "Category will be available when you create menu items with this category",
        });
      }

      setIsModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryName: string, count: number) => {
    try {
      if (count > 0) {
        toast({
          title: "Cannot Delete",
          description: `This category is being used by ${count} menu item(s). Please update those items first.`,
          variant: "destructive",
        });
        return;
      }

      // Since categories don't have their own table, this would only work if there are no items
      toast({
        title: "Info",
        description: "Category will be removed when no menu items use it",
      });

      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
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
              <CardTitle>Category Management</CardTitle>
              <CardDescription>Manage menu categories</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
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
              <div className="text-muted-foreground">Loading categories...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Items Using This Category</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.name}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.count} item(s)</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditCategory(category)}
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
                                This action cannot be undone. This will affect all menu items 
                                using the category "{category.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.name, category.count)}>
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

      {/* Add/Edit Category Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription>
              {selectedCategory ? 'Update the category name.' : 'Enter details for the new category.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Appetizers, Main Courses, Desserts"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {selectedCategory ? 'Update Category' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}