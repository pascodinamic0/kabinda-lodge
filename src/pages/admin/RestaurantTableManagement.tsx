import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, MapPin } from 'lucide-react';

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

export default function RestaurantTableManagement() {
  const { toast } = useToast();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [formData, setFormData] = useState<TableFormData>({
    table_number: '',
    capacity: 4,
    restaurant_id: '',
    location_description: '',
    status: 'available'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch restaurants
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

      if (restaurantsError) throw restaurantsError;
      setRestaurants(restaurantsData || []);

      // Fetch tables with restaurant info
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
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load restaurant tables",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.table_number || !formData.restaurant_id) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const tableData = {
        table_number: formData.table_number,
        capacity: formData.capacity,
        restaurant_id: parseInt(formData.restaurant_id),
        location_description: formData.location_description || null,
        status: formData.status
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

      setIsModalOpen(false);
      setEditingTable(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving table:', error);
      toast({
        title: "Error",
        description: "Failed to save table",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (table: RestaurantTable) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      restaurant_id: table.restaurant_id.toString(),
      location_description: table.location_description || '',
      status: table.status
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (table: RestaurantTable) => {
    if (!confirm(`Are you sure you want to delete table ${table.table_number}?`)) {
      return;
    }

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
      fetchData();
    } catch (error) {
      console.error('Error deleting table:', error);
      toast({
        title: "Error",
        description: "Failed to delete table",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      table_number: '',
      capacity: 4,
      restaurant_id: '',
      location_description: '',
      status: 'available'
    });
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

  if (loading) {
    return (
      <DashboardLayout title="Restaurant Table Management">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Restaurant Table Management">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Restaurant Tables</h1>
            <p className="text-muted-foreground">Manage restaurant tables and seating arrangements</p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingTable(null); resetForm(); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Table
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingTable ? 'Edit Table' : 'Add New Table'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="restaurant">Restaurant *</Label>
                  <Select 
                    value={formData.restaurant_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, restaurant_id: value }))}
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

                <div className="space-y-2">
                  <Label htmlFor="table_number">Table Number *</Label>
                  <Input
                    id="table_number"
                    value={formData.table_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, table_number: e.target.value }))}
                    placeholder="e.g., T01, A1, etc."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.capacity}
                    onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
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

                <div className="space-y-2">
                  <Label htmlFor="location_description">Location Description</Label>
                  <Textarea
                    id="location_description"
                    value={formData.location_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_description: e.target.value }))}
                    placeholder="e.g., Near window, Corner table, etc."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingTable ? 'Update Table' : 'Add Table'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Restaurant Tables ({tables.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Table Number</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Actions</TableHead>
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
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(table)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(table)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}