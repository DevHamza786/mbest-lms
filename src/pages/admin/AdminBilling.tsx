import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Plus, Download, CreditCard, DollarSign, Users, Calendar, Edit, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminInvoice } from '@/lib/api/admin';
import { generateStudentInvoicePDF, generateTutorInvoicePDF } from '@/lib/utils/invoicePdf';
import { CreateEditInvoiceModal } from '@/components/modals/CreateEditInvoiceModal';

export default function AdminBilling() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  /** Synced from searchTerm after debounce — used for API `search` param */
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const perPage = 15;
  const searchDebounceReady = useRef(false);

  // Statistics (from GET /admin/billing/summary)
  const [stats, setStats] = useState({
    total_revenue: 0,
    pending_amount: 0,
    pending_count: 0,
    overdue_amount: 0,
    overdue_count: 0,
    active_students: 0,
    revenue_change_percent_vs_last_month: 0,
    new_students_this_month: 0,
  });

  // Per-package breakdown (from GET /admin/billing/package-stats)
  const [packageStats, setPackageStats] = useState<{
    packages: Array<{ id: number; name: string; price: string | number; active_students: number; revenue: number }>;
    total_revenue_from_packages: number;
    total_active_students: number;
  }>({ packages: [], total_revenue_from_packages: 0, total_active_students: 0 });
  const [packageStatsLoading, setPackageStatsLoading] = useState(true);

  const fetchPackageStats = useCallback(async () => {
    try {
      setPackageStatsLoading(true);
      const data = await adminApi.getPackageStats();
      setPackageStats(data);
    } catch (error: unknown) {
      console.error('Error fetching package stats:', error);
    } finally {
      setPackageStatsLoading(false);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: currentPage,
        per_page: perPage,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      const q = debouncedSearch.trim();
      if (q) {
        params.search = q;
      }

      const response = await adminApi.getInvoices(params as Parameters<typeof adminApi.getInvoices>[0]);
      setInvoices(response.invoices);
      setTotal(response.total);
      setLastPage(response.last_page);
      setCurrentPage(response.current_page);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch invoices';
      console.error('Error fetching invoices:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, statusFilter, toast]);

  const fetchBillingSummary = useCallback(async () => {
    try {
      setStatsLoading(true);
      const data = await adminApi.getBillingSummary();
      setStats({
        total_revenue: data.total_revenue,
        pending_amount: data.pending_amount,
        pending_count: data.pending_count,
        overdue_amount: data.overdue_amount,
        overdue_count: data.overdue_count,
        active_students: data.active_students,
        revenue_change_percent_vs_last_month: data.revenue_change_percent_vs_last_month,
        new_students_this_month: data.new_students_this_month,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load billing summary';
      console.error('Error fetching billing summary:', error);
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setStatsLoading(false);
    }
  }, [toast]);

  // Debounce search; reset to page 1 when query changes (skip first sync to avoid extra pagination reset)
  useEffect(() => {
    const delay = searchTerm === '' ? 0 : 400;
    const id = window.setTimeout(() => {
      setDebouncedSearch(searchTerm);
      if (searchDebounceReady.current) {
        setCurrentPage(1);
      }
      searchDebounceReady.current = true;
    }, delay);
    return () => window.clearTimeout(id);
  }, [searchTerm]);

  useEffect(() => {
    fetchBillingSummary();
    fetchPackageStats();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // If admin creates invoices from calendar, refresh the billing page automatically.
  useEffect(() => {
    const handler = () => {
      fetchBillingSummary();
      fetchInvoices();
    };

    window.addEventListener('billing:refresh', handler);
    return () => window.removeEventListener('billing:refresh', handler);
  }, [fetchBillingSummary, fetchInvoices]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const handleDownloadInvoice = async (invoice: AdminInvoice) => {
    try {
      if (invoice.tutor_id) {
        // Tutor invoice
        await generateTutorInvoicePDF({
          id: String(invoice.id),
          invoiceNumber: invoice.invoice_number,
          date: invoice.issue_date,
          periodStart: invoice.period_start || invoice.issue_date,
          periodEnd: invoice.period_end || invoice.due_date,
          status: invoice.status === 'paid' ? 'Paid' : invoice.status === 'overdue' ? 'Overdue' : 'Pending',
          amount: parseFloat(String(invoice.amount)),
          tutorName: invoice.tutor?.user?.name || 'Unknown',
          tutorAddress: '',
          items: invoice.items?.map(item => ({
            description: item.description,
            quantity: 1,
            rate: parseFloat(String(item.amount)),
            amount: parseFloat(String(item.amount)),
          })) || [],
          notes: '',
        });
      } else {
        // Student invoice - need to convert AdminInvoice to Invoice format
        const studentInvoice = {
          id: String(invoice.id),
          invoiceNumber: invoice.invoice_number,
          studentName: invoice.student?.user?.name || '',
          parentName: invoice.parent?.name || '',
          amount: parseFloat(String(invoice.amount)),
          status: invoice.status,
          dueDate: invoice.due_date,
          issueDate: invoice.issue_date,
          items: invoice.items?.map(item => ({
            description: item.description,
            amount: parseFloat(String(item.amount)),
          })) || [],
        };
        generateStudentInvoicePDF(studentInvoice as any);
      }
      toast({
        title: "Download Started",
        description: `Invoice ${invoice.invoice_number} is being downloaded...`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = async (invoiceData: any) => {
    try {
      // Convert from modal format to API format
      const apiData = {
        invoice_number: invoiceData.invoiceNumber || `INV-${Date.now()}`,
        student_id: invoiceData.studentId || null,
        parent_id: invoiceData.parentId || null,
        tutor_id: invoiceData.tutorId || null,
        amount: invoiceData.amount,
        currency: invoiceData.currency || 'USD',
        due_date: invoiceData.dueDate,
        issue_date: invoiceData.issueDate,
        period_start: invoiceData.periodStart || null,
        period_end: invoiceData.periodEnd || null,
        description: invoiceData.description || null,
        items: invoiceData.items.map((item: any) => ({
          description: item.description,
          amount: item.amount,
          credits: item.credits || null,
        })),
      };
      
      await adminApi.createInvoice(apiData);
      toast({
        title: "Success",
        description: "Invoice created successfully",
      });
      setIsCreateModalOpen(false);
      fetchInvoices();
      fetchBillingSummary();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to create invoice',
        variant: "destructive",
      });
    }
  };

  const handleEditInvoice = async (invoiceData: any) => {
    try {
      if (!selectedInvoice) return;
      
      await adminApi.updateInvoice(selectedInvoice.id, {
        status: invoiceData.status,
        paid_date: invoiceData.paidDate || null,
        payment_method: invoiceData.paymentMethod || null,
        transaction_id: invoiceData.transactionId || null,
      });
      
      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });
      setIsEditModalOpen(false);
      setSelectedInvoice(null);
      fetchInvoices();
      fetchBillingSummary();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to update invoice',
        variant: "destructive",
      });
    }
  };

  const handleOpenEdit = (invoice: AdminInvoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Revenue</h1>
          <p className="text-muted-foreground">
            Manage invoices and financial operations
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      {/* Revenue Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${stats.total_revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">
                  <span
                    className={
                      stats.revenue_change_percent_vs_last_month >= 0
                        ? 'text-green-600'
                        : 'text-destructive'
                    }
                  >
                    {stats.revenue_change_percent_vs_last_month >= 0 ? '+' : ''}
                    {stats.revenue_change_percent_vs_last_month.toFixed(1)}%
                  </span>{' '}
                  vs last month (approved payments)
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${stats.pending_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pending_count} pending payment{stats.pending_count === 1 ? '' : 's'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${stats.overdue_amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.overdue_count} overdue invoice{stats.overdue_count === 1 ? '' : 's'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.active_students}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.new_students_this_month} new this month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Package</CardTitle>
          <CardDescription>Active packages, enrolled students, and revenue collected per package</CardDescription>
        </CardHeader>
        <CardContent>
          {packageStatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : packageStats.packages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No active packages found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Package</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Active Students</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {packageStats.packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>${Number(pkg.price).toFixed(2)}</TableCell>
                    <TableCell>{pkg.active_students}</TableCell>
                    <TableCell className="text-right">${pkg.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {!packageStatsLoading && packageStats.packages.length > 0 && (
            <div className="flex justify-end gap-8 mt-4 pt-4 border-t text-sm">
              <span className="text-muted-foreground">Total active students: <span className="font-semibold text-foreground">{packageStats.total_active_students}</span></span>
              <span className="text-muted-foreground">Total package revenue: <span className="font-semibold text-foreground">${packageStats.total_revenue_from_packages.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
          {/* Invoice Filters */}
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
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Invoices</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoices Table */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Management</CardTitle>
              <CardDescription>
                Track and manage all student invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Student/Tutor</TableHead>
                        <TableHead>Parent</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                            No invoices found
                          </TableCell>
                        </TableRow>
                      ) : (
                        invoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : '–'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={invoice.tutor_id ? 'outline' : 'secondary'}>
                                {invoice.tutor_id ? 'Tutor' : 'Student'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {invoice.tutor?.user?.name || invoice.student?.user?.name || '-'}
                            </TableCell>
                            <TableCell>{invoice.parent?.name || '-'}</TableCell>
                            <TableCell>${parseFloat(String(invoice.amount)).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(invoice.status)}>
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(invoice.due_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  title="Download Invoice"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleOpenEdit(invoice)}
                                  title="Edit Invoice"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  {lastPage > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-muted-foreground">
                        Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, total)} of {total} invoices
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                          disabled={currentPage === lastPage}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Create Invoice Modal */}
      <CreateEditInvoiceModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSave={handleCreateInvoice}
        mode="create"
      />

      {/* Edit Invoice Modal */}
      {selectedInvoice && (
        <CreateEditInvoiceModal
          open={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          onSave={handleEditInvoice}
          invoice={{
            id: String(selectedInvoice.id),
            invoiceNumber: selectedInvoice.invoice_number,
            studentId: selectedInvoice.student_id ? String(selectedInvoice.student_id) : undefined,
            parentId: selectedInvoice.parent_id ? String(selectedInvoice.parent_id) : undefined,
            tutorId: selectedInvoice.tutor_id ? String(selectedInvoice.tutor_id) : undefined,
            studentName: selectedInvoice.student?.user?.name,
            parentName: selectedInvoice.parent?.name,
            tutorName: selectedInvoice.tutor?.user?.name,
            amount: parseFloat(String(selectedInvoice.amount)),
            status: selectedInvoice.status,
            dueDate: selectedInvoice.due_date,
            issueDate: selectedInvoice.issue_date,
            periodStart: selectedInvoice.period_start,
            periodEnd: selectedInvoice.period_end,
            items: selectedInvoice.items?.map(item => ({
              description: item.description,
              amount: parseFloat(String(item.amount)),
            })) || [],
          } as any}
          mode="edit"
        />
      )}
    </div>
  );
}
