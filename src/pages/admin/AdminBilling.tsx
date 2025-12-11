import { useState } from 'react';
import { Search, Filter, Plus, Download, CreditCard, DollarSign, Users, Calendar, Edit } from 'lucide-react';
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
import invoicesData from '@/data/invoices.json';
import type { Invoice } from '@/lib/types/common';
import { generateStudentInvoicePDF, generateTutorInvoicePDF } from '@/lib/utils/invoicePdf';
import { CreateEditInvoiceModal } from '@/components/modals/CreateEditInvoiceModal';

export default function AdminBilling() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>(invoicesData as Invoice[]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = 
      (invoice.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (invoice.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (invoice.tutorName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      invoice.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'default';
      case 'pending': return 'secondary';
      case 'overdue': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'secondary';
    }
  };

  const totalRevenue = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingAmount = invoices
    .filter(inv => inv.status === 'pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const overdueAmount = invoices
    .filter(inv => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const handleDownloadInvoice = (invoice: Invoice) => {
    try {
      if (invoice.tutorId) {
        // Tutor invoice
        generateTutorInvoicePDF({
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber || invoice.id,
          date: invoice.issueDate,
          periodStart: invoice.periodStart || invoice.issueDate,
          periodEnd: invoice.periodEnd || invoice.dueDate,
          status: invoice.status === 'paid' ? 'Paid' : invoice.status === 'overdue' ? 'Overdue' : 'Pending',
          amount: invoice.amount,
          tutorName: invoice.tutorName,
          tutorAddress: invoice.tutorAddress,
          items: invoice.items.map(item => ({
            description: item.description,
            quantity: 1,
            rate: item.amount,
            amount: item.amount,
          })),
          notes: invoice.notes,
        });
      } else {
        // Student invoice
        generateStudentInvoicePDF(invoice);
      }
      toast({
        title: "Download Started",
        description: `Invoice ${invoice.invoiceNumber || invoice.id} is being downloaded...`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateInvoice = (invoice: Invoice) => {
    setInvoices([...invoices, invoice]);
    setIsCreateModalOpen(false);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setInvoices(invoices.map(inv => inv.id === invoice.id ? invoice : inv));
    setIsEditModalOpen(false);
    setSelectedInvoice(null);
  };

  const handleOpenEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsEditModalOpen(true);
  };

  const handleSendReminder = (invoiceId: string) => {
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
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+18%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'pending').length} invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${overdueAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {invoices.filter(inv => inv.status === 'overdue').length} overdue invoices
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">290</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12</span> new this month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
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
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoiceNumber || invoice.id}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.tutorId ? 'outline' : 'secondary'}>
                          {invoice.tutorId ? 'Tutor' : 'Student'}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.tutorName || invoice.studentName || '-'}</TableCell>
                      <TableCell>{invoice.parentName || '-'}</TableCell>
                      <TableCell>${invoice.amount.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(invoice.status)}>
                          {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.dueDate).toLocaleDateString()}
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
                          {invoice.status === 'pending' && !invoice.tutorId && (
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
                  ))}
                </TableBody>
              </Table>
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
      <CreateEditInvoiceModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        onSave={handleEditInvoice}
        invoice={selectedInvoice}
        mode="edit"
      />
    </div>
  );
}