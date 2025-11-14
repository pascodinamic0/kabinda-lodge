import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle, FileText, Plus, Clock, CheckCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Incident {
  id: string;
  incident_type: string;
  severity: string;
  location: string;
  description: string;
  status: string;
  reported_by: string;
  assigned_to?: string;
  created_at: string;
  resolved_at?: string;
}

const incidentTypes = [
  'Security', 'Maintenance', 'Safety', 'Guest Complaint', 'Equipment Failure', 'Other'
];

const severityLevels = [
  { value: 'low', label: 'Low', variant: 'outline' as const },
  { value: 'medium', label: 'Medium', variant: 'secondary' as const },
  { value: 'high', label: 'High', variant: 'destructive' as const }
];

const statusOptions = [
  { value: 'open', label: 'Open', variant: 'destructive' as const },
  { value: 'in_progress', label: 'In Progress', variant: 'secondary' as const },
  { value: 'resolved', label: 'Resolved', variant: 'outline' as const }
];

const IncidentReporting = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showNewIncidentDialog, setShowNewIncidentDialog] = useState(false);
  
  const [newIncident, setNewIncident] = useState({
    incident_type: '',
    severity: 'medium',
    location: '',
    description: ''
  });

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast({
        title: "Error",
        description: "Failed to load incidents",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncident = async () => {
    if (!newIncident.incident_type || !newIncident.location || !newIncident.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('incidents')
        .insert({
          ...newIncident,
          reported_by: user?.id
        });

      if (error) throw error;

      setNewIncident({
        incident_type: '',
        severity: 'medium',
        location: '',
        description: ''
      });
      setShowNewIncidentDialog(false);
      fetchIncidents();
      
      toast({
        title: "Success",
        description: "Incident reported successfully",
      });
    } catch (error) {
      console.error('Error creating incident:', error);
      toast({
        title: "Error",
        description: "Failed to create incident",
        variant: "destructive",
      });
    }
  };

  const updateIncidentStatus = async (incidentId: string, newStatus: string) => {
    try {
      const updateData: { status: string; resolved_at?: string } = { status: newStatus };
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('incidents')
        .update(updateData)
        .eq('id', incidentId);

      if (error) throw error;

      fetchIncidents();
      toast({
        title: "Success",
        description: "Incident status updated",
      });
    } catch (error) {
      console.error('Error updating incident:', error);
      toast({
        title: "Error",
        description: "Failed to update incident status",
        variant: "destructive",
      });
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    if (filter === 'all') return true;
    return incident.status === filter;
  });

  const getSeverityInfo = (severity: string) => {
    return severityLevels.find(s => s.value === severity) || severityLevels[1];
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading incidents...</div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate stats
  const openIncidents = incidents.filter(i => i.status === 'open').length;
  const inProgressIncidents = incidents.filter(i => i.status === 'in_progress').length;
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;
  const highSeverityIncidents = incidents.filter(i => i.severity === 'high').length;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Incident Reporting</h1>
          <p className="text-muted-foreground mt-2">Report and manage incidents and security issues</p>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Incidents</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openIncidents}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressIncidents}</div>
              <p className="text-xs text-muted-foreground">Being handled</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedIncidents}</div>
              <p className="text-xs text-muted-foreground">Completed today</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High Priority</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{highSeverityIncidents}</div>
              <p className="text-xs text-muted-foreground">Critical issues</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Incidents</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showNewIncidentDialog} onOpenChange={setShowNewIncidentDialog}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Report Incident
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Report New Incident</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Type *</label>
                  <Select 
                    value={newIncident.incident_type} 
                    onValueChange={(value) => setNewIncident({...newIncident, incident_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select incident type" />
                    </SelectTrigger>
                    <SelectContent>
                      {incidentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Severity</label>
                  <Select 
                    value={newIncident.severity} 
                    onValueChange={(value) => setNewIncident({...newIncident, severity: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {severityLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Location *</label>
                  <Input
                    value={newIncident.location}
                    onChange={(e) => setNewIncident({...newIncident, location: e.target.value})}
                    placeholder="e.g., Room 205, Lobby, Restaurant"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description *</label>
                  <Textarea
                    value={newIncident.description}
                    onChange={(e) => setNewIncident({...newIncident, description: e.target.value})}
                    placeholder="Detailed description of the incident"
                    rows={3}
                  />
                </div>

                <Button onClick={handleCreateIncident} className="w-full">
                  Report Incident
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Incidents List */}
        <div className="space-y-4">
          {filteredIncidents.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No incidents found</h3>
                <p className="text-muted-foreground mb-4">
                  {filter === 'all' 
                    ? "No incidents have been reported yet." 
                    : `No incidents with status "${filter}" found.`}
                </p>
                <Dialog open={showNewIncidentDialog} onOpenChange={setShowNewIncidentDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Report First Incident
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            filteredIncidents.map((incident) => (
              <Card key={incident.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {incident.incident_type}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {incident.location} • {new Date(incident.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getSeverityInfo(incident.severity).variant}>
                        {getSeverityInfo(incident.severity).label}
                      </Badge>
                      <Badge variant={getStatusInfo(incident.status).variant}>
                        {getStatusInfo(incident.status).label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{incident.description}</p>
                  
                  {incident.status !== 'resolved' && (
                    <div className="flex gap-2">
                      {incident.status === 'open' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateIncidentStatus(incident.id, 'in_progress')}
                        >
                          <Clock className="h-4 w-4 mr-1" />
                          Start Progress
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateIncidentStatus(incident.id, 'resolved')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Resolved
                      </Button>
                    </div>
                  )}
                  
                  {incident.resolved_at && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Resolved on {new Date(incident.resolved_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default IncidentReporting;