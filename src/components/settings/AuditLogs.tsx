import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, Filter, Search, AlertCircle } from 'lucide-react';

interface AuditLog {
  id: string;
  event_type: string;
  user_id: string | null;
  ip_address: unknown;
  user_agent: string | null;
  event_details: any;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    loadAuditLogs();
  }, [eventTypeFilter, dateRange]);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (eventTypeFilter !== 'all') {
        query = query.eq('event_type', eventTypeFilter);
      }

      if (dateRange !== 'all') {
        const days = parseInt(dateRange);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        query = query.gte('created_at', cutoffDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const ipAddress = String(log.ip_address || '');
    return (
      searchTerm === '' ||
      log.event_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ipAddress.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getEventTypeBadge = (eventType: string) => {
    const variants = {
      'login': 'default',
      'logout': 'secondary',
      'login_failed': 'destructive',
      'data_access': 'outline',
      'data_modification': 'default',
      'permission_change': 'destructive',
      'system_access': 'secondary',
    } as const;

    return (
      <Badge variant={variants[eventType as keyof typeof variants] || 'outline'}>
        {eventType.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const exportLogs = () => {
    const csvContent = [
      ['Date', 'Event Type', 'User ID', 'IP Address', 'Details'].join(','),
      ...filteredLogs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.event_type,
        log.user_id || 'System',
        log.ip_address || 'N/A',
        JSON.stringify(log.event_details || {})
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Security Audit Logs
          </CardTitle>
          <CardDescription>
            Monitor system access and security events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="login_failed">Failed Login</SelectItem>
                <SelectItem value="data_access">Data Access</SelectItem>
                <SelectItem value="data_modification">Data Changes</SelectItem>
                <SelectItem value="permission_change">Permission Changes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Last 24 hours</SelectItem>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Loading audit logs...
                    </TableCell>
                  </TableRow>
                ) : filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        No audit logs found
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {getEventTypeBadge(log.event_type)}
                      </TableCell>
                      <TableCell>
                        {log.user_id ? log.user_id.slice(0, 8) + '...' : 'System'}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 rounded">
                          {String(log.ip_address || 'N/A')}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-muted-foreground">
                          {log.event_details ? 
                            JSON.stringify(log.event_details) : 
                            'No additional details'
                          }
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} audit logs
          </div>
        </CardContent>
      </Card>
    </div>
  );
}