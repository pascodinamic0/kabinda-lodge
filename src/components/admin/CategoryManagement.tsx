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
  id?: number;
  name: string;
  description?: string | null;
  display_order?: number;
  count?: number;
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
  const [migrationNeeded, setMigrationNeeded] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const fetchCategories = useCallback(async () => {
    try {
      // Get all categories from the categories table
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (categoriesError) {
        // Check if it's a "relation does not exist" error (table doesn't exist)
        if (categoriesError.message?.includes('does not exist') || categoriesError.code === '42P01') {
          setMigrationNeeded(true);
          setCategories([]);
          toast({
            title: "Migration Required",
            description: "The categories table doesn't exist yet. Please run the database migration first.",
            variant: "destructive",
          });
          return;
        }
        throw categoriesError;
      }

      setMigrationNeeded(false);

      // Get menu items count for each category
      const { data: menuItemsData, error: menuItemsError } = await supabase
        .from('menu_items')
        .select('category');

      if (menuItemsError) throw menuItemsError;

      // Count occurrences of each category
      const categoryCount: { [key: string]: number } = {};
      menuItemsData?.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });

      // Merge categories with their counts
      const categoryList = categoriesData?.map(cat => ({
        ...cat,
        count: categoryCount[cat.name] || 0
      })) || [];

      setCategories(categoryList);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

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
      description: category.description || ''
    });
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "Category name is required",
          variant: "destructive",
        });
        return;
      }

      if (selectedCategory && selectedCategory.id) {
        // Update existing category
        const oldCategoryName = selectedCategory.name;
        const newCategoryName = formData.name.trim();

        // Update category in categories table
        const { error: categoryError } = await supabase
          .from('categories')
          .update({ 
            name: newCategoryName,
            description: formData.description || null
          })
          .eq('id', selectedCategory.id);

        if (categoryError) throw categoryError;

        // If name changed, update all menu items with this category
        if (oldCategoryName !== newCategoryName) {
          const { error: menuItemsError } = await supabase
            .from('menu_items')
            .update({ category: newCategoryName })
            .eq('category', oldCategoryName);

          if (menuItemsError) throw menuItemsError;
        }

        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert([{
            name: formData.name.trim(),
            description: formData.description || null,
            display_order: categories.length + 1
          }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      setIsModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async (categoryId: number, categoryName: string, count: number) => {
    try {
      if (count > 0) {
        toast({
          title: "Cannot Delete",
          description: `This category is being used by ${count} menu item(s). Please update those items first.`,
          variant: "destructive",
        });
        return;
      }

      // Delete category from categories table
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Category deleted successfully",
      });

      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete category",
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
              <Button onClick={handleAddCategory} disabled={migrationNeeded}>
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
          ) : migrationNeeded ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Database Migration Required
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  The categories table doesn't exist in your database yet. You need to run the migration to use this feature.
                </p>
                <div className="text-left bg-white rounded p-4 mb-4">
                  <p className="text-xs font-mono text-gray-700 mb-2">
                    <strong>Steps to fix:</strong>
                  </p>
                  <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Open Supabase Dashboard → SQL Editor</li>
                    <li>Copy contents from: <code className="bg-gray-100 px-1 rounded">supabase/migrations/20250719130000_add_categories_table.sql</code></li>
                    <li>Paste and run the SQL</li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
                <p className="text-xs text-red-600">
                  See <strong>APPLY_MIGRATION_INSTRUCTIONS.md</strong> for detailed steps
                </p>
              </div>
            </div>
          ) : categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No categories yet</p>
              <Button onClick={handleAddCategory}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Category
              </Button>
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
                  <TableRow key={category.id || category.name}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.count || 0} item(s)</TableCell>
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
                                This action cannot be undone. This will delete the category "{category.name}".
                                {category.count && category.count > 0 && 
                                  ` This category is being used by ${category.count} menu item(s).`}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.id!, category.name, category.count || 0)}>
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
            <div className="grid gap-2">
              <Label htmlFor="category-description">Description (Optional)</Label>
              <Textarea
                id="category-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
                rows={3}
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