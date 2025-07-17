import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

  const fetchCategories = async () => {
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
  };

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
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-semibold">Category Management</CardTitle>
              <CardDescription className="text-base mt-1">Manage menu categories</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <Button onClick={handleAddCategory} className="w-full sm:w-auto px-4 py-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
              <Button variant="outline" onClick={onClose} className="w-full sm:w-auto px-4 py-2">
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="text-muted-foreground text-lg">Loading categories...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="font-semibold text-left py-4 px-4 min-w-[250px]">Category Name</TableHead>
                    <TableHead className="font-semibold text-left py-4 px-4 min-w-[200px]">Items Using This Category</TableHead>
                    <TableHead className="font-semibold text-right py-4 px-4 min-w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.name} className="border-b hover:bg-accent/50 transition-colors">
                      <TableCell className="font-medium py-4 px-4">{category.name}</TableCell>
                      <TableCell className="py-4 px-4">
                        <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm">
                          {category.count} item(s)
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 px-4">
                        <div className="flex justify-end gap-3">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditCategory(category)}
                            className="px-3 py-2"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="px-3 py-2">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Category Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-xl">
              {selectedCategory ? 'Edit Category' : 'Add New Category'}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedCategory ? 'Update the category name.' : 'Enter details for the new category.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid gap-3">
              <Label htmlFor="category-name" className="text-sm font-medium">Category Name</Label>
              <Input
                id="category-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Appetizers, Main Courses, Desserts"
                className="px-3 py-2"
              />
            </div>
          </div>

          <DialogFooter className="pt-6 gap-3">
            <Button variant="outline" onClick={() => setIsModalOpen(false)} className="px-6 py-2">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="px-6 py-2">
              {selectedCategory ? 'Update Category' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}