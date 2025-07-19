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

interface ServiceRequest {
  id: string;
  guest_name: string;
  guest_email: string;
  guest_phone?: string;
  room_number: string;
  request_type: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  assigned_staff?: string;
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
  { value: 'in_progress', label: 'In Progress', icon: AlertCircle, color: 'text-blue-600' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600' }
];

export default function GuestServices() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const { toast } = useToast();

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
      // This would typically come from a guest_service_requests table
      // For now, we'll simulate with some mock data since the table doesn't exist
      setRequests([]);
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
      const request: ServiceRequest = {
        id: Math.random().toString(36).substring(7),
        ...newRequest,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      setRequests([request, ...requests]);
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
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to create service request",
        variant: "destructive"
      });
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      setRequests(requests.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: newStatus,
              resolved_at: newStatus === 'completed' ? new Date().toISOString() : undefined
            } 
          : request
      ));

      toast({
        title: "Success",
        description: "Request status updated successfully"
      });
    } catch (error) {
      console.error('Error updating request status:', error);
      toast({
        title: "Error",
        description: "Failed to update request status",
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
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
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
                            {request.request_type} - Room {request.room_number}
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
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>{request.guest_name}</span>
                          </div>
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
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Created: {new Date(request.created_at).toLocaleString()}</span>
                      {request.resolved_at && (
                        <span>Resolved: {new Date(request.resolved_at).toLocaleString()}</span>
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