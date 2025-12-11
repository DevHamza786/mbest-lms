import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { Clock, User, Calendar, CheckCircle2, XCircle, Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LessonRequest {
  id: string;
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

  const [requests, setRequests] = useState<LessonRequest[]>([
    {
      id: '1',
      studentName: 'Emma Wilson',
      parentName: 'Sarah Wilson',
      lessonType: 'Mathematics - Year 10',
      preferredDate: '2025-01-20',
      preferredTime: '4:00 PM',
      duration: '1.5 hours',
      message: 'Emma needs help with quadratic equations and graphing.',
      requestedAt: '2025-01-15 10:30 AM',
      status: 'pending'
    },
    {
      id: '2',
      studentName: 'James Chen',
      parentName: 'Linda Chen',
      lessonType: 'Physics - Year 11',
      preferredDate: '2025-01-22',
      preferredTime: '2:00 PM',
      duration: '2 hours',
      message: 'Needs assistance with kinematics problems for upcoming test.',
      requestedAt: '2025-01-16 2:15 PM',
      status: 'pending'
    },
  ]);

  const handleViewDetails = (request: LessonRequest) => {
    setSelectedRequest(request);
    setIsDetailsOpen(true);
  };

  const handleApprove = (requestId: string) => {
    setRequests(requests.map(req => 
      req.id === requestId ? { ...req, status: 'approved' as const } : req
    ));
    toast({
      title: "Request Approved",
      description: "The lesson request has been approved and the family has been notified.",
    });
    setIsDetailsOpen(false);
  };

  const handleDecline = (requestId: string) => {
    setRequests(requests.map(req => 
      req.id === requestId ? { ...req, status: 'declined' as const } : req
    ));
    toast({
      title: "Request Declined",
      description: "The lesson request has been declined.",
      variant: "destructive",
    });
    setIsDetailsOpen(false);
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

      {requests.length === 0 ? (
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
                {getStatusBadge(selectedRequest.status)}
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
