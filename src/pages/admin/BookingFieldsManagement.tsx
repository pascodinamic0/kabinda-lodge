import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, GripVertical, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { supabase } from '@/lib/supabase';
import { BookingFieldConfig } from '@/types/bookingFields';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BookingFieldsManagement = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [fields, setFields] = useState<BookingFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingField, setEditingField] = useState<BookingFieldConfig | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    field_type: 'text' as const,
    is_required: false,
    is_active: true,
    applies_to: ['room', 'conference_room'] as ('room' | 'conference_room')[],
    display_order: 0,
    options: [] as string[],
    placeholder: '',
    validation_rules: {}
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Helper functions
  const getFieldTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      text: 'Text',
      email: 'Email',
      phone: 'Phone',
      number: 'Number',
      select: 'Dropdown',
      textarea: 'Text Area',
      date: 'Date',
      checkbox: 'Checkbox'
    };
    return labels[type] || type;
  };

  const getAppliesToLabel = (appliesTo: string[]) => {
    if (appliesTo.includes('room') && appliesTo.includes('conference_room')) {
      return 'Both';
    } else if (appliesTo.includes('room')) {
      return 'Rooms Only';
    } else if (appliesTo.includes('conference_room')) {
      return 'Conference Rooms Only';
    }
    return 'None';
  };

  const fetchFields = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any).from('booking_fields_config').select('*').order('display_order');
      
      if (error) throw error;
      setFields(data || []);
    } catch (error) {
      console.error('Error fetching fields:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch booking fields',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingField) {
        // Update existing field
        const { error } = await (supabase as any).from('booking_fields_config')
          .update(formData)
          .eq('id', editingField.id);
        
        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Field updated successfully'
        });
      } else {
        // Create new field
        const { error } = await (supabase as any).from('booking_fields_config')
          .insert([formData]);
        
        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Field created successfully'
        });
      }
      
      setIsModalOpen(false);
      setEditingField(null);
      resetForm();
      fetchFields();
    } catch (error) {
      console.error('Error saving field:', error);
      toast({
        title: 'Error',
        description: 'Failed to save field',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (field: BookingFieldConfig) => {
    setEditingField(field);
    setFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_type: field.field_type,
      is_required: field.is_required,
      is_active: field.is_active,
      applies_to: field.applies_to,
      display_order: field.display_order,
      options: field.options || [],
      placeholder: field.placeholder || '',
      validation_rules: field.validation_rules || {}
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (fieldId: number) => {
    try {
      const { error } = await (supabase as any).from('booking_fields_config')
        .delete()
        .eq('id', fieldId);
      
      if (error) throw error;
      toast({
        title: 'Success',
        description: 'Field deleted successfully'
      });
      fetchFields();
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete field',
        variant: 'destructive'
      });
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex(field => field.id.toString() === active.id);
      const newIndex = fields.findIndex(field => field.id.toString() === over.id);
      
      const newFields = arrayMove(fields, oldIndex, newIndex);
      setFields(newFields);
      
      // Update display_order in database
      try {
        const updates = newFields.map((field, index) => ({
          id: field.id,
          display_order: index
        }));
        
        const { error } = await (supabase as any).from('booking_fields_config')
          .upsert(updates, { onConflict: 'id' });
        
        if (error) throw error;
      } catch (error) {
        console.error('Error updating field order:', error);
        toast({
          title: 'Error',
          description: 'Failed to update field order',
          variant: 'destructive'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      field_name: '',
      field_label: '',
      field_type: 'text',
      is_required: false,
      is_active: true,
      applies_to: ['room', 'conference_room'],
      display_order: 0,
      options: [],
      placeholder: '',
      validation_rules: {}
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, '']
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  useEffect(() => {
    fetchFields();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading booking fields...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Booking Fields Management</h1>
            <p className="text-muted-foreground">
              Manage dynamic booking fields for rooms and conference rooms
            </p>
          </div>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingField(null);
                resetForm();
                setIsModalOpen(true);
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingField ? 'Edit Field' : 'Add New Field'}
                </DialogTitle>
                <DialogDescription>
                  Configure a new booking field that will appear in booking forms
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field_name">Field Name *</Label>
                    <Input
                      id="field_name"
                      value={formData.field_name}
                      onChange={(e) => handleChange('field_name', e.target.value)}
                      placeholder="e.g., guestName"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field_label">Display Label *</Label>
                    <Input
                      id="field_label"
                      value={formData.field_label}
                      onChange={(e) => handleChange('field_label', e.target.value)}
                      placeholder="e.g., Guest Name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field_type">Field Type *</Label>
                    <Select
                      value={formData.field_type}
                      onValueChange={(value: any) => handleChange('field_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="phone">Phone</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="select">Dropdown</SelectItem>
                        <SelectItem value="textarea">Text Area</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="checkbox">Checkbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="placeholder">Placeholder Text</Label>
                    <Input
                      id="placeholder"
                      value={formData.placeholder}
                      onChange={(e) => handleChange('placeholder', e.target.value)}
                      placeholder="e.g., Enter guest name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Applies To *</Label>
                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="room"
                        checked={formData.applies_to.includes('room')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleChange('applies_to', [...formData.applies_to, 'room']);
                          } else {
                            handleChange('applies_to', formData.applies_to.filter(t => t !== 'room'));
                          }
                        }}
                      />
                      <Label htmlFor="room">Hotel Rooms</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="conference_room"
                        checked={formData.applies_to.includes('conference_room')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleChange('applies_to', [...formData.applies_to, 'conference_room']);
                          } else {
                            handleChange('applies_to', formData.applies_to.filter(t => t !== 'conference_room'));
                          }
                        }}
                      />
                      <Label htmlFor="conference_room">Conference Rooms</Label>
                    </div>
                  </div>
                </div>

                {formData.field_type === 'select' && (
                  <div className="space-y-2">
                    <Label>Dropdown Options</Label>
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addOption}
                        className="w-full"
                      >
                        Add Option
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_required"
                    checked={formData.is_required}
                    onCheckedChange={(checked) => handleChange('is_required', checked)}
                  />
                  <Label htmlFor="is_required">Required field</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleChange('is_active', checked)}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingField ? 'Update Field' : 'Create Field'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Booking Fields
            </CardTitle>
            <CardDescription>
              Drag and drop to reorder fields. Changes are automatically saved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={fields.map(field => field.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Applies To</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="w-24">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <DraggableField
                        key={field.id}
                        id={field.id.toString()}
                        field={field}
                        index={index}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

interface DraggableFieldProps {
  id: string;
  field: BookingFieldConfig;
  index: number;
  onEdit: (field: BookingFieldConfig) => void;
  onDelete: (fieldId: number) => void;
}

const DraggableField: React.FC<DraggableFieldProps> = ({ id, field, index, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell>
        <div>
          <div className="font-medium">{field.field_label}</div>
          <div className="text-sm text-muted-foreground">{field.field_name}</div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline">
          {getFieldTypeLabel(field.field_type)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant="secondary">
          {getAppliesToLabel(field.applies_to)}
        </Badge>
      </TableCell>
      <TableCell>
        {field.is_required ? (
          <Badge variant="default">Required</Badge>
        ) : (
          <Badge variant="outline">Optional</Badge>
        )}
      </TableCell>
      <TableCell>
        {field.is_active ? (
          <Badge variant="default">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{index + 1}</span>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(field)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Field</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{field.field_label}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(field.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default BookingFieldsManagement;

