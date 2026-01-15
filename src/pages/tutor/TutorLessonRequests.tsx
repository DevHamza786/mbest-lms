import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Clock, User, Calendar, CheckCircle2, XCircle, Info, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { tutorApi } from '@/lib/api';
import { format } from 'date-fns';

interface LessonRequest {
  id: string | number;
  studentName: string;
  parentName: string;
  lessonType: string;
  preferredDate: string;
  preferredTime: string;
  duration: string;
  message: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'declined';
}

export default function TutorLessonRequests() {
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<LessonRequest | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load lesson requests on mount
  useEffect(() => {
    loadLessonRequests();
  }, []);

  const loadLessonRequests = async () => {
    try {
      setIsLoading(true);
      const data = await tutorApi.getLessonRequests();
      
      // Map API response to component's LessonRequest format
      // Note: This mapping depends on the actual API response structure
      // Adjust these mappings based on your backend response
      const mappedRequests: LessonRequest[] = data.map((item: any) => {
        // Helper function to safely format date
        const formatDate = (dateString: string | null | undefined, formatStr: string): string => {
          if (!dateString) return 'N/A';
          const date = new Date(dateString);
          if (isNaN(date.getTime())) return 'N/A';
          try {
            return format(date, formatStr);
          } catch (error) {
            return 'N/A';
          }
        };

        // Get preferred date with fallback
        let preferredDate = item.preferred_date || item.date;
        if (!preferredDate && item.created_at) {
          preferredDate = formatDate(item.created_at, 'yyyy-MM-dd');
        }
        if (!preferredDate) {
          preferredDate = 'N/A';
        }

        // Get requested at date
        const requestedAt = item.requested_at || item.created_at 
          ? formatDate(item.requested_at || item.created_at, 'yyyy-MM-dd hh:mm a')
          : 'N/A';

        // Parse message - if body contains JSON, extract the message field
        let messageText = item.message || item.body || item.description || '';
        if (messageText) {
          try {
            // Try to parse as JSON
            const parsed = JSON.parse(messageText);
            if (typeof parsed === 'object' && parsed !== null && parsed.message) {
              // If it's a JSON object with a message field, use that
              messageText = parsed.message;
            }
          } catch (e) {
            // If parsing fails, it's not JSON, use the original text
            // messageText remains unchanged
          }
        }

        return {
          id: item.id || item.request_id,
          studentName: item.student_name || item.student?.name || 'Unknown Student',
          parentName: item.parent_name || item.parent?.name || item.sender?.name || 'Unknown Parent',
          lessonType: item.lesson_type || item.subject || item.lesson_subject || 'N/A',
          preferredDate: preferredDate,
          preferredTime: item.preferred_time || item.time || item.start_time || 'N/A',
          duration: item.duration || (item.duration_hours ? `${item.duration_hours} hours` : 'N/A'),
          message: messageText,
          requestedAt: requestedAt,
          status: item.status || 'pending',
        };
      });

      setRequests(mappedRequests);
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

  const handleViewDetails = (request: LessonRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleApprove = async (requestId: string | number) => {
    try {
      await tutorApi.approveLessonRequest(Number(requestId));
      
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'approved' as const } : req
      ));
      
      toast({
        title: "Request Approved",
        description: "The lesson request has been approved and the family has been notified.",
      });
      setIsDetailsOpen(false);
      
      // Reload requests to get updated data
      loadLessonRequests();
    } catch (error) {
      console.error('Failed to approve lesson request:', error);
      toast({
        title: "Error",
        description: "Failed to approve lesson request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (requestId: string | number) => {
    try {
      await tutorApi.declineLessonRequest(Number(requestId));
      
      setRequests(requests.map(req => 
        req.id === requestId ? { ...req, status: 'declined' as const } : req
      ));
      
      toast({
        title: "Request Declined",
        description: "The lesson request has been declined.",
        variant: "destructive",
      });
      setIsDetailsOpen(false);
      
      // Reload requests to get updated data
      loadLessonRequests();
    } catch (error) {
      console.error('Failed to decline lesson request:', error);
      toast({
        title: "Error",
        description: "Failed to decline lesson request. Please try again.",
        variant: "destructive",
      });
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

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lesson Requests</h1>
          <p className="text-muted-foreground mt-2">
            Review and manage incoming lesson requests from families
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="default" className="text-base px-4 py-2">
            {pendingCount} Pending
          </Badge>
        )}
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
            <p className="text-muted-foreground">
              You don't have any lesson requests at the moment
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Incoming Requests</CardTitle>
            <CardDescription>
              Review details and respond to lesson requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Lesson Type</TableHead>
                  <TableHead>Preferred Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.studentName}</TableCell>
                    <TableCell className="text-muted-foreground">{request.parentName}</TableCell>
                    <TableCell>{request.lessonType}</TableCell>
                    <TableCell>{request.preferredDate}</TableCell>
                    <TableCell>{request.preferredTime}</TableCell>
                    <TableCell>{request.duration}</TableCell>
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Info className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Request Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Lesson Request Details</DialogTitle>
            <DialogDescription>
              Review the complete information and respond to this request
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Student</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.studentName}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Parent</Label>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.parentName}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Lesson Type</Label>
                <p>{selectedRequest.lessonType}</p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preferred Date</Label>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.preferredDate}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Time</Label>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRequest.preferredTime}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Duration</Label>
                  <span>{selectedRequest.duration}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Message from Parent</Label>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-sm">{selectedRequest.message}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Requested At</Label>
                <p className="text-sm text-muted-foreground">{selectedRequest.requestedAt}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-2">
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>
            </div>
          )}

          {selectedRequest?.status === 'pending' && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => handleDecline(selectedRequest.id)}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Decline
              </Button>
              <Button
                onClick={() => handleApprove(selectedRequest.id)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Label = ({ className, children, ...props }: any) => (
  <label className={`text-sm font-medium leading-none ${className || ''}`} {...props}>
    {children}
  </label>
);
