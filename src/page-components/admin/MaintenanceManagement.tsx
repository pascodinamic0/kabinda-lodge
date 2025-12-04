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
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  User,
  Loader2,
  Trash2,
  Edit
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MaintenanceRequest {
  id: string;
  room_number: string;
  issue_type: string;
  description: string;
  priority: string;
  status: string;
  reported_by: string;
  assigned_to?: string;
  created_at: string;
  scheduled_date?: string;
  completed_at?: string;
}

const issueTypes = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Furniture',
  'Appliances',
  'Bathroom',
  'Kitchen',
  'Cleaning',
  'Paint/Walls',
  'Windows/Doors',
  'Safety/Security',
  'Other'
];

const priorities = [
  { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
];

const statuses = [
  { value: 'reported', label: 'Reported', icon: AlertTriangle, color: 'text-yellow-600' },
  { value: 'scheduled', label: 'Scheduled', icon: Calendar, color: 'text-blue-600' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-orange-600' },
  { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'text-green-600' }
];

export default function AdminMaintenanceManagement() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const { toast } = useToast();

  // Fetch maintenance requests from database
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching maintenance requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch maintenance requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // New request form state
  const [newRequest, setNewRequest] = useState({
    room_number: '',
    issue_type: '',
    description: '',
    priority: 'medium',
    reported_by: '',
    assigned_to: ''
  });

  const handleCreateRequest = async () => {
    if (!newRequest.room_number || !newRequest.issue_type || !newRequest.description || !newRequest.reported_by) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('maintenance_requests')
        .insert([{
          room_number: newRequest.room_number,
          issue_type: newRequest.issue_type,
          description: newRequest.description,
          priority: newRequest.priority,
          reported_by: newRequest.reported_by,
          assigned_to: newRequest.assigned_to || null,
          status: 'reported'
        }])
        .select()
        .single();

      if (error) throw error;

      // Refresh the requests list
      await fetchRequests();
      
      setNewRequest({
        room_number: '',
        issue_type: '',
        description: '',
        priority: 'medium',
        reported_by: '',
        assigned_to: ''
      });
      setShowNewRequestDialog(false);

      toast({
        title: "Success",
        description: "Maintenance request created successfully"
      });

      // Trigger notification for other admins about new maintenance request
      try {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            type: 'maintenance_request',
            to: 'admin@kabinda-lodge.com',
            data: {
              room_number: newRequest.room_number,
              issue_type: newRequest.issue_type,
              priority: newRequest.priority,
              description: newRequest.description,
              reported_by: newRequest.reported_by,
              assigned_to: newRequest.assigned_to
            }
          }
        });
      } catch (notificationError) {
        console.warn('Failed to send admin notification:', notificationError);
        // Don't show error to user as the request was still created successfully
      }
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to create maintenance request",
        variant: "destructive"
      });
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('maintenance_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      // Refresh the requests list
      await fetchRequests();

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

  const updateRequestAssignment = async (requestId: string, assignedTo: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ assigned_to: assignedTo || null })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh the requests list
      await fetchRequests();

      toast({
        title: "Success",
        description: "Staff assignment updated successfully"
      });
    } catch (error) {
      console.error('Error updating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to update staff assignment",
        variant: "destructive"
      });
    }
  };

  const updateRequestPriority = async (requestId: string, newPriority: string) => {
    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .update({ priority: newPriority })
        .eq('id', requestId);

      if (error) throw error;

      // Refresh the requests list
      await fetchRequests();

      toast({
        title: "Success",
        description: "Priority updated successfully"
      });
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Error",
        description: "Failed to update priority",
        variant: "destructive"
      });
    }
  };

  const deleteRequest = async (requestId: string) => {
    if (!window.confirm('Are you sure you want to delete this maintenance request?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('maintenance_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      // Refresh the requests list
      await fetchRequests();

      toast({
        title: "Success",
        description: "Maintenance request deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete maintenance request",
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

  const getStatusCounts = () => {
    return statuses.reduce((acc, status) => {
      acc[status.value] = requests.filter(request => request.status === status.value).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Maintenance Management</h1>
          <p className="text-muted-foreground">Monitor and manage all room maintenance requests across the property</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* Actions and Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="reported">Reported</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Log Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Log Maintenance Issue</DialogTitle>
                <DialogDescription>
                  Report a new maintenance issue for a room
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="room_number">Room Number *</Label>
                    <Input
                      id="room_number"
                      value={newRequest.room_number}
                      onChange={(e) => setNewRequest({...newRequest, room_number: e.target.value})}
                      placeholder="101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="issue_type">Issue Type *</Label>
                    <Select value={newRequest.issue_type} onValueChange={(value) => setNewRequest({...newRequest, issue_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {issueTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                  <div>
                    <Label htmlFor="reported_by">Reported By *</Label>
                    <Input
                      id="reported_by"
                      value={newRequest.reported_by}
                      onChange={(e) => setNewRequest({...newRequest, reported_by: e.target.value})}
                      placeholder="Guest/Staff name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="assigned_to">Assign To (Optional)</Label>
                  <Input
                    id="assigned_to"
                    value={newRequest.assigned_to}
                    onChange={(e) => setNewRequest({...newRequest, assigned_to: e.target.value})}
                    placeholder="Staff member name"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                    placeholder="Describe the maintenance issue in detail..."
                    rows={3}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewRequestDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateRequest}>
                  Log Issue
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="text-center py-12">
                <Loader2 className="h-8 w-8 text-muted-foreground mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading maintenance requests...</p>
              </CardContent>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {filter === 'all' ? 'No maintenance requests found.' : `No ${filter.replace('_', ' ')} requests found.`}
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
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">
                            Room {request.room_number} - {request.issue_type}
                          </h3>
                          <Select value={request.priority} onValueChange={(value) => updateRequestPriority(request.id, value)}>
                            <SelectTrigger className="w-32">
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
                          <Badge variant="outline" className="flex items-center gap-1">
                            <StatusIcon className={`h-3 w-3 ${statusInfo.color}`} />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{request.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Reported: {request.reported_by}</span>
                          </div>
                          <div>
                            <Label className="text-xs font-medium mb-1 block">Assign To</Label>
                            <Input
                              type="text"
                              value={request.assigned_to || ''}
                              onChange={(e) => updateRequestAssignment(request.id, e.target.value)}
                              placeholder="Staff member"
                              className="h-8 text-xs"
                            />
                          </div>
                          {request.scheduled_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Scheduled: {new Date(request.scheduled_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Select
                          value={request.status}
                          onValueChange={(value) => updateRequestStatus(request.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reported">Reported</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRequest(request.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

