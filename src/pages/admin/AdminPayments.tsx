import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Eye, Loader2, AlertCircle, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { adminApi, type Payment } from '@/lib/api/admin';

export default function AdminPayments() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Helper function to format amount (handles both string and number)
  const formatAmount = (amount: string | number): string => {
    if (typeof amount === 'string') {
      return parseFloat(amount).toFixed(2);
    }
    return amount.toFixed(2);
  };
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const perPage = 15;

  useEffect(() => {
    loadPayments();
  }, [activeTab, currentPage]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const params: any = {
        per_page: perPage,
        page: currentPage,
      };
      
      if (activeTab === 'pending') {
        params.pending_only = true;
      } else if (activeTab !== 'all') {
        params.status = activeTab;
      }
      
      const response = await adminApi.getPayments(params);
      setPayments(response.data || []);
      setTotal(response.total || 0);
      setLastPage(response.last_page || 1);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load payments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (payment: Payment) => {
    try {
      setIsLoadingPayment(true);
      setSelectedPayment(null); // Reset before loading
      console.log('Loading payment:', payment.id);
      const fullPayment = await adminApi.getPayment(payment.id);
      console.log('Loaded payment:', fullPayment);
      setSelectedPayment(fullPayment);
      setIsViewDialogOpen(true);
    } catch (error: any) {
      console.error('Error loading payment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load payment details',
        variant: 'destructive',
      });
      setIsViewDialogOpen(false);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handleApprove = (payment: Payment) => {
    setSelectedPayment(payment);
    setAdminNotes('');
    setIsApproveDialogOpen(true);
  };

  const handleReject = (payment: Payment) => {
    setSelectedPayment(payment);
    setAdminNotes('');
    setIsRejectDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedPayment) return;
    try {
      setIsProcessing(true);
      await adminApi.approvePayment(selectedPayment.id, adminNotes);
      toast({
        title: 'Success',
        description: 'Payment approved successfully',
      });
      setIsApproveDialogOpen(false);
      loadPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to approve payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedPayment || !adminNotes.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide a reason for rejection',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsProcessing(true);
      await adminApi.rejectPayment(selectedPayment.id, adminNotes);
      toast({
        title: 'Success',
        description: 'Payment rejected',
      });
      setIsRejectDialogOpen(false);
      loadPayments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reject payment',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Payment Management</h1>
        <p className="text-muted-foreground">Review and approve parent subscription payments</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payments</CardTitle>
              <CardDescription>Manage payment approvals and rejections</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by parent, package, or amount..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            setCurrentPage(1); // Reset to first page when filter changes
            // Don't reload page, just update state - useEffect will handle data loading
          }}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground">Loading payments...</span>
                </div>
              ) : (
              <div className="relative">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parent</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    // Filter payments based on search query
                    const filteredPayments = payments.filter((payment) => {
                      if (!searchQuery.trim()) return true;
                      const query = searchQuery.toLowerCase();
                      return (
                        payment.parent?.name?.toLowerCase().includes(query) ||
                        payment.parent?.email?.toLowerCase().includes(query) ||
                        payment.package?.name?.toLowerCase().includes(query) ||
                        formatAmount(payment.amount).includes(query) ||
                        payment.id.toString().includes(query)
                      );
                    });

                    if (filteredPayments.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            {searchQuery ? 'No payments match your search' : 'No payments found'}
                          </TableCell>
                        </TableRow>
                      );
                    }

                    return filteredPayments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.parent?.name || 'Unknown'}
                        </TableCell>
                        <TableCell>{payment.package?.name || 'N/A'}</TableCell>
                        <TableCell>${formatAmount(payment.amount)}</TableCell>
                        <TableCell>{getStatusBadge(payment.status)}</TableCell>
                        <TableCell>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(payment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {payment.status === 'pending' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleApprove(payment)}
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleReject(payment)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
              </div>
              )}
              
              {!loading && lastPage > 1 && (
                <div className="flex justify-between items-center mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || loading}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {lastPage} ({total} total)
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                    disabled={currentPage === lastPage || loading}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* View Payment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Payment Details</DialogTitle>
            <DialogDescription>View payment slip and details</DialogDescription>
          </DialogHeader>
          {isLoadingPayment ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-muted-foreground">Loading payment details...</span>
            </div>
          ) : selectedPayment ? (
            <div className="space-y-6">
              {/* Payment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Parent Name</Label>
                  <p className="font-medium mt-1">{selectedPayment.parent?.name || 'Unknown'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Parent Email</Label>
                  <p className="font-medium mt-1">{selectedPayment.parent?.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Package</Label>
                  <p className="font-medium mt-1">{selectedPayment.package?.name || 'N/A'}</p>
                  {selectedPayment.package?.description && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedPayment.package.description}</p>
                  )}
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Amount</Label>
                  <p className="font-medium text-lg mt-1">${formatAmount(selectedPayment.amount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment ID</Label>
                  <p className="font-medium mt-1">#{selectedPayment.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Submitted Date</Label>
                  <p className="font-medium mt-1">{new Date(selectedPayment.created_at).toLocaleString()}</p>
                </div>
                {selectedPayment.approved_at && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Approved At</Label>
                    <p className="font-medium mt-1">{new Date(selectedPayment.approved_at).toLocaleString()}</p>
                  </div>
                )}
                {selectedPayment.approver && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Approved By</Label>
                    <p className="font-medium mt-1">{selectedPayment.approver?.name || 'N/A'}</p>
                  </div>
                )}
              </div>

              {/* Payment Slip */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground mb-3 block">Payment Slip</Label>
                {selectedPayment.payment_slip_url || selectedPayment.payment_slip_path ? (
                  <div className="mt-2 border-2 rounded-lg p-4 bg-muted/30">
                    {(() => {
                      // Construct full URL for payment slip
                      let imageUrl = '';
                      if (selectedPayment.payment_slip_url) {
                        // If URL starts with /storage, prepend base URL
                        if (selectedPayment.payment_slip_url.startsWith('/storage')) {
                          const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';
                          imageUrl = `${baseURL}${selectedPayment.payment_slip_url}`;
                        } else {
                          imageUrl = selectedPayment.payment_slip_url;
                        }
                      } else if (selectedPayment.payment_slip_path) {
                        const baseURL = import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000';
                        imageUrl = `${baseURL}/storage/${selectedPayment.payment_slip_path}`;
                      }
                      
                      return (
                        <div className="flex flex-col items-center">
                          <div className="w-full flex justify-center bg-white rounded-lg p-2 border">
                            <img
                              src={imageUrl}
                              alt="Payment slip"
                              className="max-w-full h-auto rounded border-2 border-gray-200 shadow-sm max-h-[500px] object-contain"
                              style={{ maxWidth: '100%', height: 'auto' }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent && !parent.querySelector('.error-message')) {
                                  const errorMsg = document.createElement('div');
                                  errorMsg.className = 'text-sm text-muted-foreground error-message text-center p-4';
                                  errorMsg.innerHTML = `
                                    <p class="font-medium text-destructive mb-2">Payment slip image could not be loaded</p>
                                    <p class="text-xs">URL: ${imageUrl}</p>
                                    <p class="text-xs mt-1">Path: ${selectedPayment.payment_slip_path || 'N/A'}</p>
                                  `;
                                  parent.appendChild(errorMsg);
                                }
                              }}
                            />
                          </div>
                          {selectedPayment.payment_slip_path && (
                            <div className="mt-3 text-xs text-muted-foreground text-center">
                              <p className="font-medium">File Path:</p>
                              <p className="break-all">{selectedPayment.payment_slip_path}</p>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="mt-2 p-4 border rounded-lg bg-muted/50 text-center">
                    <p className="text-sm text-muted-foreground">No payment slip uploaded</p>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              {selectedPayment.admin_notes && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Admin Notes</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg border">
                    <p className="text-sm whitespace-pre-wrap">{selectedPayment.admin_notes}</p>
                  </div>
                </div>
              )}

              {/* Package Details */}
              {selectedPayment.package && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Package Details</Label>
                  <div className="mt-2 p-4 bg-muted rounded-lg border space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <p><strong>Student Limit:</strong> {selectedPayment.package.student_limit || 'Unlimited'}</p>
                      {selectedPayment.package.allows_one_on_one && (
                        <p><strong>1:1 Sessions:</strong> <span className="text-green-600">Available</span></p>
                      )}
                    </div>
                    {selectedPayment.package.classes && selectedPayment.package.classes.length > 0 && (
                      <div className="mt-3">
                        <strong className="block mb-2">Included Classes ({selectedPayment.package.classes.length}):</strong>
                        <div className="flex flex-wrap gap-2">
                          {selectedPayment.package.classes.map((cls: any) => (
                            <Badge key={cls.id} variant="outline" className="text-xs">
                              {cls.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading payment details...</p>
            </div>
          )}
          <DialogFooter className="flex flex-wrap gap-2 sm:flex-nowrap">
            <Button 
              variant="outline" 
              onClick={() => setIsViewDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              Close
            </Button>
            {selectedPayment?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleReject(selectedPayment);
                  }}
                  className="text-red-600 hover:text-red-700 w-full sm:w-auto"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleApprove(selectedPayment);
                  }}
                  className="w-full sm:w-auto"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payment</DialogTitle>
            <DialogDescription>
              Approve this payment and activate the parent's subscription?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div className="bg-muted p-4 rounded">
                <p><strong>Parent:</strong> {selectedPayment.parent?.name}</p>
                <p><strong>Package:</strong> {selectedPayment.package?.name}</p>
                <p><strong>Amount:</strong> ${formatAmount(selectedPayment.amount)}</p>
              </div>
            )}
            <div>
              <Label htmlFor="approve-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="approve-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApproveConfirm} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Reject this payment. Please provide a reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div className="bg-muted p-4 rounded">
                <p><strong>Parent:</strong> {selectedPayment.parent?.name}</p>
                <p><strong>Package:</strong> {selectedPayment.package?.name}</p>
                <p><strong>Amount:</strong> ${formatAmount(selectedPayment.amount)}</p>
              </div>
            )}
            <div>
              <Label htmlFor="reject-notes">Rejection Reason *</Label>
              <Textarea
                id="reject-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={isProcessing || !adminNotes.trim()}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
