import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload, Database, Calendar, CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function BackupSettings() {
  const { toast } = useToast();
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [backupFrequency, setBackupFrequency] = useState('daily');
  const [backupProgress, setBackupProgress] = useState(0);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const backups = [
    {
      id: '1',
      date: '2024-01-17 14:30:00',
      size: '2.4 MB',
      type: 'automatic',
      status: 'completed',
    },
    {
      id: '2',
      date: '2024-01-16 14:30:00',
      size: '2.3 MB',
      type: 'automatic',
      status: 'completed',
    },
    {
      id: '3',
      date: '2024-01-15 10:15:00',
      size: '2.2 MB',
      type: 'manual',
      status: 'completed',
    },
  ];

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    setBackupProgress(0);

    try {
      // Simulate backup progress
      for (let i = 0; i <= 100; i += 10) {
        setBackupProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({
        title: "Backup completed",
        description: "Database backup has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Backup failed",
        description: "Failed to create database backup.",
        variant: "destructive",
      });
    } finally {
      setIsBackingUp(false);
      setBackupProgress(0);
    }
  };

  const handleExportData = async (format: string) => {
    try {
      // Simulate export
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Export started",
        description: `Data export in ${format.toUpperCase()} format has been initiated.`,
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export data.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (backupId: string) => {
    setIsRestoring(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast({
        title: "Restore completed",
        description: "Database has been restored successfully.",
      });
    } catch (error) {
      toast({
        title: "Restore failed",
        description: "Failed to restore from backup.",
        variant: "destructive",
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="outline" className="text-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            In Progress
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Automatic Backups
          </CardTitle>
          <CardDescription>
            Configure automatic database backup settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">
                Automatically backup your database at regular intervals
              </p>
            </div>
            <Switch
              checked={autoBackupEnabled}
              onCheckedChange={setAutoBackupEnabled}
            />
          </div>

          {autoBackupEnabled && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Backup Frequency</Label>
                <Select value={backupFrequency} onValueChange={setBackupFrequency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hourly">Every Hour</SelectItem>
                    <SelectItem value="daily">Daily at 2:00 AM</SelectItem>
                    <SelectItem value="weekly">Weekly (Sundays)</SelectItem>
                    <SelectItem value="monthly">Monthly (1st day)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Next Backup</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Scheduled for tomorrow at 2:00 AM
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Manual Backup
          </CardTitle>
          <CardDescription>
            Create an immediate backup of your database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isBackingUp && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Creating backup...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} />
            </div>
          )}

          <Button 
            onClick={handleManualBackup} 
            disabled={isBackingUp}
            className="w-full"
          >
            <Database className="h-4 w-4 mr-2" />
            {isBackingUp ? "Creating Backup..." : "Create Backup Now"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Data Export
          </CardTitle>
          <CardDescription>
            Export your data in various formats for external use.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              onClick={() => handleExportData('csv')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExportData('json')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExportData('xlsx')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Backup History</CardTitle>
          <CardDescription>
            View and manage your backup history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{backup.date}</p>
                    {getStatusBadge(backup.status)}
                    <Badge variant="secondary">{backup.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Size: {backup.size}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleRestore(backup.id)}
                    disabled={isRestoring}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}