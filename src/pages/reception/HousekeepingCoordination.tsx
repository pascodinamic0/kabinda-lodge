
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Plus, Clock, CheckCircle, Play } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface HousekeepingTask {
  id: string;
  room_id?: number;
  task_type: string;
  priority: string;
  description?: string;
  assigned_to?: string;
  status: string;
  estimated_duration?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

interface Room {
  id: number;
  name: string;
}

const taskTypes = [
  'Room Cleaning', 'Deep Cleaning', 'Maintenance', 'Laundry', 'Inspection', 'Setup', 'Other'
];

const priorityLevels = [
  { value: 'low', label: 'Low', variant: 'outline' as const },
  { value: 'medium', label: 'Medium', variant: 'secondary' as const },
  { value: 'high', label: 'High', variant: 'destructive' as const }
];

const statusOptions = [
  { value: 'pending', label: 'Pending', variant: 'secondary' as const },
  { value: 'in_progress', label: 'In Progress', variant: 'default' as const },
  { value: 'completed', label: 'Completed', variant: 'outline' as const }
];

const HousekeepingCoordination = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  
  const [newTask, setNewTask] = useState({
    room_id: 'general',
    task_type: '',
    priority: 'medium',
    description: '',
    estimated_duration: 60
  });

  useEffect(() => {
    fetchTasks();
    fetchRooms();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('housekeeping_tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: "Error",
        description: "Failed to load housekeeping tasks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('rooms')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleCreateTask = async () => {
    if (!newTask.task_type) {
      toast({
        title: "Error",
        description: "Please select a task type",
        variant: "destructive",
      });
      return;
    }

    try {
      const taskData: any = {
        task_type: newTask.task_type,
        priority: newTask.priority,
        estimated_duration: newTask.estimated_duration
      };

      if (newTask.room_id !== 'general') {
        taskData.room_id = parseInt(newTask.room_id);
      }

      if (newTask.description) {
        taskData.description = newTask.description;
      }

      const { error } = await supabase
        .from('housekeeping_tasks')
        .insert(taskData);

      if (error) throw error;

      setNewTask({
        room_id: 'general',
        task_type: '',
        priority: 'medium',
        description: '',
        estimated_duration: 60
      });
      setShowNewTaskDialog(false);
      fetchTasks();
      
      toast({
        title: "Success",
        description: "Housekeeping task created successfully",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'in_progress') {
        updateData.started_at = new Date().toISOString();
        updateData.assigned_to = user?.id;
      } else if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
        if (!updateData.assigned_to) {
          updateData.assigned_to = user?.id;
        }
      }

      const { error } = await supabase
        .from('housekeeping_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;

      fetchTasks();
      toast({
        title: "Success",
        description: "Task status updated",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getPriorityInfo = (priority: string) => {
    return priorityLevels.find(p => p.value === priority) || priorityLevels[1];
  };

  const getStatusInfo = (status: string) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const getRoomName = (roomId?: number) => {
    if (!roomId) return 'General Task';
    const room = rooms.find(r => r.id === roomId);
    return room ? room.name : `Room ${roomId}`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading tasks...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Housekeeping Coordination</h1>
          <p className="text-muted-foreground">Manage and coordinate housekeeping tasks</p>
        </div>

        <div className="flex justify-between items-center">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Housekeeping Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Room (Optional)</label>
                  <Select 
                    value={newTask.room_id} 
                    onValueChange={(value) => setNewTask({...newTask, room_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Task</SelectItem>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id.toString()}>{room.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Task Type *</label>
                  <Select 
                    value={newTask.task_type} 
                    onValueChange={(value) => setNewTask({...newTask, task_type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select task type" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select 
                    value={newTask.priority} 
                    onValueChange={(value) => setNewTask({...newTask, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Estimated Duration (minutes)</label>
                  <Input
                    type="number"
                    value={newTask.estimated_duration}
                    onChange={(e) => setNewTask({...newTask, estimated_duration: parseInt(e.target.value) || 60})}
                    min="15"
                    max="480"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Additional task details"
                    rows={3}
                  />
                </div>

                <Button onClick={handleCreateTask} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tasks found</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        {task.task_type}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {getRoomName(task.room_id)} • {new Date(task.created_at).toLocaleDateString()}
                        {task.estimated_duration && ` • ${task.estimated_duration} min`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityInfo(task.priority).variant}>
                        {getPriorityInfo(task.priority).label}
                      </Badge>
                      <Badge variant={getStatusInfo(task.status).variant}>
                        {getStatusInfo(task.status).label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {task.description && (
                    <p className="mb-4">{task.description}</p>
                  )}
                  
                  {task.status !== 'completed' && (
                    <div className="flex gap-2">
                      {task.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateTaskStatus(task.id, 'in_progress')}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start Task
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateTaskStatus(task.id, 'completed')}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Complete
                      </Button>
                    </div>
                  )}
                  
                  {task.started_at && task.status === 'in_progress' && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Started: {new Date(task.started_at).toLocaleString()}
                    </p>
                  )}
                  
                  {task.completed_at && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Completed: {new Date(task.completed_at).toLocaleString()}
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

export default HousekeepingCoordination;
