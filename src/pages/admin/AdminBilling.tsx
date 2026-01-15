import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Download, CreditCard, DollarSign, Users, Calendar, Edit, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const perPage = 15;
  
  // Statistics
  const [stats, setStats] = useState({
    total_revenue: 0,
    pending_amount: 0,
    overdue_amount: 0,
    active_students: 0,
    parent_payment_revenue: 0,
  });
  
  // Parent payments state
  const [parentPayments, setParentPayments] = useState<AdminInvoice[]>([]);
  const [parentPaymentsLoading, setParentPaymentsLoading] = useState(false);

  // Fetch invoices
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        per_page: perPage,
      };
      
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await adminApi.getInvoices(params);
      setInvoices(response.invoices);
      setTotal(response.total);
      setLastPage(response.last_page);
      setCurrentPage(response.current_page);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch invoices',
        variant: "destructive",
      });
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch parent payments
  const fetchParentPayments = async () => {
    try {
      setParentPaymentsLoading(true);
      const response = await adminApi.getInvoices({ 
        per_page: 1000,
        // Filter for invoices with parent_id (parent payments)
      });
      
      // Filter invoices that have parent_id and are paid (parent payments)
      const parentPaidInvoices = response.invoices.filter(
        inv => inv.parent_id && inv.status === 'paid'
      );
      
      setParentPayments(parentPaidInvoices);
    } catch (error: any) {
      console.error('Error fetching parent payments:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to fetch parent payments',
        variant: "destructive",
      });
      setParentPayments([]);
    } finally {
      setParentPaymentsLoading(false);
    }
  };

  // Fetch statistics
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const invoices = await adminApi.getInvoices({ per_page: 1000 });
      const totalRevenue = invoices.invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0);
      const pendingAmount = invoices.invoices
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0);
      const overdueAmount = invoices.invoices
        .filter(inv => inv.status === 'overdue')
        .reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0);
      
      // Calculate parent payment revenue (paid invoices with parent_id)
      const parentPaymentRevenue = invoices.invoices
        .filter(inv => inv.parent_id && inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(String(inv.amount)), 0);
      
      const userStats = await adminApi.getUserStats();
      
      setStats({
        total_revenue: totalRevenue,
        pending_amount: pendingAmount,
        overdue_amount: overdueAmount,
        active_students: userStats.students,
        parent_payment_revenue: parentPaymentRevenue,
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchInvoices();
    fetchStats();
    fetchParentPayments();
  }, []);

  // Refetch when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchInvoices();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  // Refetch when page changes
  useEffect(() => {
    fetchInvoices();
  }, [currentPage]);

  // Filter invoices client-side for search (since backend might not support search)
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    
    return invoices.filter(invoice => {
      const studentName = invoice.student?.user?.name || '';
      const tutorName = invoice.tutor?.user?.name || '';
      const parentName = invoice.parent?.name || '';
      const invoiceNumber = invoice.invoice_number || '';
      
      const searchLower = searchTerm.toLowerCase();
      return (
        studentName.toLowerCase().includes(searchLower) ||
        tutorName.toLowerCase().includes(searchLower) ||
        parentName.toLowerCase().includes(searchLower) ||
        invoiceNumber.toLowerCase().includes(searchLower)
      );
    });
  }, [invoices, searchTerm]);

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
      fetchStats();
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
      fetchStats();
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

  const handleSendReminder = (invoiceId: number) => {
    toast({
      title: "Reminder Sent",
      description: "Payment reminder has been sent to the parent/student.",
    });
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 299,
      duration: 'per month',
      features: ['Up to 3 courses', 'Basic support', 'Student dashboard'],
      students: 156,
      revenue: 46644
    },
    {
      id: 'standard',
      name: 'Standard Plan',
      price: 599,
      duration: 'per month',
      features: ['Up to 8 courses', 'Priority support', 'Advanced analytics', 'Parent dashboard'],
      students: 89,
      revenue: 53311
    },
    {
      id: 'premium',
      name: 'Premium Plan',
      price: 999,
      duration: 'per month',
      features: ['Unlimited courses', '24/7 support', 'Custom reports', 'API access'],
      students: 45,
      revenue: 44955
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Revenue</h1>
          <p className="text-muted-foreground">
            Manage subscription plans, invoices, and financial operations
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
                <div className="text-2xl font-bold">${stats.total_revenue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-500">+18%</span> from last month
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
                <div className="text-2xl font-bold">${stats.pending_amount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {invoices.filter(inv => inv.status === 'pending').length} invoices
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
                <div className="text-2xl font-bold">${stats.overdue_amount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {invoices.filter(inv => inv.status === 'overdue').length} overdue invoices
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
                  <span className="text-green-500">+12</span> new this month
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="parent-payments">Parent Payments</TabsTrigger>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-6">
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
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
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
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
                      {filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No invoices found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
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
                                {invoice.status === 'pending' && !invoice.tutor_id && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleSendReminder(invoice.id)}
                                  >
                                    Send Reminder
                                  </Button>
                                )}
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
        </TabsContent>

        <TabsContent value="parent-payments" className="space-y-6">
          {/* Summary Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{parentPayments.length}</div>
                <p className="text-xs text-muted-foreground">Paid invoices from parents</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${stats.parent_payment_revenue.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">From parent payments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${parentPayments.length > 0 
                    ? (stats.parent_payment_revenue / parentPayments.length).toFixed(2)
                    : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Per invoice</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Parent Payments</CardTitle>
                <CardDescription>
                  Track all payments received from parents and their contribution to revenue
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {parentPaymentsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Invoice ID</TableHead>
                        <TableHead>Parent Name</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parentPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No parent payments found
                          </TableCell>
                        </TableRow>
                      ) : (
                        parentPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium">{payment.invoice_number}</TableCell>
                            <TableCell>{payment.parent?.name || '-'}</TableCell>
                            <TableCell>{payment.student?.user?.name || '-'}</TableCell>
                            <TableCell className="font-semibold">
                              ${parseFloat(String(payment.amount)).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {payment.paid_date 
                                ? new Date(payment.paid_date).toLocaleDateString()
                                : new Date(payment.issue_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {payment.payment_method || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={getStatusColor(payment.status)}>
                                {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(payment)}
                                  title="Download Invoice"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleOpenEdit(payment)}
                                  title="View Details"
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
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="plans" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">
                      ${plan.price}
                    </span>
                    <span className="text-muted-foreground">/{plan.duration}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm">
                        <span className="mr-2 h-1 w-1 rounded-full bg-primary"></span>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Active Students:</span>
                      <span className="font-medium">{plan.students}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Revenue:</span>
                      <span className="font-medium">${plan.revenue.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button variant="outline" className="w-full">
                      Manage Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Plan Performance</CardTitle>
              <CardDescription>
                Revenue distribution across subscription plans
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plans.map((plan) => {
                  const percentage = (plan.revenue / plans.reduce((sum, p) => sum + p.revenue, 0)) * 100;
                  return (
                    <div key={plan.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-primary"></div>
                        <span className="font-medium">{plan.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${plan.revenue.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
