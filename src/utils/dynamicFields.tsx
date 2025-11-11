import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { BookingFieldConfig, DynamicFieldData } from '@/types/bookingFields';

/**
 * Render a dynamic field based on its configuration
 */
export const renderDynamicField = (
  field: BookingFieldConfig,
  value: string | number | boolean,
  onChange: (value: string | number | boolean) => void,
  error?: string
): React.ReactNode => {
  const fieldId = `dynamic-field-${field.id}`;
  const baseProps = {
    id: fieldId,
    placeholder: field.placeholder || '',
    required: field.is_required,
    value: value?.toString() || '',
  };

  switch (field.field_type) {
    case 'text':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            {...baseProps}
            type="text"
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'email':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            {...baseProps}
            type="email"
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'phone':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            {...baseProps}
            type="tel"
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'number':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            {...baseProps}
            type="number"
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Textarea
            id={fieldId}
            placeholder={field.placeholder || ''}
            required={field.is_required}
            value={value?.toString() || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={3}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'date':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Input
            {...baseProps}
            type="date"
            onChange={(e) => onChange(e.target.value)}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'select':
      return (
        <div key={field.id} className="space-y-2">
          <Label htmlFor={fieldId}>
            {field.field_label}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          <Select
            value={value?.toString() || ''}
            onValueChange={(val) => onChange(val)}
            required={field.is_required}
          >
            <SelectTrigger id={fieldId}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options && field.options.length > 0 ? (
                field.options.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>No options available</SelectItem>
              )}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      );

    case 'checkbox':
      return (
        <div key={field.id} className="flex items-center space-x-2">
          <Checkbox
            id={fieldId}
            checked={value === true || value === 'true'}
            onCheckedChange={(checked) => onChange(checked ? true : false)}
            required={field.is_required}
          />
          <Label htmlFor={fieldId} className="cursor-pointer">
            {field.field_label}
            {field.is_required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {error && <p className="text-sm text-red-500 ml-2">{error}</p>}
        </div>
      );

    default:
      return null;
  }
};

/**
 * Validate a dynamic field value
 */
export const validateDynamicField = (
  field: BookingFieldConfig,
  value: string | number | boolean
): string | null => {
  if (field.is_required) {
    if (value === null || value === undefined || value === '' || value === false) {
      return `${field.field_label} is required`;
    }
  }

  // Type-specific validation
  if (value !== null && value !== undefined && value !== '') {
    switch (field.field_type) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.toString())) {
          return 'Please enter a valid email address';
        }
        break;

      case 'phone':
        const phoneRegex = /^[\d\s\+\-\(\)]+$/;
        if (!phoneRegex.test(value.toString())) {
          return 'Please enter a valid phone number';
        }
        break;

      case 'number':
        if (isNaN(Number(value))) {
          return 'Please enter a valid number';
        }
        break;
    }
  }

  return null;
};

/**
 * Validate all dynamic fields
 */
export const validateDynamicFields = (
  fields: BookingFieldConfig[],
  values: DynamicFieldData
): Record<string, string> => {
  const errors: Record<string, string> = {};

  fields.forEach((field) => {
    const value = values[field.field_name];
    const error = validateDynamicField(field, value);
    if (error) {
      errors[field.field_name] = error;
    }
  });

  return errors;
};




