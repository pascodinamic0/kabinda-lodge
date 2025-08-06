import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Clock, Zap, CheckCircle, XCircle, User, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

interface ServiceRequest {
  id: string;
  request_type: string;
  priority: string;
  description: string;
  room_number?: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  notes?: string;
}

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  assigned: { label: "Assigned", color: "bg-blue-100 text-blue-800", icon: User },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

const priorityConfig = {
  low: { label: "Low", color: "bg-green-100 text-green-800", icon: Clock },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-800", icon: AlertCircle },
  high: { label: "High", color: "bg-red-100 text-red-800", icon: Zap },
};

export function ServiceRequestsList() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('guest_service_requests')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: unknown) {
      console.error('Error fetching service requests:', error);
      toast({
        title: "Error",
        description: "Failed to load your service requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No Service Requests</p>
          <p className="text-muted-foreground text-center">
            You haven't submitted any service requests yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const status = statusConfig[request.status as keyof typeof statusConfig];
        const priority = priorityConfig[request.priority as keyof typeof priorityConfig];
        const StatusIcon = status.icon;
        const PriorityIcon = priority.icon;

        return (
          <Card key={request.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">
                  {request.request_type}
                </CardTitle>
                <div className="flex gap-2">
                  <Badge className={priority.color}>
                    <PriorityIcon className="h-3 w-3 mr-1" />
                    {priority.label}
                  </Badge>
                  <Badge className={status.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {status.label}
                  </Badge>
                </div>
              </div>
              {request.room_number && (
                <p className="text-sm text-muted-foreground">
                  Room: {request.room_number}
                </p>
              )}
            </CardHeader>
            
            <CardContent className="space-y-3">
              <p className="text-sm leading-relaxed">
                {request.description}
              </p>
              
              {request.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-1">Staff Notes:</p>
                    <p className="text-sm text-muted-foreground">
                      {request.notes}
                    </p>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Created {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </div>
                {request.completed_at && (
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Completed {formatDistanceToNow(new Date(request.completed_at), { addSuffix: true })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}