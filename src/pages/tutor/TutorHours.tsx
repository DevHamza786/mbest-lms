import { useState } from 'react';
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
import { Clock, DollarSign, FileText, Download, Plus, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { generateTutorInvoicePDF } from '@/lib/utils/invoicePdf';

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

  const [lessonHours] = useState<LessonHour[]>([
    { id: '1', date: '01/11/2025', title: 'Alcatraz', students: ['Xavier Dean'], status: 'Attended', start: '01:00 PM', end: '02:30 PM', hours: 1.5, earnings: 67.50, paid: true, isGroupClass: false },
    { id: '2', date: '05/11/2025', title: 'WWW.P', students: ['Sampaguita Anoa'], status: 'Attended', start: '04:00 PM', end: '05:00 PM', hours: 1.0, earnings: 40.00, paid: true, isGroupClass: false },
    { id: '3', date: '05/11/2025', title: 'WWW.P', students: ['Rostov Percy'], status: 'Attended', start: '07:30 PM', end: '08:30 PM', hours: 1.0, earnings: 40.00, paid: true, isGroupClass: false },
    { id: '4', date: '07/11/2025', title: 'Other', students: ['Xavier Dean'], status: 'Attended', start: '04:30 PM', end: '05:30 PM', hours: 1.0, earnings: 40.00, paid: true, isGroupClass: false },
    { id: '5', date: '06/11/2025', title: 'Alcatraz', students: ['Sampaguita Anoa', 'Ethan Sutton'], status: 'Attended', start: '07:30 PM', end: '08:30 PM', hours: 1.0, earnings: 40.00, paid: true, isGroupClass: true },
    { id: '6', date: '10/11/2025', title: 'WWW.P', students: ['Sampaguita Anoa', 'Sophia Song'], status: 'Attended', start: '07:30 PM', end: '08:30 PM', hours: 1.0, earnings: 40.00, paid: true, isGroupClass: true },
  ]);

  const [invoices] = useState<TutorInvoice[]>([
    { id: '1', invoiceNumber: 'TINV-0016', date: '01/11/2025', periodStart: '27/10/2025', periodEnd: '01/11/2025', status: 'Paid', amount: 430.00 },
    { id: '2', invoiceNumber: 'TINV-0015', date: '20/10/2025', periodStart: '20/10/2025', periodEnd: '26/10/2025', status: 'Paid', amount: 315.00 },
    { id: '3', invoiceNumber: 'TINV-0014', date: '19/10/2025', periodStart: '13/10/2025', periodEnd: '19/10/2025', status: 'Paid', amount: 180.00 },
    { id: '4', invoiceNumber: 'TINV-0013', date: '11/10/2025', periodStart: '30/09/2025', periodEnd: '13/10/2025', status: 'Paid', amount: 202.50 },
  ]);

  const totalHours = lessonHours.reduce((sum, entry) => sum + entry.hours, 0);
  const totalEarnings = lessonHours.reduce((sum, entry) => sum + entry.earnings, 0);
  const unpaidEarnings = lessonHours.filter(entry => !entry.paid).reduce((sum, entry) => sum + entry.earnings, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Attended':
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400"><CheckCircle2 className="mr-1 h-3 w-3" />Attended</Badge>;
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

  const handleCreateInvoice = () => {
    toast({
      title: "Invoice Created",
      description: "Your invoice has been generated successfully.",
    });
    setIsCreateInvoiceOpen(false);
  };

  const handleDownloadInvoice = (invoice: TutorInvoice) => {
    try {
      generateTutorInvoicePDF({
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
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Gross income</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${unpaidEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
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
                  {lessonHours.map((entry) => (
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
                          onClick={() => {
                            // Generate invoice for this lesson hour entry
                            generateTutorInvoicePDF({
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
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell colSpan={6}>Totals</TableCell>
                    <TableCell className="text-right">{totalHours.toFixed(1)}</TableCell>
                    <TableCell className="text-right">${totalEarnings.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
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
                        <Label htmlFor="period-start">Period Start</Label>
                        <Input id="period-start" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="period-end">Period End</Label>
                        <Input id="period-end" type="date" />
                      </div>
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea id="notes" placeholder="Add any additional notes..." />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateInvoiceOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateInvoice}>Create Invoice</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
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
                  {invoices.map((invoice) => (
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
