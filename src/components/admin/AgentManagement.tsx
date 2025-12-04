/**
 * Agent Management Component
 * UI for pairing and managing local agents
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Copy,
  AlertCircle,
  Server,
  Activity
} from 'lucide-react';
import { createPairingToken, getAgents } from '@/services/hotelLockService';
import { supabase } from '@/integrations/supabase/client';
import type { Agent } from '@/types/hotelLock';
import { formatDistanceToNow } from 'date-fns';

interface AgentManagementProps {
  hotelId: string;
}

export const AgentManagement: React.FC<AgentManagementProps> = ({ hotelId }) => {
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [pairingDialogOpen, setPairingDialogOpen] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [pairingToken, setPairingToken] = useState<string | null>(null);
  const [pairingTokenExpires, setPairingTokenExpires] = useState<string | null>(null);

  useEffect(() => {
    loadAgents();
    // Poll for agent updates every 30 seconds
    const interval = setInterval(loadAgents, 30000);
    return () => clearInterval(interval);
  }, [hotelId]);

  const loadAgents = async () => {
    try {
      const data = await getAgents(hotelId);
      setAgents(data);
    } catch (error: any) {
      console.error('Error loading agents:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load agents',
        variant: 'destructive',
      });
    }
  };

  const handleCreatePairingToken = async () => {
    if (!agentName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an agent name',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await createPairingToken({
        agentName: agentName.trim(),
        hotelId,
      });

      setPairingToken(response.pairingToken);
      setPairingTokenExpires(response.expiresAt);
      
      toast({
        title: 'Pairing Token Generated',
        description: 'Token copied to clipboard. Use it in the agent installer.',
      });

      // Copy to clipboard
      await navigator.clipboard.writeText(response.pairingToken);
    } catch (error: any) {
      console.error('Error creating pairing token:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create pairing token',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToken = async () => {
    if (pairingToken) {
      await navigator.clipboard.writeText(pairingToken);
      toast({
        title: 'Copied',
        description: 'Pairing token copied to clipboard',
      });
    }
  };

  const getStatusBadge = (status: Agent['status']) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Online</Badge>;
      case 'offline':
        return <Badge variant="outline"><XCircle className="h-3 w-3 mr-1" />Offline</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Agent Management</h2>
          <p className="text-muted-foreground">
            Pair and manage local card programming agents
          </p>
        </div>
        <Dialog open={pairingDialogOpen} onOpenChange={setPairingDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Pair New Agent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pair New Agent</DialogTitle>
              <DialogDescription>
                Generate a pairing token to register a new agent on a hotel computer
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="agentName">Agent Name</Label>
                <Input
                  id="agentName"
                  placeholder="e.g., Reception Desk PC"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  A descriptive name for this agent/computer
                </p>
              </div>

              {pairingToken ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">Pairing Token Generated</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-muted rounded text-sm font-mono break-all">
                          {pairingToken}
                        </code>
                        <Button size="sm" variant="outline" onClick={copyToken}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      {pairingTokenExpires && (
                        <p className="text-xs text-muted-foreground">
                          Expires: {new Date(pairingTokenExpires).toLocaleString()}
                        </p>
                      )}
                      <p className="text-sm">
                        Use this token in the agent installer or configuration.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Button 
                  onClick={handleCreatePairingToken} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Pairing Token'
                  )}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {agents.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No agents paired yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Pair your first agent to start programming cards
              </p>
            </CardContent>
          </Card>
        ) : (
          agents.map((agent) => (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      {agent.name}
                    </CardTitle>
                    <CardDescription>
                      Fingerprint: <code className="text-xs">{agent.fingerprint.substring(0, 16)}...</code>
                    </CardDescription>
                  </div>
                  {getStatusBadge(agent.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Last Seen</p>
                    <p className="font-medium">
                      {agent.last_seen 
                        ? formatDistanceToNow(new Date(agent.last_seen), { addSuffix: true })
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Paired</p>
                    <p className="font-medium">
                      {agent.paired_at 
                        ? new Date(agent.paired_at).toLocaleDateString()
                        : 'Unknown'}
                    </p>
                  </div>
                  {agent.meta && (agent.meta as any).queueLength !== undefined && (
                    <div>
                      <p className="text-muted-foreground">Queue Length</p>
                      <p className="font-medium flex items-center gap-1">
                        <Activity className="h-4 w-4" />
                        {(agent.meta as any).queueLength || 0}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};




