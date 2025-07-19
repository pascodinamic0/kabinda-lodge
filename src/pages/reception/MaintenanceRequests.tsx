import React, { useState } from 'react';
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
  User
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';

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

export default function MaintenanceRequests() {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([
    {
      id: '1',
      room_number: '101',
      issue_type: 'Plumbing',
      description: 'Leaky faucet in bathroom sink',
      priority: 'medium',
      status: 'reported',
      reported_by: 'John Doe (Reception)',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      room_number: '205',
      issue_type: 'HVAC',
      description: 'Air conditioning not working properly',
      priority: 'high',
      status: 'scheduled',
      reported_by: 'Guest via phone',
      assigned_to: 'Mike Johnson',
      scheduled_date: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ]);
  
  const [filter, setFilter] = useState('all');
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const { toast } = useToast();

  // New request form state
  const [newRequest, setNewRequest] = useState({
    room_number: '',
    issue_type: '',
    description: '',
    priority: 'medium',
    reported_by: ''
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
      const request: MaintenanceRequest = {
        id: Math.random().toString(36).substring(7),
        ...newRequest,
        status: 'reported',
        created_at: new Date().toISOString()
      };

      setRequests([request, ...requests]);
      setNewRequest({
        room_number: '',
        issue_type: '',
        description: '',
        priority: 'medium',
        reported_by: ''
      });
      setShowNewRequestDialog(false);

      toast({
        title: "Success",
        description: "Maintenance request created successfully"
      });
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
      setRequests(requests.map(request => 
        request.id === requestId 
          ? { 
              ...request, 
              status: newStatus,
              completed_at: newStatus === 'completed' ? new Date().toISOString() : undefined
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

  const getStatusCounts = () => {
    return statuses.reduce((acc, status) => {
      acc[status.value] = requests.filter(request => request.status === status.value).length;
      return acc;
    }, {} as Record<string, number>);
  };

  const statusCounts = getStatusCounts();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Maintenance Requests</h1>
          <p className="text-muted-foreground">Log and track room maintenance issues</p>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
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
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
          {filteredRequests.length === 0 ? (
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
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">
                            Room {request.room_number} - {request.issue_type}
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
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Reported by: {request.reported_by}</span>
                          </div>
                          {request.assigned_to && (
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <span>Assigned to: {request.assigned_to}</span>
                            </div>
                          )}
                          {request.scheduled_date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>Scheduled: {new Date(request.scheduled_date).toLocaleDateString()}</span>
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
                            <SelectItem value="reported">Reported</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
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