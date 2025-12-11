import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Edit, FileText, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

interface InvoicePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: {
    id: string;
    lessonTitle?: string;
    studentNames: string[];
    date: string;
    time: string;
    duration: number;
    wage?: number;
    tutorName?: string;
    subject?: string;
  } | null;
  onGenerate: (invoiceData: InvoiceData) => void;
  viewOnly?: boolean;
  invoiceData?: InvoiceData | null;
}

interface InvoiceData {
  lessonId: string;
  invoiceNumber: string;
  date: string;
  periodStart: string;
  periodEnd: string;
  tutorName: string;
  tutorAddress: string;
  students: string[];
  items: InvoiceItem[];
  totalAmount: number;
  notes?: string;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export function InvoicePreviewModal({ open, onOpenChange, lesson, onGenerate, viewOnly = false, invoiceData: providedInvoiceData }: InvoicePreviewModalProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  useEffect(() => {
    if (providedInvoiceData) {
      setInvoiceData(providedInvoiceData);
      setIsEditing(false);
    } else if (lesson && open) {
      const lessonDate = new Date(lesson.date);
      const invoiceNumber = `TINV-${Date.now().toString().slice(-4)}`;
      
      const defaultData: InvoiceData = {
        lessonId: lesson.id,
        invoiceNumber,
        date: format(new Date(), 'yyyy-MM-dd'),
        periodStart: format(lessonDate, 'yyyy-MM-dd'),
        periodEnd: format(lessonDate, 'yyyy-MM-dd'),
        tutorName: lesson.tutorName || 'Vu Dinh',
        tutorAddress: 'Vo One\n16 Tonnyeen St Wetherill Park\nSydney NSW 2164\nAustralia',
        students: lesson.studentNames,
        items: [{
          description: `${lesson.lessonTitle || 'Lesson'} - ${lesson.studentNames.join(', ')}`,
          quantity: lesson.duration,
          rate: (lesson.wage || 45) / lesson.duration / lesson.studentNames.length,
          amount: lesson.wage || 45 * lesson.studentNames.length,
        }],
        totalAmount: lesson.wage || 45 * lesson.studentNames.length,
        notes: '',
      };
      
      setInvoiceData(defaultData);
      setIsEditing(false);
    }
  }, [lesson, open, providedInvoiceData]);

  const handleGenerate = () => {
    if (!invoiceData) return;
    
    onGenerate(invoiceData);
    toast({
      title: "Invoice Generated",
      description: "Invoice has been generated and will be visible to admin only.",
    });
    onOpenChange(false);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    if (!invoiceData) return;
    const updatedItems = [...invoiceData.items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate amount
    updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    
    // Recalculate total
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    
    setInvoiceData({ ...invoiceData, items: updatedItems, totalAmount });
  };

  const addItem = () => {
    if (!invoiceData) return;
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, {
        description: '',
        quantity: 1,
        rate: 45,
        amount: 45,
      }],
    });
  };

  const removeItem = (index: number) => {
    if (!invoiceData || invoiceData.items.length <= 1) return;
    const updatedItems = invoiceData.items.filter((_, i) => i !== index);
    const totalAmount = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    setInvoiceData({ ...invoiceData, items: updatedItems, totalAmount });
  };

  if (!lesson || !invoiceData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Preview
          </DialogTitle>
          <DialogDescription>
            Review and edit the invoice before generating. This will be visible to admin only.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Tutor Invoice</h2>
              <p className="text-sm text-muted-foreground">Invoice #{invoiceData.invoiceNumber}</p>
            </div>
            {!viewOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? 'View Mode' : 'Edit'}
              </Button>
            )}
          </div>

          <Separator />

          {/* Tutor Address */}
          <div>
            <Label>Tutor Address</Label>
            {isEditing ? (
              <Textarea
                value={invoiceData.tutorAddress}
                onChange={(e) => setInvoiceData({ ...invoiceData, tutorAddress: e.target.value })}
                rows={4}
                className="mt-2"
              />
            ) : (
              <div className="mt-2 p-3 bg-muted rounded-lg whitespace-pre-line">
                {invoiceData.tutorAddress}
              </div>
            )}
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={invoiceData.date}
                  onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
                  className="mt-2"
                />
              ) : (
                <p className="mt-2 text-sm">{format(new Date(invoiceData.date), 'dd/MM/yyyy')}</p>
              )}
            </div>
            <div>
              <Label>Invoice Number</Label>
              {isEditing ? (
                <Input
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                  className="mt-2"
                />
              ) : (
                <p className="mt-2 text-sm font-medium">{invoiceData.invoiceNumber}</p>
              )}
            </div>
            <div>
              <Label>Period Start</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={invoiceData.periodStart}
                  onChange={(e) => setInvoiceData({ ...invoiceData, periodStart: e.target.value })}
                  className="mt-2"
                />
              ) : (
                <p className="mt-2 text-sm">{format(new Date(invoiceData.periodStart), 'dd/MM/yyyy')}</p>
              )}
            </div>
            <div>
              <Label>Period End</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={invoiceData.periodEnd}
                  onChange={(e) => setInvoiceData({ ...invoiceData, periodEnd: e.target.value })}
                  className="mt-2"
                />
              ) : (
                <p className="mt-2 text-sm">{format(new Date(invoiceData.periodEnd), 'dd/MM/yyyy')}</p>
              )}
            </div>
          </div>

          <Separator />

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Invoice Items</Label>
              {isEditing && (
                <Button size="sm" variant="outline" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              )}
            </div>
            <div className="border rounded-lg overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 md:p-3 text-sm font-medium">Description</th>
                    <th className="text-right p-2 md:p-3 text-sm font-medium">Quantity</th>
                    <th className="text-right p-2 md:p-3 text-sm font-medium">Rate</th>
                    <th className="text-right p-2 md:p-3 text-sm font-medium">Amount</th>
                    {isEditing && <th className="w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-3">
                        {isEditing ? (
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            placeholder="Item description"
                          />
                        ) : (
                          <span className="text-sm">{item.description}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-20 ml-auto"
                          />
                        ) : (
                          <span className="text-sm">{item.quantity}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {isEditing ? (
                          <Input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateItem(index, 'rate', parseFloat(e.target.value) || 0)}
                            className="w-24 ml-auto"
                          />
                        ) : (
                          <span className="text-sm">${item.rate.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span className="text-sm font-medium">${item.amount.toFixed(2)}</span>
                      </td>
                      {isEditing && invoiceData.items.length > 1 && (
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeItem(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted">
                  <tr>
                    <td colSpan={isEditing ? 4 : 3} className="p-3 text-right font-bold">
                      Total Amount:
                    </td>
                    <td className="p-3 text-right font-bold text-lg">
                      ${invoiceData.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label>Notes / Instructions</Label>
            {isEditing ? (
              <Textarea
                value={invoiceData.notes || ''}
                onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                rows={3}
                className="mt-2"
                placeholder="Additional notes or instructions..."
              />
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">
                {invoiceData.notes || 'No additional notes'}
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {viewOnly ? 'Close' : 'Cancel'}
          </Button>
          {!viewOnly && (
            <Button onClick={handleGenerate}>
              <DollarSign className="h-4 w-4 mr-2" />
              Generate Invoice
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

