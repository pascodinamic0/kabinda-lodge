/**
 * Card Issue Management Page
 * Monitor and manage card programming issues
 */
import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Search, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getCardIssues, updateCardIssueStatus } from '@/services/hotelLockService';
import { getDefaultHotelId } from '@/utils/hotelUtils';
import type { CardIssue } from '@/types/hotelLock';
import { formatDistanceToNow } from 'date-fns';

const CardIssueManagement: React.FC = () => {
  const { toast } = useToast();
  const [cardIssues, setCardIssues] = useState<CardIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [hotelId, setHotelId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadHotelId = async () => {
      try {
        const id = await getDefaultHotelId();
        setHotelId(id);
      } catch (error: any) {
        console.error('Error loading hotel ID:', error);
        toast({
          title: 'Error',
          description: 'Failed to load hotel information',
          variant: 'destructive',
        });
      }
    };
    loadHotelId();
  }, [toast]);

  useEffect(() => {
    if (hotelId) {
      loadCardIssues();
    }
  }, [hotelId, statusFilter]);

  const loadCardIssues = async () => {
    if (!hotelId) return;

    setLoading(true);
    try {
      const issues = await getCardIssues(hotelId, {
        status: statusFilter !== 'all' ? statusFilter as CardIssue['status'] : undefined,
      });
      setCardIssues(issues);
    } catch (error: any) {
      console.error('Error loading card issues:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load card issues',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (cardIssue: CardIssue) => {
    try {
      await updateCardIssueStatus(cardIssue.id, {
        status: 'pending',
        error_message: undefined,
      });
      toast({
        title: 'Success',
        description: 'Card issue queued for retry',
      });
      loadCardIssues();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to retry card issue',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: CardIssue['status']) => {
    switch (status) {
      case 'done':
        return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Done</Badge>;
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-600"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'queued':
        return <Badge className="bg-yellow-600"><Clock className="h-3 w-3 mr-1" />Queued</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredIssues = cardIssues.filter(issue => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        issue.booking_id?.toLowerCase().includes(query) ||
        issue.room_id?.toLowerCase().includes(query) ||
        issue.card_type?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Card Issue Management</h1>
          <p className="text-muted-foreground">
            Monitor and manage card programming requests
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by booking ID, room, or card type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="queued">Queued</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadCardIssues} variant="outline" disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card Issues List */}
        <div className="grid gap-4">
          {filteredIssues.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No card issues found</p>
              </CardContent>
            </Card>
          ) : (
            filteredIssues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {issue.card_type || 'Unknown Card Type'}
                      </CardTitle>
                      <CardDescription>
                        Booking: {issue.booking_id || 'N/A'} | Room: {issue.room_id || 'N/A'}
                      </CardDescription>
                    </div>
                    {getStatusBadge(issue.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {(() => {
                          try {
                            return formatDistanceToNow(new Date(issue.created_at), { addSuffix: true });
                          } catch (e) {
                            return new Date(issue.created_at).toLocaleDateString();
                          }
                        })()}
                      </p>
                    </div>
                    {issue.completed_at && (
                      <div>
                        <p className="text-muted-foreground">Completed</p>
                        <p className="font-medium">
                          {(() => {
                            try {
                              return formatDistanceToNow(new Date(issue.completed_at), { addSuffix: true });
                            } catch (e) {
                              return new Date(issue.completed_at).toLocaleDateString();
                            }
                          })()}
                        </p>
                      </div>
                    )}
                    {issue.retry_count > 0 && (
                      <div>
                        <p className="text-muted-foreground">Retry Count</p>
                        <p className="font-medium">{issue.retry_count}</p>
                      </div>
                    )}
                  </div>

                  {issue.error_message && (
                    <Alert variant="destructive" className="mb-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{issue.error_message}</AlertDescription>
                    </Alert>
                  )}

                  {issue.result && issue.result.cardUID && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Card UID</p>
                      <code className="text-xs bg-muted p-2 rounded block">
                        {issue.result.cardUID}
                      </code>
                    </div>
                  )}

                  {issue.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetry(issue)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
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

export default CardIssueManagement;

