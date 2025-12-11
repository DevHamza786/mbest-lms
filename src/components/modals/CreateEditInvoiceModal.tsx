import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, X, Edit } from 'lucide-react';
import type { Invoice, InvoiceItem } from '@/lib/types/common';

interface CreateEditInvoiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (invoice: Invoice) => void;
  invoice?: Invoice | null;
  mode: 'create' | 'edit';
}

export function CreateEditInvoiceModal({ open, onOpenChange, onSave, invoice, mode }: CreateEditInvoiceModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<Invoice>>({
    id: '',
    invoiceNumber: '',
    studentId: '',
    studentName: '',
    parentId: '',
    parentName: '',
    tutorId: '',
    tutorName: '',
    amount: 0,
    currency: 'USD',
    status: 'pending',
    dueDate: new Date().toISOString().split('T')[0],
    issueDate: new Date().toISOString().split('T')[0],
    description: '',
    items: [{ description: '', amount: 0, credits: null }],
    paymentMethod: null,
    transactionId: null,
    tutorAddress: '',
    notes: '',
    periodStart: '',
    periodEnd: '',
  });

  useEffect(() => {
    if (invoice && mode === 'edit') {
      setFormData({
        ...invoice,
        dueDate: invoice.dueDate ? new Date(invoice.dueDate).toISOString().split('T')[0] : '',
        issueDate: invoice.issueDate ? new Date(invoice.issueDate).toISOString().split('T')[0] : '',
        periodStart: invoice.periodStart ? new Date(invoice.periodStart).toISOString().split('T')[0] : '',
        periodEnd: invoice.periodEnd ? new Date(invoice.periodEnd).toISOString().split('T')[0] : '',
      });
    } else {
      // Reset form for create mode
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
      setFormData({
        id: '',
        invoiceNumber,
        studentId: '',
        studentName: '',
        parentId: '',
        parentName: '',
        tutorId: '',
        tutorName: '',
        amount: 0,
        currency: 'USD',
        status: 'pending',
        dueDate: new Date().toISOString().split('T')[0],
        issueDate: new Date().toISOString().split('T')[0],
        description: '',
        items: [{ description: '', amount: 0, credits: null }],
        paymentMethod: null,
        transactionId: null,
        tutorAddress: '',
        notes: '',
        periodStart: '',
        periodEnd: '',
      });
    }
  }, [invoice, mode, open]);

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total amount
    const totalAmount = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    
    setFormData({ ...formData, items: updatedItems, amount: totalAmount });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...(formData.items || []), { description: '', amount: 0, credits: null }],
    });
  };

  const removeItem = (index: number) => {
    if (formData.items && formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      const totalAmount = updatedItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      setFormData({ ...formData, items: updatedItems, amount: totalAmount });
    }
  };

  const handleSave = () => {
    if (!formData.items || formData.items.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one invoice item.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.invoiceNumber) {
      toast({
        title: "Validation Error",
        description: "Invoice number is required.",
        variant: "destructive",
      });
      return;
    }

    const invoiceToSave: Invoice = {
      id: formData.id || `inv-${Date.now()}`,
      invoiceNumber: formData.invoiceNumber,
      studentId: formData.studentId || '',
      studentName: formData.studentName || '',
      parentId: formData.parentId,
      parentName: formData.parentName,
      tutorId: formData.tutorId,
      tutorName: formData.tutorName,
      amount: formData.amount || 0,
      currency: formData.currency || 'USD',
      status: formData.status || 'pending',
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : new Date().toISOString(),
      paidDate: null,
      issueDate: formData.issueDate ? new Date(formData.issueDate).toISOString() : new Date().toISOString(),
      description: formData.description || '',
      items: formData.items || [],
      paymentMethod: formData.paymentMethod,
      transactionId: formData.transactionId,
      tutorAddress: formData.tutorAddress,
      notes: formData.notes,
      periodStart: formData.periodStart ? new Date(formData.periodStart).toISOString() : undefined,
      periodEnd: formData.periodEnd ? new Date(formData.periodEnd).toISOString() : undefined,
    };

    onSave(invoiceToSave);
    toast({
      title: mode === 'create' ? "Invoice Created" : "Invoice Updated",
      description: `Invoice ${invoiceToSave.invoiceNumber} has been ${mode === 'create' ? 'created' : 'updated'} successfully.`,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            {mode === 'create' ? 'Create Invoice' : 'Edit Invoice'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Create a new invoice for a student or tutor.'
              : 'Edit invoice details and items.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoice-type">Invoice Type</Label>
              <Select
                value={formData.tutorId ? 'tutor' : 'student'}
                onValueChange={(value) => {
                  if (value === 'tutor') {
                    setFormData({ ...formData, tutorId: '', tutorName: '', studentId: '', studentName: '' });
                  } else {
                    setFormData({ ...formData, studentId: '', studentName: '', tutorId: '', tutorName: '' });
                  }
                }}
              >
                <SelectTrigger id="invoice-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student Invoice</SelectItem>
                  <SelectItem value="tutor">Tutor Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="invoice-number">Invoice Number</Label>
              <Input
                id="invoice-number"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="INV-000001"
              />
            </div>
          </div>

          {/* Student/Tutor Information */}
          {formData.tutorId ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tutor-id">Tutor ID</Label>
                  <Input
                    id="tutor-id"
                    value={formData.tutorId}
                    onChange={(e) => setFormData({ ...formData, tutorId: e.target.value })}
                    placeholder="tutor-001"
                  />
                </div>
                <div>
                  <Label htmlFor="tutor-name">Tutor Name</Label>
                  <Input
                    id="tutor-name"
                    value={formData.tutorName}
                    onChange={(e) => setFormData({ ...formData, tutorName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="tutor-address">Tutor Address</Label>
                <Textarea
                  id="tutor-address"
                  value={formData.tutorAddress}
                  onChange={(e) => setFormData({ ...formData, tutorAddress: e.target.value })}
                  placeholder="Enter tutor address..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="period-start">Period Start</Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={formData.periodStart}
                    onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="period-end">Period End</Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={formData.periodEnd}
                    onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="student-id">Student ID</Label>
                  <Input
                    id="student-id"
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    placeholder="student-001"
                  />
                </div>
                <div>
                  <Label htmlFor="student-name">Student Name</Label>
                  <Input
                    id="student-name"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parent-id">Parent ID (Optional)</Label>
                  <Input
                    id="parent-id"
                    value={formData.parentId}
                    onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                    placeholder="parent-001"
                  />
                </div>
                <div>
                  <Label htmlFor="parent-name">Parent Name (Optional)</Label>
                  <Input
                    id="parent-name"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="John Parent"
                  />
                </div>
              </div>
            </>
          )}

          {/* Invoice Details */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="issue-date">Issue Date</Label>
              <Input
                id="issue-date"
                type="date"
                value={formData.issueDate}
                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="due-date">Due Date</Label>
              <Input
                id="due-date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Invoice description..."
              rows={2}
            />
          </div>

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Invoice Items</Label>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
            <div className="space-y-3">
              {formData.items?.map((item, index) => (
                <div key={index} className="flex gap-2 items-start border p-3 rounded-lg">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      onChange={(e) => updateItem(index, 'amount', parseFloat(e.target.value) || 0)}
                    />
                    <Input
                      type="number"
                      placeholder="Credits (optional)"
                      value={item.credits || ''}
                      onChange={(e) => updateItem(index, 'credits', e.target.value ? parseFloat(e.target.value) : null)}
                    />
                  </div>
                  {formData.items && formData.items.length > 1 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <div className="text-right">
                <Label className="text-sm text-muted-foreground">Total Amount</Label>
                <p className="text-2xl font-bold">${(formData.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {mode === 'create' ? 'Create Invoice' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

