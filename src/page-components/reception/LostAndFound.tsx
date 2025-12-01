import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Package, 
  Clock, 
  CheckCircle, 
  Search,
  MapPin,
  Calendar,
  Loader2
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface LostItem {
  id: string;
  item_name: string;
  description?: string;
  location_found?: string;
  date_found: string;
  found_by?: string;
  contact_info?: string;
  status: string;
  claimed_by?: string;
  claimed_date?: string;
  created_at?: string;
  updated_at?: string;
}

const categories = [
  'Electronics',
  'Clothing',
  'Jewelry',
  'Documents',
  'Keys',
  'Personal Items',
  'Books/Media',
  'Sports Equipment',
  'Other'
];

const statuses = [
  { value: 'unclaimed', label: 'Unclaimed', icon: Package, color: 'text-yellow-600' },
  { value: 'claimed', label: 'Claimed', icon: CheckCircle, color: 'text-green-600' },
  { value: 'disposed', label: 'Disposed', icon: Clock, color: 'text-gray-600' }
];

export default function LostAndFound() {
  const [items, setItems] = useState<LostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewItemDialog, setShowNewItemDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // New item form state
  const [newItem, setNewItem] = useState({
    item_name: '',
    description: '',
    location_found: '',
    found_by: '',
    contact_info: ''
  });

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('lost_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching lost items:', error);
      toast({
        title: "Error",
        description: "Failed to load lost items",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleCreateItem = async () => {
    if (!newItem.item_name || !newItem.location_found) {
      toast({
        title: "Error",
        description: "Please fill in item name and found location",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lost_items')
        .insert([{
          item_name: newItem.item_name,
          description: newItem.description || null,
          location_found: newItem.location_found,
          found_by: newItem.found_by || null,
          contact_info: newItem.contact_info || null,
          date_found: new Date().toISOString().split('T')[0], // Today's date
          status: 'unclaimed'
        }]);

      if (error) throw error;

      await fetchItems(); // Refresh the list
      setNewItem({
        item_name: '',
        description: '',
        location_found: '',
        found_by: '',
        contact_info: ''
      });
      setShowNewItemDialog(false);

      toast({
        title: "Success",
        description: "Lost item logged successfully"
      });
    } catch (error) {
      console.error('Error creating item:', error);
      toast({
        title: "Error",
        description: "Failed to log lost item",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateItemStatus = async (itemId: string, newStatus: string, claimedBy?: string) => {
    try {
      const updateData: any = {
        status: newStatus
      };

      if (newStatus === 'claimed' && claimedBy) {
        updateData.claimed_by = claimedBy;
        updateData.claimed_date = new Date().toISOString().split('T')[0];
      } else if (newStatus !== 'claimed') {
        updateData.claimed_by = null;
        updateData.claimed_date = null;
      }

      const { error } = await supabase
        .from('lost_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      await fetchItems(); // Refresh the list

      toast({
        title: "Success",
        description: "Item status updated successfully"
      });
    } catch (error) {
      console.error('Error updating item status:', error);
      toast({
        title: "Error",
        description: "Failed to update item status",
        variant: "destructive"
      });
    }
  };

  const filteredItems = items.filter(item => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.location_found && item.location_found.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const getStatusInfo = (status: string) => {
    return statuses.find(s => s.value === status) || statuses[0];
  };

  const getStatusCounts = () => {
    return statuses.reduce((acc, status) => {
      acc[status.value] = items.filter(item => item.status === status.value).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Lost & Found</h1>
          <p className="text-muted-foreground">Manage lost and found items from guests</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {statuses.map((status) => {
            const Icon = status.icon;
            return (
              <Card key={status.value}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{status.label}</p>
                      <p className="text-2xl font-bold text-foreground">{statusCounts[status.value] || 0}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${status.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Search, Filter and Actions */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search items by name, description, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="unclaimed">Unclaimed</SelectItem>
              <SelectItem value="claimed">Claimed</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showNewItemDialog} onOpenChange={setShowNewItemDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Log Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Lost Item</DialogTitle>
                <DialogDescription>
                  Record a new item found by staff or guests
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="item_name">Item Name *</Label>
                  <Input
                    id="item_name"
                    value={newItem.item_name}
                    onChange={(e) => setNewItem({...newItem, item_name: e.target.value})}
                    placeholder="iPhone, Watch, Keys, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    placeholder="Describe the item (color, brand, condition, etc.)"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="location_found">Found Location *</Label>
                  <Input
                    id="location_found"
                    value={newItem.location_found}
                    onChange={(e) => setNewItem({...newItem, location_found: e.target.value})}
                    placeholder="Room 101, Restaurant, Lobby, etc."
                  />
                </div>

                <div>
                  <Label htmlFor="found_by">Found By</Label>
                  <Input
                    id="found_by"
                    value={newItem.found_by}
                    onChange={(e) => setNewItem({...newItem, found_by: e.target.value})}
                    placeholder="Staff member or guest name"
                  />
                </div>

                <div>
                  <Label htmlFor="contact_info">Contact Info</Label>
                  <Input
                    id="contact_info"
                    value={newItem.contact_info}
                    onChange={(e) => setNewItem({...newItem, contact_info: e.target.value})}
                    placeholder="Phone number or room number"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewItemDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateItem}
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Log Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Items List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || filter !== 'all' ? 'No items found matching your criteria.' : 'No lost items recorded yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => {
              const statusInfo = getStatusInfo(item.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground text-lg">
                            {item.item_name}
                          </h3>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        {item.description && (
                          <p className="text-muted-foreground mb-3">{item.description}</p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          {item.location_found && (
                            <div className="flex items-center gap-2 min-w-0">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">Found: {item.location_found}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 min-w-0">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">Date: {new Date(item.date_found).toLocaleDateString()}</span>
                          </div>
                          {item.found_by && (
                            <div className="flex items-center gap-2 min-w-0">
                              <Package className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">By: {item.found_by}</span>
                            </div>
                          )}
                          {item.contact_info && (
                            <div className="flex items-center gap-2 min-w-0">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">Contact: {item.contact_info}</span>
                            </div>
                          )}
                        </div>
                        
                        {item.claimed_by && item.claimed_date && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Claimed by:</strong> {item.claimed_by} on {new Date(item.claimed_date).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.status === 'unclaimed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const claimedBy = prompt('Enter name of person claiming the item:');
                              if (claimedBy) {
                                updateItemStatus(item.id, 'claimed', claimedBy);
                              }
                            }}
                          >
                            Mark as Claimed
                          </Button>
                        )}
                        <Select
                          value={item.status}
                          onValueChange={(value) => updateItemStatus(item.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unclaimed">Unclaimed</SelectItem>
                            <SelectItem value="claimed">Claimed</SelectItem>
                            <SelectItem value="disposed">Disposed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}