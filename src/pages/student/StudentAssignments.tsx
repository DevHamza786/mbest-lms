import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, Calendar, CheckCircle, AlertCircle, Loader2, Search, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useNavigate } from 'react-router-dom';
import { AskQuestionModal } from '@/components/modals/AskQuestionModal';
import { AssignmentDetailsModal } from '@/components/modals/AssignmentDetailsModal';
import { SubmitAssignmentModal } from '@/components/modals/SubmitAssignmentModal';
import { ViewSubmissionModal } from '@/components/modals/ViewSubmissionModal';
import { useToast } from '@/hooks/use-toast';
import { studentApi } from '@/lib/api';

const StudentAssignments = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [allPendingAssignments, setAllPendingAssignments] = useState<any[]>([]);
  const [allCompletedAssignments, setAllCompletedAssignments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const itemsPerPage = 6;
  const [questionModal, setQuestionModal] = useState<{ isOpen: boolean; assignment: any }>({
    isOpen: false,
    assignment: null,
  });
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; assignment: any }>({
    isOpen: false,
    assignment: null,
  });
  const [submitModal, setSubmitModal] = useState<{ isOpen: boolean; assignment: any; submission?: any }>({
    isOpen: false,
    assignment: null,
    submission: null,
  });
  const [viewSubmissionModal, setViewSubmissionModal] = useState<{ isOpen: boolean; assignment: any; submission: any }>({
    isOpen: false,
    assignment: null,
    submission: null,
  });

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setIsLoading(true);
        // Load all assignments (both pending and completed)
        const allAssignments = await studentApi.getAssignments({ per_page: 100 });
        
        // Separate into pending (not submitted or submitted but not graded) and completed (graded)
        const pending = allAssignments.filter(a => {
          const submission = a.submissions?.[0];
          // Pending if no submission or submission exists but not graded
          return !submission || !submission.grade;
        });
        
        const completed = allAssignments.filter(a => {
          const submission = a.submissions?.[0];
          // Completed if has submission with grade
          return submission && submission.grade !== null && submission.grade !== undefined;
        });
        
        // Sort pending assignments by due date (nearest first)
        const sortedPending = [...pending].sort((a, b) => {
          const dateA = new Date(a.due_date).getTime();
          const dateB = new Date(b.due_date).getTime();
          return dateA - dateB;
        });
        
        // Sort completed assignments by submission date (newest first)
        const sortedCompleted = [...completed].sort((a, b) => {
          const subA = a.submissions?.[0]?.submitted_at;
          const subB = b.submissions?.[0]?.submitted_at;
          if (!subA) return 1;
          if (!subB) return -1;
          return new Date(subB).getTime() - new Date(subA).getTime();
        });
        
        setAllPendingAssignments(sortedPending);
        setAllCompletedAssignments(sortedCompleted);
      } catch (error) {
        console.error('Failed to load assignments:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assignments',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignments();
  }, [toast]);

  // Get unique classes for filter
  const uniqueClasses = Array.from(
    new Set([
      ...allPendingAssignments.map(a => a.classModel?.name || a.class_model?.name || a.class?.name).filter(Boolean),
      ...allCompletedAssignments.map(a => a.classModel?.name || a.class_model?.name || a.class?.name).filter(Boolean),
    ])
  );

  // Filter and paginate pending assignments
  useEffect(() => {
    let filtered = allPendingAssignments;

    if (searchQuery.trim()) {
      filtered = filtered.filter((assignment) =>
        assignment.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assignment.classModel?.name || assignment.class_model?.name || assignment.class?.name)?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (classFilter !== 'all') {
      filtered = filtered.filter((assignment) =>
        (assignment.classModel?.name || assignment.class_model?.name || assignment.class?.name) === classFilter
      );
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setAssignments(filtered.slice(startIndex, endIndex));
  }, [allPendingAssignments, searchQuery, classFilter, currentPage]);

  // Filter and paginate completed assignments
  useEffect(() => {
    let filtered = allCompletedAssignments;

    if (searchQuery.trim()) {
      filtered = filtered.filter((assignment) =>
        assignment.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (assignment.classModel?.name || assignment.class_model?.name || assignment.class?.name)?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (classFilter !== 'all') {
      filtered = filtered.filter((assignment) =>
        (assignment.classModel?.name || assignment.class_model?.name || assignment.class?.name) === classFilter
      );
    }

    const startIndex = (completedPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setCompletedAssignments(filtered.slice(startIndex, endIndex));
  }, [allCompletedAssignments, searchQuery, classFilter, completedPage]);

  // Reset pages when filters change
  useEffect(() => {
    setCurrentPage(1);
    setCompletedPage(1);
  }, [searchQuery, classFilter]);

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriority = (daysUntilDue: number) => {
    if (daysUntilDue < 0) return 'high';
    if (daysUntilDue <= 2) return 'high';
    if (daysUntilDue <= 7) return 'medium';
    return 'low';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getGradeColor = (grade: number, maxPoints: number) => {
    const percentage = (grade / maxPoints) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleMarkAsComplete = async (assignmentId: number) => {
    try {
      toast({
        title: "Assignment Marked as Complete",
        description: "The assignment has been marked as complete.",
      });
      // Reload assignments to update the list
      const allAssignments = await studentApi.getAssignments({ per_page: 100 });
      const pending = allAssignments.filter(a => {
        const submission = a.submissions?.[0];
        return !submission || !submission.grade;
      });
      const completed = allAssignments.filter(a => {
        const submission = a.submissions?.[0];
        return submission && submission.grade !== null && submission.grade !== undefined;
      });
      const sortedPending = [...pending].sort((a, b) => {
        const dateA = new Date(a.due_date).getTime();
        const dateB = new Date(b.due_date).getTime();
        return dateA - dateB;
      });
      const sortedCompleted = [...completed].sort((a, b) => {
        const subA = a.submissions?.[0]?.submitted_at;
        const subB = b.submissions?.[0]?.submitted_at;
        if (!subA) return 1;
        if (!subB) return -1;
        return new Date(subB).getTime() - new Date(subA).getTime();
      });
      setAllPendingAssignments(sortedPending);
      setAllCompletedAssignments(sortedCompleted);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark assignment as complete",
        variant: "destructive",
      });
    }
  };

  const pendingCount = allPendingAssignments.filter(a => {
    if (searchQuery.trim()) {
      const matches = a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.classModel?.name || a.class_model?.name || a.class?.name)?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matches) return false;
    }
    if (classFilter !== 'all') {
      if ((a.classModel?.name || a.class_model?.name || a.class?.name) !== classFilter) return false;
    }
    return true;
  }).length;

  const completedCount = allCompletedAssignments.filter(a => {
    if (searchQuery.trim()) {
      const matches = a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.classModel?.name || a.class_model?.name || a.class?.name)?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matches) return false;
    }
    if (classFilter !== 'all') {
      if ((a.classModel?.name || a.class_model?.name || a.class?.name) !== classFilter) return false;
    }
    return true;
  }).length;

  const totalPending = allPendingAssignments.length;
  const totalCompleted = allCompletedAssignments.length;
  const avgGrade = completedCount > 0
    ? Math.round(
        allCompletedAssignments
          .filter(a => {
            if (searchQuery.trim()) {
              const matches = a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.classModel?.name || a.class_model?.name || a.class?.name)?.toLowerCase().includes(searchQuery.toLowerCase());
              if (!matches) return false;
            }
            if (classFilter !== 'all') {
              if ((a.classModel?.name || a.class_model?.name || a.class?.name) !== classFilter) return false;
            }
            return true;
          })
          .reduce((sum, a) => {
            const submission = a.submissions?.[0];
            const grade = submission?.grade || 0;
            return sum + (grade / a.max_points * 100);
          }, 0) / completedCount
      )
    : 0;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            Track your pending and completed assignments
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/student/questions')}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          View Questions & Answers
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              {allPendingAssignments.filter(a => getDaysUntilDue(a.due_date) <= 7).length} due this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgGrade}%</div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments by title, description, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {uniqueClasses.map((className) => (
              <SelectItem key={className} value={className}>
                {className}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : assignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No pending assignments.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => {
                const daysUntilDue = getDaysUntilDue(assignment.due_date);
                const priority = getPriority(daysUntilDue);
                const submission = assignment.submissions?.[0];
                const isSubmitted = !!submission;
                const isPastDue = daysUntilDue < 0;
                const canEdit = isSubmitted && !isPastDue;
                return (
                  <Card key={assignment.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            {assignment.title}
                          </CardTitle>
                          <CardDescription>
                            {(assignment.classModel?.name || assignment.class_model?.name || assignment.class?.name || 'N/A')} • {assignment.tutor?.user?.name || assignment.tutor?.name || 'Tutor'}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSubmitted && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Submitted
                            </Badge>
                          )}
                          <Badge variant={getPriorityColor(priority)}>
                            {priority} priority
                          </Badge>
                          {daysUntilDue <= 2 && !isSubmitted && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Due soon
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {assignment.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Due: {new Date(assignment.due_date).toLocaleDateString()}</span>
                          </div>
                          <div>
                            <span className="font-medium">Points: {assignment.max_points}</span>
                          </div>
                          <div>
                            <span className={`font-medium ${daysUntilDue <= 2 ? 'text-red-600' : daysUntilDue <= 7 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {daysUntilDue === 0 ? 'Due today' : 
                               daysUntilDue === 1 ? 'Due tomorrow' :
                               daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                               `${daysUntilDue} days left`}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {!isSubmitted ? (
                          <Button size="sm" onClick={() => setSubmitModal({ isOpen: true, assignment })}>
                            Submit Assignment
                          </Button>
                        ) : (
                          <>
                            <Button variant="outline" size="sm" onClick={() => setViewSubmissionModal({ isOpen: true, assignment, submission })}>
                              View Submission
                            </Button>
                            {canEdit && (
                              <Button size="sm" variant="secondary" onClick={() => setSubmitModal({ isOpen: true, assignment, submission })}>
                                Edit Submission
                              </Button>
                            )}
                            {isPastDue && !submission?.grade && (
                              <Button size="sm" variant="default" onClick={() => handleMarkAsComplete(assignment.id)}>
                                Mark as Complete
                              </Button>
                            )}
                          </>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setDetailsModal({ isOpen: true, assignment })}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setQuestionModal({ isOpen: true, assignment: assignment })}>
                          Ask Question
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/student/questions', { state: { assignmentId: assignment.id } })}>
                          View Q&A Thread
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination for Pending */}
          {Math.ceil(pendingCount / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, pendingCount)} of {pendingCount} assignments
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm">
                  Page {currentPage} of {Math.ceil(pendingCount / itemsPerPage)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(pendingCount / itemsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(pendingCount / itemsPerPage) || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : completedAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No completed assignments.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {completedAssignments.map((assignment) => {
                const submission = assignment.submissions?.[0];
                const grade = submission?.grade;
                const feedback = submission?.feedback;
                const daysUntilDue = getDaysUntilDue(assignment.due_date);
                const isPastDue = daysUntilDue < 0;
                return (
                  <Card key={assignment.id} className="overflow-hidden">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            {assignment.title}
                          </CardTitle>
                          <CardDescription>
                            {(assignment.classModel?.name || assignment.class_model?.name || assignment.class?.name || 'N/A')} • {assignment.tutor?.user?.name || assignment.tutor?.name || 'Tutor'}
                          </CardDescription>
                        </div>
                        {grade !== undefined && grade !== null && (
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${getGradeColor(grade, assignment.max_points)}`}>
                              {grade}/{assignment.max_points}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {Math.round((grade / assignment.max_points) * 100)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {assignment.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Submitted: {submission?.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>

                      {feedback && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm font-medium mb-1">Tutor Feedback:</p>
                          <p className="text-sm text-muted-foreground">{feedback}</p>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => setViewSubmissionModal({ isOpen: true, assignment, submission })}>
                          View Submission
                        </Button>
                        {!isPastDue && submission && (
                          <Button size="sm" variant="secondary" onClick={() => setSubmitModal({ isOpen: true, assignment, submission })}>
                            Edit Submission
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => setDetailsModal({ isOpen: true, assignment })}>
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setQuestionModal({ isOpen: true, assignment: assignment })}>
                          Ask Question
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => navigate('/student/questions', { state: { assignmentId: assignment.id } })}>
                          View Q&A Thread
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination for Completed */}
          {Math.ceil(completedCount / itemsPerPage) > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(completedPage - 1) * itemsPerPage + 1} to {Math.min(completedPage * itemsPerPage, completedCount)} of {completedCount} assignments
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompletedPage(prev => Math.max(1, prev - 1))}
                  disabled={completedPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="text-sm">
                  Page {completedPage} of {Math.ceil(completedCount / itemsPerPage)}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompletedPage(prev => Math.min(Math.ceil(completedCount / itemsPerPage), prev + 1))}
                  disabled={completedPage >= Math.ceil(completedCount / itemsPerPage) || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <AskQuestionModal
        isOpen={questionModal.isOpen}
        onClose={() => setQuestionModal({ isOpen: false, assignment: null })}
        assignment={questionModal.assignment}
        assignmentTitle={questionModal.assignment?.title}
        className={questionModal.assignment?.classModel?.name || questionModal.assignment?.class_model?.name || questionModal.assignment?.class?.name}
      />
      
      <AssignmentDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, assignment: null })}
        assignment={detailsModal.assignment}
        onEditSubmission={(assignment, submission) => {
          setSubmitModal({ isOpen: true, assignment, submission });
        }}
        onViewSubmission={(assignment, submission) => {
          setViewSubmissionModal({ isOpen: true, assignment, submission });
        }}
      />
      
      <SubmitAssignmentModal
        isOpen={submitModal.isOpen}
        onClose={() => setSubmitModal({ isOpen: false, assignment: null, submission: null })}
        assignment={submitModal.assignment}
        submission={submitModal.submission}
      />
      <ViewSubmissionModal
        isOpen={viewSubmissionModal.isOpen}
        onClose={() => setViewSubmissionModal({ isOpen: false, assignment: null, submission: null })}
        assignment={viewSubmissionModal.assignment}
        submission={viewSubmissionModal.submission}
      />
    </div>
  );
};

export default StudentAssignments;