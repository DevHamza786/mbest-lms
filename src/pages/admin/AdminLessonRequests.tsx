import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle2, XCircle, Loader2, Calendar } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';

interface LessonRequestRow {
  id: string | number;
  studentName: string;
  parentName: string;
  tutorName: string;
  lessonType: string;
  preferredDate: string;
  preferredTime: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'declined';
}

export default function AdminLessonRequests() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<LessonRequestRow[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getLessonRequests({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        per_page: 50,
      });
      setRequests(
        data.map((item: any) => ({
          id: item.id,
          studentName: item.student_name || 'Unknown Student',
          parentName: item.parent_name || 'Unknown Parent',
          tutorName: item.tutor_name || 'Unknown Tutor',
          lessonType: item.lesson_type || 'N/A',
          preferredDate: item.preferred_date || 'N/A',
          preferredTime: item.preferred_time || 'N/A',
          requestedAt: item.requested_at || '',
          status: item.status || 'pending',
        }))
      );
    } catch (error) {
      console.error('Failed to load lesson requests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load lesson requests. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'declined':
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400"><XCircle className="mr-1 h-3 w-3" />Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson Requests</h1>
          <p className="text-muted-foreground mt-2">
            Monitor lesson requests parents send to tutors. Approving or declining is a tutor action.
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="default" className="text-base px-4 py-2">
            {pendingCount} Pending
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="declined">Declined</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="text-center py-12">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading lesson requests...</p>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Lesson Requests</h3>
            <p className="text-muted-foreground">No lesson requests match this filter</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Requests</CardTitle>
            <CardDescription>Across all tutors</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Lesson Type</TableHead>
                  <TableHead>Preferred Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.studentName}</TableCell>
                    <TableCell className="text-muted-foreground">{request.parentName}</TableCell>
                    <TableCell className="text-muted-foreground">{request.tutorName}</TableCell>
                    <TableCell>{request.lessonType}</TableCell>
                    <TableCell>{request.preferredDate}</TableCell>
                    <TableCell>{request.preferredTime}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
