import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Phone,
  Mail
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface ServiceRequest {
  id: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  room_number?: string;
  request_type: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  completed_at?: string;
  assigned_to?: string;
  user_id?: string;
}

const requestTypes = [
  'Room Service',
  'Housekeeping',
  'Maintenance',
  'Concierge',
  'IT Support',
  'Restaurant Reservation',
  'Transportation',
  'Other'
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

const statuses = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'text-yellow-600' },
  { value: 'assigned', label: 'Assigned', icon: AlertCircle, color: 'text-blue-600' },
  { value: 'in_progress', label: 'In Progress', icon: AlertCircle, color: 'text-blue-600' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600' },
  { value: 'cancelled', label: 'Cancelled', icon: AlertCircle, color: 'text-gray-600' }
];

export default function GuestServices() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // New request form state
  const [newRequest, setNewRequest] = useState({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    room_number: '',
    request_type: '',
    description: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('guest_service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Map database records to component format
      const mappedRequests: ServiceRequest[] = (data || []).map((req: any) => ({
        id: req.id,
        guest_name: req.guest_name || '',
        guest_email: req.guest_email || '',
        guest_phone: req.guest_phone || '',
        room_number: req.room_number || '',
        request_type: req.request_type || '',
        description: req.description || '',
        priority: req.priority || 'medium',
        status: req.status || 'pending',
        created_at: req.created_at,
        completed_at: req.completed_at,
        assigned_to: req.assigned_to,
        user_id: req.user_id
      }));

      setRequests(mappedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load service requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!newRequest.guest_name || !newRequest.room_number || !newRequest.request_type || !newRequest.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('guest_service_requests')
        .insert([
          {
            guest_name: newRequest.guest_name,
            guest_email: newRequest.guest_email || null,
            guest_phone: newRequest.guest_phone || null,
            room_number: newRequest.room_number,
            request_type: newRequest.request_type,
            description: newRequest.description,
            priority: newRequest.priority,
            status: 'pending',
            user_id: null // Receptionist-created requests don't require user_id
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Refresh the list
      await fetchRequests();

      // Reset form
      setNewRequest({
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        room_number: '',
        request_type: '',
        description: '',
        priority: 'medium'
      });
      setShowNewRequestDialog(false);

      toast({
        title: "Success",
        description: "Service request created successfully"
      });
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create service request",
        variant: "destructive"
      });
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const updateData: any = {
        status: newStatus
      };

      // Set completed_at when status is completed
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      // Set assigned_to when status is assigned or in_progress
      if (newStatus === 'assigned' || newStatus === 'in_progress') {
        updateData.assigned_to = user?.id || null;
      }

      const { error } = await supabase
        .from('guest_service_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      // Refresh the list to get updated data
      await fetchRequests();

      toast({
        title: "Success",
        description: "Request status updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update request status",
        variant: "destructive"
      });
    }
  };

  const filteredRequests = requests.filter(request => 
    filter === 'all' || request.status === filter
  );

  const getStatusInfo = (status: string) => {
    return statuses.find(s => s.value === status) || statuses[0];
  };

  const getPriorityInfo = (priority: string) => {
    return priorities.find(p => p.value === priority) || priorities[1];
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Guest Services</h1>
          <p className="text-muted-foreground">Manage guest requests and service inquiries</p>
        </div>

        {/* Actions and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Service Request</DialogTitle>
                <DialogDescription>
                  Log a new guest service request or complaint
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guest_name">Guest Name *</Label>
                    <Input
                      id="guest_name"
                      value={newRequest.guest_name}
                      onChange={(e) => setNewRequest({...newRequest, guest_name: e.target.value})}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="room_number">Room Number *</Label>
                    <Input
                      id="room_number"
                      value={newRequest.room_number}
                      onChange={(e) => setNewRequest({...newRequest, room_number: e.target.value})}
                      placeholder="101"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="guest_email">Email</Label>
                    <Input
                      id="guest_email"
                      type="email"
                      value={newRequest.guest_email}
                      onChange={(e) => setNewRequest({...newRequest, guest_email: e.target.value})}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="guest_phone">Phone</Label>
                    <Input
                      id="guest_phone"
                      value={newRequest.guest_phone}
                      onChange={(e) => setNewRequest({...newRequest, guest_phone: e.target.value})}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="request_type">Request Type *</Label>
                    <Select value={newRequest.request_type} onValueChange={(value) => setNewRequest({...newRequest, request_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {requestTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={newRequest.priority} onValueChange={(value) => setNewRequest({...newRequest, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorities.map(priority => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                    placeholder="Describe the request or issue in detail..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRequest}>
                  Create Request
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'No service requests found.' : `No ${filter.replace('_', ' ')} requests found.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => {
              const statusInfo = getStatusInfo(request.status);
              const priorityInfo = getPriorityInfo(request.priority);
              const StatusIcon = statusInfo.icon;
              
              return (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {request.request_type}{request.room_number ? ` - Room ${request.room_number}` : ''}
                          </h3>
                          <Badge className={priorityInfo.color}>
                            {priorityInfo.label}
                          </Badge>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{request.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {request.guest_name && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{request.guest_name}</span>
                            </div>
                          )}
                          {request.guest_email && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>{request.guest_email}</span>
                            </div>
                          )}
                          {request.guest_phone && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              <span>{request.guest_phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select
                          value={request.status}
                          onValueChange={(value) => updateRequestStatus(request.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="assigned">Assigned</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created: {new Date(request.created_at).toLocaleString()}</span>
                      {request.completed_at && (
                        <span>Completed: {new Date(request.completed_at).toLocaleString()}</span>
                      )}
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