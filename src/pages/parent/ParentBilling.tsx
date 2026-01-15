import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  Search, 
  Download, 
  Eye, 
  AlertCircle,
  Receipt,
  Clock
} from 'lucide-react';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useParentContext, useParentStore } from '@/lib/store/parentStore';
import { parentApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { ParentInvoice } from '@/lib/store/parentStore';

export default function ParentBilling() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<ParentInvoice | null>(null);
  const { toast } = useToast();
  
  const {
    activeChild,
    invoices,
    isLoading,
  } = useParentContext();

  const {
    setInvoices,
    setLoading,
  } = useParentStore();

  // Load invoices
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        const invoicesData = await parentApi.getInvoices();
        
        // Map API response to store format
        const mappedInvoices = invoicesData.map(inv => ({
          id: inv.invoice_number || String(inv.id),
          period: inv.period_start && inv.period_end
            ? `${new Date(inv.period_start).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
            : new Date(inv.issue_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          amount: parseFloat(String(inv.amount || 0)) || 0, // Ensure amount is a number
          status: (inv.status === 'paid' ? 'paid' : 
                  inv.status === 'overdue' ? 'overdue' : 
                  new Date(inv.due_date) < new Date() ? 'overdue' :
                  new Date(inv.due_date).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000 ? 'due_soon' : 
                  'pending') as 'paid' | 'overdue' | 'due_soon' | 'pending',
          issuedOn: inv.issue_date,
          dueDate: inv.due_date,
          lineItems: (inv.items || []).map(item => ({
            description: item.description || '',
            amount: parseFloat(String(item.amount || 0)) || 0, // Ensure item amount is a number
            childId: String(inv.student_id || ''), // Use student_id from invoice
          })),
          _apiId: inv.id, // Store API ID for downloading
        }));
        
        setInvoices(mappedInvoices);
      } catch (error) {
        console.error('Failed to load invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInvoices();
  }, [setInvoices, setLoading]);

  // Filter invoices
  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'due_soon': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'due_soon': return 'Due Soon';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate totals - ensure amounts are parsed as numbers
  const totalPaid = invoices?.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + (parseFloat(String(inv.amount || 0)) || 0), 0) || 0;
  const totalPending = invoices?.filter(inv => inv.status === 'pending' || inv.status === 'due_soon').reduce((sum, inv) => sum + (parseFloat(String(inv.amount || 0)) || 0), 0) || 0;
  const totalOverdue = invoices?.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + (parseFloat(String(inv.amount || 0)) || 0), 0) || 0;

  const handleDownloadInvoice = async (invoice: ParentInvoice) => {
    try {
      const apiId = (invoice as any)._apiId;
      if (!apiId) {
        toast({
          title: "Error",
          description: "Invoice ID not found",
          variant: "destructive",
        });
        return;
      }
      
      const blob = await parentApi.downloadInvoicePdf(apiId);
      
      // Validate that we got a valid PDF blob
      if (!blob || blob.size === 0) {
        throw new Error('Empty or invalid PDF file received');
      }
      
      // Check if blob is actually a PDF by checking the first few bytes
      const firstBytes = await blob.slice(0, 4).arrayBuffer();
      const uint8Array = new Uint8Array(firstBytes);
      const pdfHeader = String.fromCharCode(...uint8Array);
      
      if (pdfHeader !== '%PDF') {
        throw new Error('Invalid PDF file received');
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast({
        title: "Download Started",
        description: `Invoice ${invoice.id} is being downloaded...`,
      });
    } catch (error: any) {
      // Extract error message, ensuring it's a string and not JSON
      let errorMessage = "PDF download is currently not available. Please contact support.";
      
      if (error && error.message) {
        // If error.message is a string, use it
        if (typeof error.message === 'string') {
          errorMessage = error.message;
        } else if (typeof error.message === 'object') {
          // If error.message is an object, try to extract message from it
          try {
            errorMessage = JSON.parse(JSON.stringify(error.message)).message || errorMessage;
          } catch {
            errorMessage = String(error.message);
          }
        }
      }
      
      console.error('Failed to download invoice:', errorMessage);
      toast({
        title: "Download Unavailable",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePayNow = (invoice: ParentInvoice) => {
    toast({
      title: "Payment Portal",
      description: "Redirecting to secure payment portal...",
    });
    // In a real app, this would redirect to payment processor
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
          <p className="text-muted-foreground">
            Manage invoices and payment history
          </p>
        </div>
        <ChildSwitcher />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices?.filter(inv => inv.status === 'paid').length || 0} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices?.filter(inv => inv.status === 'pending' || inv.status === 'due_soon').length || 0} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalOverdue)}</div>
            <p className="text-xs text-muted-foreground">
              {invoices?.filter(inv => inv.status === 'overdue').length || 0} overdue invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoices?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search invoices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Invoices</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="due_soon">Due Soon</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoices Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading invoices...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>
              View and manage your billing history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Issued On</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => {
                  const daysUntilDue = getDaysUntilDue(invoice.dueDate);
                  
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.id}</TableCell>
                      <TableCell>{invoice.period}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(invoice.status)}>
                            {getStatusLabel(invoice.status)}
                          </Badge>
                          {invoice.status === 'due_soon' && daysUntilDue >= 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.issuedOn)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(invoice.dueDate)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => setSelectedInvoice(invoice)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent className="w-[400px] sm:w-[540px]">
                              <SheetHeader>
                                <SheetTitle>Invoice {invoice.id}</SheetTitle>
                                <SheetDescription>
                                  {invoice.period} • {getStatusLabel(invoice.status)}
                                </SheetDescription>
                              </SheetHeader>
                              
                              <div className="mt-6 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-medium text-sm text-muted-foreground">Issued On</h4>
                                    <p>{formatDate(invoice.issuedOn)}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-sm text-muted-foreground">Due Date</h4>
                                    <p>{formatDate(invoice.dueDate)}</p>
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div>
                                  <h4 className="font-medium mb-3">Line Items</h4>
                                  <div className="space-y-2">
                                    {invoice.lineItems.map((item, index) => (
                                      <div key={index} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                        <span className="text-sm">{item.description}</span>
                                        <span className="font-medium">{formatCurrency(item.amount)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                
                                <Separator />
                                
                                <div className="flex justify-between items-center text-lg font-semibold">
                                  <span>Total Amount</span>
                                  <span>{formatCurrency(invoice.amount)}</span>
                                </div>
                                
                                <div className="flex gap-2 pt-4">
                                  <Button 
                                    variant="outline" 
                                    className="flex-1"
                                    onClick={() => handleDownloadInvoice(invoice)}
                                  >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download
                                  </Button>
                                  {(invoice.status === 'pending' || invoice.status === 'due_soon' || invoice.status === 'overdue') && (
                                    <Button 
                                      className="flex-1"
                                      onClick={() => handlePayNow(invoice)}
                                    >
                                      <CreditCard className="mr-2 h-4 w-4" />
                                      Pay Now
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                          
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownloadInvoice(invoice)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          
                          {(invoice.status === 'pending' || invoice.status === 'due_soon' || invoice.status === 'overdue') && (
                            <Button 
                              size="sm"
                              onClick={() => handlePayNow(invoice)}
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filteredInvoices.length === 0 && (
              <div className="text-center py-8">
                <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Invoices Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'No invoices match your current filters.' 
                    : 'No invoices have been generated yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Methods Section (Stub) */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>
            Manage your payment methods and billing preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Payment Methods</h3>
              <p className="text-muted-foreground mb-4">
                Add and manage your payment methods for automatic billing
              </p>
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
