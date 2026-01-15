import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Clock, DollarSign, FileText, Download, Plus, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { generateTutorInvoicePDF } from '@/lib/utils/invoicePdf';
import { tutorApi } from '@/lib/api';
import { format } from 'date-fns';

interface LessonHour {
  id: string;
  date: string;
  title: string; // Class/Subject name for group classes
  students: string[]; // Array of student names for group classes
  status: 'Attended' | 'Student Cancelled' | 'Tutor Cancelled';
  start: string;
  end: string;
  hours: number;
  earnings: number;
  paid: boolean;
  isGroupClass?: boolean; // Indicates if this is a group class
}

interface TutorInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  periodStart: string;
  periodEnd: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  amount: number;
}

export default function TutorHours() {
  const { toast } = useToast();
  const [isAddEntryOpen, setIsAddEntryOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [lessonHours, setLessonHours] = useState<LessonHour[]>([]);
  const [invoices, setInvoices] = useState<TutorInvoice[]>([]);
  const [summary, setSummary] = useState({
    total_hours: 0,
    total_earnings: 0,
    pending_hours: 0,
    pending_earnings: 0,
  });

  const [newInvoice, setNewInvoice] = useState({
    session_id: '',
    period_start: '',
    period_end: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    tutor_address: '',
    notes: '',
  });

  // Load hours and invoices on mount
  useEffect(() => {
    loadHours();
    loadInvoices();
  }, []);

  const loadHours = async () => {
    try {
      setIsLoading(true);
      const response = await tutorApi.getHoursWorked();
      
      // Response structure: { success: true, data: paginated_sessions, summary: {...} }
      // paginated_sessions = { data: [...sessions], current_page, last_page, ... }
      const paginatedData = response.data || {};
      const sessions = Array.isArray(paginatedData) ? paginatedData : (paginatedData.data || []);
      const summaryData = response.summary || {};
      
      // Map sessions to LessonHour format
      const mappedHours: LessonHour[] = sessions.map((session: any) => ({
        id: String(session.id),
        date: format(new Date(session.date), 'dd/MM/yyyy'),
        title: session.subject || 'Session',
        students: session.students?.map((s: any) => s.user?.name || 'Student') || [],
        status: session.status === 'completed' ? 'Attended' : session.status === 'cancelled' ? 'Tutor Cancelled' : 'Student Cancelled',
        start: format(new Date(`2000-01-01T${session.start_time}`), 'hh:mm a'),
        end: format(new Date(`2000-01-01T${session.end_time}`), 'hh:mm a'),
        hours: session.hours || 0,
        earnings: session.earnings || 0,
        paid: session.paid || false,
        isGroupClass: (session.students?.length || 0) > 1,
      }));

      setLessonHours(mappedHours);
      setSummary({
        total_hours: summaryData.total_hours || 0,
        total_earnings: summaryData.total_earnings || 0,
        pending_hours: summaryData.pending_hours || 0,
        pending_earnings: summaryData.pending_earnings || 0,
      });
    } catch (error) {
      console.error('Failed to load hours:', error);
      toast({
        title: 'Error',
        description: 'Failed to load hours data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadInvoices = async () => {
    try {
      setIsLoadingInvoices(true);
      const response = await tutorApi.getInvoices();
      // Response structure: { success: true, data: paginated_invoices }
      // paginated_invoices = { data: [...invoices], current_page, last_page, ... }
      const paginatedData = response.data || {};
      const invoicesData = Array.isArray(paginatedData) ? paginatedData : (paginatedData.data || []);
      
      const mappedInvoices: TutorInvoice[] = invoicesData.map((invoice: any) => ({
        id: String(invoice.id),
        invoiceNumber: invoice.invoice_number || `INV-${invoice.id}`,
        date: format(new Date(invoice.issue_date), 'dd/MM/yyyy'),
        periodStart: format(new Date(invoice.period_start), 'dd/MM/yyyy'),
        periodEnd: format(new Date(invoice.period_end), 'dd/MM/yyyy'),
        status: invoice.status === 'paid' ? 'Paid' : invoice.status === 'pending' ? 'Pending' : 'Overdue',
        amount: parseFloat(invoice.amount || 0),
      }));

      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast({
        title: 'Error',
        description: 'Failed to load invoices. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const totalHours = summary.total_hours || 0;
  const totalEarnings = summary.total_earnings || 0;
  const unpaidEarnings = summary.pending_earnings || 0;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Attended':
        return <Badge className="bg-secondary/10 text-secondary dark:text-secondary-light"><CheckCircle2 className="mr-1 h-3 w-3" />Attended</Badge>;
      case 'Student Cancelled':
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400"><XCircle className="mr-1 h-3 w-3" />Cancelled</Badge>;
      case 'Tutor Cancelled':
        return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400"><XCircle className="mr-1 h-3 w-3" />Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'Paid':
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Paid</Badge>;
      case 'Pending':
        return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Pending</Badge>;
      case 'Overdue':
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleExport = () => {
    toast({
      title: "Exporting Data",
      description: "Your hours and earnings report is being generated.",
    });
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.session_id || !newInvoice.period_start || !newInvoice.period_end || !newInvoice.tutor_address) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreatingInvoice(true);
      
      // Find the session to get details
      const session = lessonHours.find(h => h.id === newInvoice.session_id);
      if (!session) {
        toast({
          title: "Error",
          description: "Session not found.",
          variant: "destructive",
        });
        return;
      }

      const invoiceNumber = `TINV-${Date.now().toString().slice(-6)}`;
      
      await tutorApi.createInvoice({
        session_id: parseInt(newInvoice.session_id),
        invoice_number: invoiceNumber,
        issue_date: newInvoice.issue_date,
        period_start: newInvoice.period_start,
        period_end: newInvoice.period_end,
        tutor_address: newInvoice.tutor_address,
        items: [{
          description: `${session.title} - ${session.students.join(', ')}`,
          quantity: session.hours,
          rate: session.earnings / session.hours,
          amount: session.earnings,
        }],
        total_amount: session.earnings,
        notes: newInvoice.notes || undefined,
      });

      toast({
        title: "Invoice Created",
        description: "Your invoice has been generated successfully.",
      });

      // Reset form
      setNewInvoice({
        session_id: '',
        period_start: '',
        period_end: '',
        issue_date: format(new Date(), 'yyyy-MM-dd'),
        tutor_address: '',
        notes: '',
      });
      setIsCreateInvoiceOpen(false);
      
      // Reload invoices
      await loadInvoices();
    } catch (error) {
      console.error('Failed to create invoice:', error);
      toast({
        title: "Error",
        description: "Failed to create invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleDownloadInvoice = async (invoice: TutorInvoice) => {
    try {
      await generateTutorInvoicePDF({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        date: invoice.date,
        periodStart: invoice.periodStart,
        periodEnd: invoice.periodEnd,
        status: invoice.status,
        amount: invoice.amount,
        tutorName: 'Vu Dinh', // This would come from user context in a real app
        tutorAddress: 'Vo One\n16 Tonnyeen St Wetherill Park\nSydney NSW 2164\nAustralia',
        items: [], // Could be populated from lesson hours if needed
        notes: '',
      });
      toast({
        title: "Download Started",
        description: `Invoice ${invoice.invoiceNumber} is being downloaded...`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hours & Payments</h1>
          <p className="text-muted-foreground mt-2">
            Track your work hours, earnings, and invoices
          </p>
        </div>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">This period</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Gross income</p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">${unpaidEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Awaiting payment</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="lessons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lessons">Lesson Hours</TabsTrigger>
          <TabsTrigger value="other">Other Hours</TabsTrigger>
          <TabsTrigger value="compensation">Other Compensation</TabsTrigger>
          <TabsTrigger value="invoices">Tutor Invoices</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Lesson Hours</CardTitle>
                  <CardDescription>Track your teaching hours and earnings for billing</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Who</TableHead>
                      <TableHead>What</TableHead>
                      <TableHead>Start</TableHead>
                      <TableHead>End</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Earnings</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessonHours.length > 0 ? (
                      lessonHours.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell className="font-medium">
                        {entry.isGroupClass ? (
                          <div className="space-y-1">
                            {entry.students.map((student, idx) => (
                              <div key={idx} className="text-sm">{student}</div>
                            ))}
                          </div>
                        ) : (
                          entry.students[0] || entry.title
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{entry.title}</TableCell>
                      <TableCell>{entry.start}</TableCell>
                      <TableCell>{entry.end}</TableCell>
                      <TableCell className="text-right">{entry.hours.toFixed(1)}</TableCell>
                      <TableCell className="text-right">${entry.earnings.toFixed(2)}</TableCell>
                      <TableCell>
                        {entry.paid ? (
                          <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            // Generate invoice for this lesson hour entry
                            await generateTutorInvoicePDF({
                              id: entry.id,
                              invoiceNumber: `TINV-${Date.now().toString().slice(-6)}`,
                              date: entry.date,
                              periodStart: entry.date,
                              periodEnd: entry.date,
                              status: entry.paid ? 'Paid' : 'Pending',
                              amount: entry.earnings,
                              tutorName: 'Vu Dinh',
                              tutorAddress: 'Vo One\n16 Tonnyeen St Wetherill Park\nSydney NSW 2164\nAustralia',
                              items: [{
                                description: `${entry.title} - ${entry.students.join(', ')}`,
                                quantity: entry.hours,
                                rate: entry.earnings / entry.hours,
                                amount: entry.earnings,
                              }],
                              notes: '',
                            });
                            toast({
                              title: "Download Started",
                              description: `Invoice for ${entry.date} is being downloaded...`,
                            });
                          }}
                          className="hover:bg-primary/5 hover:border-primary/50 transition-colors"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                      </TableCell>
                      </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No lesson hours recorded for this period
                        </TableCell>
                      </TableRow>
                    )}
                    {lessonHours.length > 0 && (
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell colSpan={6}>Totals</TableCell>
                        <TableCell className="text-right">{totalHours.toFixed(1)}</TableCell>
                        <TableCell className="text-right">${totalEarnings.toFixed(2)}</TableCell>
                        <TableCell></TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="other" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Other Hours</CardTitle>
              <CardDescription>Track non-lesson work hours such as prep time, meetings, or administrative tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No other hours recorded for this period</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compensation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Other Compensation</CardTitle>
              <CardDescription>Bonuses, reimbursements, and other payments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No other compensation recorded for this period</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tutor Invoices</CardTitle>
                  <CardDescription>View and manage your invoices</CardDescription>
                </div>
                <Dialog open={isCreateInvoiceOpen} onOpenChange={setIsCreateInvoiceOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Invoice</DialogTitle>
                      <DialogDescription>
                        Generate an invoice for the selected period
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="session_id">Session *</Label>
                        <Select value={newInvoice.session_id} onValueChange={(value) => setNewInvoice(prev => ({ ...prev, session_id: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a session" />
                          </SelectTrigger>
                          <SelectContent>
                            {lessonHours.map((hour) => (
                              <SelectItem key={hour.id} value={hour.id}>
                                {hour.date} - {hour.title} ({hour.students.join(', ')})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="issue_date">Issue Date *</Label>
                        <Input 
                          id="issue_date" 
                          type="date" 
                          value={newInvoice.issue_date}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, issue_date: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="period-start">Period Start *</Label>
                        <Input 
                          id="period-start" 
                          type="date" 
                          value={newInvoice.period_start}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, period_start: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="period-end">Period End *</Label>
                        <Input 
                          id="period-end" 
                          type="date" 
                          value={newInvoice.period_end}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, period_end: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tutor_address">Tutor Address *</Label>
                        <Textarea 
                          id="tutor_address" 
                          placeholder="Enter your address..."
                          value={newInvoice.tutor_address}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, tutor_address: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea 
                          id="notes" 
                          placeholder="Add any additional notes..."
                          value={newInvoice.notes}
                          onChange={(e) => setNewInvoice(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateInvoice} disabled={isCreatingInvoice}>
                        {isCreatingInvoice ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Invoice'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingInvoices ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Period Start</TableHead>
                      <TableHead>Period End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.length > 0 ? (
                      invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.date}</TableCell>
                      <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.periodStart}</TableCell>
                      <TableCell>{invoice.periodEnd}</TableCell>
                      <TableCell>{getInvoiceStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right font-medium">${invoice.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDownloadInvoice(invoice)}
                          title="Download Invoice"
                          className="hover:bg-primary/5 hover:border-primary/50 transition-colors"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          <span className="hidden sm:inline">Download</span>
                        </Button>
                      </TableCell>
                      </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No invoices found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
