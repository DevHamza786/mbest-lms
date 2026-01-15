import { useState, useEffect } from 'react';
import { X, FileText, Calendar, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { tutorApi } from '@/lib/api';
import { format } from 'date-fns';

interface StudentAssignmentsModalProps {
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StudentAssignmentsModal({ studentId, studentName, isOpen, onClose }: StudentAssignmentsModalProps) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      loadAssignments();
    }
  }, [isOpen, studentId]);

  const loadAssignments = async () => {
    try {
      setIsLoading(true);
      const data = await tutorApi.getStudentAssignments(Number(studentId));
      console.log('StudentAssignmentsModal - Loaded assignments:', data);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load assignments:', error);
      setAssignments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (assignment: any) => {
    const submission = assignment.submission;
    
    if (!submission) {
      const dueDate = assignment.due_date ? new Date(assignment.due_date) : null;
      const isOverdue = dueDate && dueDate < new Date();
      
      if (isOverdue) {
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">Overdue</Badge>;
      }
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">Pending</Badge>;
    }
    
    if (submission.status === 'submitted') {
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">Submitted</Badge>;
    }
    
    if (submission.status === 'graded') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Graded</Badge>;
    }
    
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">{submission.status}</Badge>;
  };

  const getStatusIcon = (assignment: any) => {
    const submission = assignment.submission;
    
    if (!submission) {
      return <Clock className="h-4 w-4 text-yellow-600" />;
    }
    
    if (submission.status === 'graded') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    if (submission.status === 'submitted') {
      return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
    
    return <AlertCircle className="h-4 w-4 text-gray-600" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignments - {studentName}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No assignments found for this student.
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>All Assignments ({assignments.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Assignment</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Grade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assignments.map((assignment: any) => (
                          <TableRow key={assignment.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(assignment)}
                                {assignment.title || 'Untitled Assignment'}
                              </div>
                              {assignment.description && (
                                <div className="text-sm text-muted-foreground mt-1">
                                  {assignment.description.substring(0, 50)}
                                  {assignment.description.length > 50 ? '...' : ''}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              {assignment.class_model?.name || assignment.class?.name || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {assignment.due_date
                                  ? format(new Date(assignment.due_date), 'MMM dd, yyyy')
                                  : 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(assignment)}
                            </TableCell>
                            <TableCell>
                              {assignment.submission?.grade ? (
                                <span className="font-medium">
                                  {assignment.submission.grade} / {assignment.max_points || 100}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

