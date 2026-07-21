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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DollarSign,
  Calendar,
  Wallet,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  FileText,
  User,
  Package,
  Eye
} from 'lucide-react';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { UpgradePlanDialog } from '@/components/parent/UpgradePlanDialog';
import { parentApi } from '@/lib/api';

interface ParentPayment {
  id: number;
  parent_id: number;
  package_id: number;
  amount: number;
  payment_slip_path: string;
  status: string;
  admin_notes: string;
  approved_by: number;
  approved_at: string;
  created_at: string;
  updated_at: string;
  package?: {
    name: string;
  };
  approver?: {
    name: string;
  };
}

export default function ParentBilling() {
  const [payments, setPayments] = useState<ParentPayment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<ParentPayment | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);

  // Load payments
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setPaymentsLoading(true);
        const paymentsData = await parentApi.getPayments({
          status: statusFilter !== 'all' ? statusFilter : undefined
        });

        const mappedPayments = paymentsData.map((pay: any) => ({
          id: pay.id,
          parent_id: pay.parent_id,
          package_id: pay.package_id,
          amount: parseFloat(String(pay.amount || 0)),
          payment_slip_path: pay.payment_slip_path,
          status: pay.status,
          admin_notes: pay.admin_notes,
          approved_by: pay.approved_by,
          approved_at: pay.approved_at,
          created_at: pay.created_at,
          updated_at: pay.updated_at,
          package: pay.package,
          approver: pay.approver,
        }));

        setPayments(mappedPayments);
      } catch (error) {
        console.error('Failed to load payments:', error);
      } finally {
        setPaymentsLoading(false);
      }
    };

    loadPayments();
  }, [statusFilter]);

  // Filter payments
  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch =
      String(payment.id).includes(searchTerm.toLowerCase()) ||
      payment.package?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.admin_notes?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate totals
  const totalApproved = payments?.filter(pay => pay.status === 'approved').reduce((sum, pay) => sum + pay.amount, 0) || 0;
  const totalPending = payments?.filter(pay => pay.status === 'pending').reduce((sum, pay) => sum + pay.amount, 0) || 0;
  const totalRejected = payments?.filter(pay => pay.status === 'rejected').reduce((sum, pay) => sum + pay.amount, 0) || 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground">
            View your subscription payment history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setIsUpgradeOpen(true)}>Upgrade Plan</Button>
          <ChildSwitcher />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Approved</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totalApproved)}</div>
            <p className="text-xs text-muted-foreground">
              {payments?.filter(pay => pay.status === 'approved').length || 0} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
            <p className="text-xs text-muted-foreground">
              {payments?.filter(pay => pay.status === 'pending').length || 0} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalRejected)}</div>
            <p className="text-xs text-muted-foreground">
              {payments?.filter(pay => pay.status === 'rejected').length || 0} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, package, or notes..."
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
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments Table */}
      {paymentsLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading payments...</p>
          </div>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              View your subscription payment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Admin Notes</TableHead>
                  <TableHead>Payment Slip</TableHead>
                  <TableHead>Approved By</TableHead>
                  <TableHead>Approved At</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">#{payment.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        {payment.package?.name || `Package #${payment.package_id}`}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getStatusVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.admin_notes || '-'}
                    </TableCell>
                    <TableCell>
                      {payment.payment_slip_path ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex items-center gap-1 text-blue-600"
                              onClick={() => setSelectedPayment(payment)}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Payment Slip - #{payment.id}</DialogTitle>
                              <DialogDescription>
                                {payment.package?.name} - {formatCurrency(payment.amount)}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="mt-4">
                              <img
                                src={payment.payment_slip_path}
                                alt="Payment Slip"
                                className="w-full h-auto rounded-md"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {payment.approver?.name ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {payment.approver.name}
                        </div>
                      ) : payment.approved_by ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          #{payment.approved_by}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.approved_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.created_at)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(payment.updated_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredPayments.length === 0 && (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Payments Found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all'
                    ? 'No payments match your current filters.'
                    : 'No payment records yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <UpgradePlanDialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen} />
    </div>
  );
}