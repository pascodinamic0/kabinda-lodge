import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer } from 'lucide-react';

export default function PrintSettings() {
  const [defaultPrinter, setDefaultPrinter] = useState('receipt-printer');
  const [paperSize, setPaperSize] = useState('80mm');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Printer Configuration
          </CardTitle>
          <CardDescription>
            Configure receipt and document printing settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Printer</Label>
            <Select value={defaultPrinter} onValueChange={setDefaultPrinter}>
              <SelectTrigger>
                <SelectValue placeholder="Select printer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receipt-printer">Receipt Printer</SelectItem>
                <SelectItem value="document-printer">Document Printer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Paper Size</Label>
            <Select value={paperSize} onValueChange={setPaperSize}>
              <SelectTrigger>
                <SelectValue placeholder="Select paper size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="80mm">80mm (Receipt)</SelectItem>
                <SelectItem value="a4">A4 (Document)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}