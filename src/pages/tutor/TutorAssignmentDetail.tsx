import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, Users, Clock, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { tutorApi } from '@/lib/api';

export default function TutorAssignmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [gradeData, setGradeData] = useState({
    grade: 0,
    feedback: '',
  });

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        // The API returns assignment with submissions included
        const assignmentData = await tutorApi.getAssignment(Number(id));
        console.log('Assignment data received:', assignmentData);
        
        // The API response structure: { success: true, data: { ...assignment, submissions: [...] } }
        // So assignmentData is the data object which contains both assignment fields and submissions
        if (assignmentData) {
          setAssignment(assignmentData);
          // Extract submissions from the assignment data
          setSubmissions(assignmentData.submissions || []);
        } else {
          throw new Error('Assignment data is empty');
        }
      } catch (error: any) {
        console.error('Failed to load assignment:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to load assignment details',
          variant: 'destructive',
        });
        // Don't navigate away immediately, let user see the error
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, navigate, toast]);

  const handleGradeSubmission = async () => {
    if (!selectedSubmission || gradeData.grade < 0 || gradeData.grade > (assignment?.max_points || 100)) {
      toast({
        title: 'Invalid Grade',
        description: 'Please enter a valid grade',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsGrading(true);
      await tutorApi.gradeSubmission(selectedSubmission.id, {
        grade: gradeData.grade,
        feedback: gradeData.feedback,
      });
      
      // Reload assignment data to get updated submissions
      const updatedAssignment = await tutorApi.getAssignment(Number(id));
      setAssignment(updatedAssignment);
      setSubmissions(updatedAssignment.submissions || []);
      
      setIsGradeDialogOpen(false);
      setSelectedSubmission(null);
      setGradeData({ grade: 0, feedback: '' });
      
      toast({
        title: 'Success',
        description: 'Submission graded successfully',
      });
    } catch (error) {
      console.error('Failed to grade submission:', error);
      toast({
        title: 'Error',
        description: 'Failed to grade submission',
        variant: 'destructive',
      });
    } finally {
      setIsGrading(false);
    }
  };

  const openGradeDialog = (submission: any) => {
    setSelectedSubmission(submission);
    // Convert grade from string to number if needed
    const gradeValue = submission.grade ? parseFloat(submission.grade) : 0;
    setGradeData({
      grade: gradeValue,
      feedback: submission.feedback || '',
    });
    setIsGradeDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'graded':
        return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="outline" className="bg-green-50 text-green-700">Submitted</Badge>;
      case 'graded':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Graded</Badge>;
      case 'late':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Late</Badge>;
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Assignment not found</p>
            <Button onClick={() => navigate('/tutor/assignments')} className="mt-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Assignments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const submittedCount = submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length;
  const gradedCount = submissions.filter(s => s.status === 'graded').length;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tutor/assignments')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{assignment.title}</h1>
          <p className="text-muted-foreground mt-1">{assignment.description || 'No description provided'}</p>
        </div>
      </div>

      {/* Assignment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-muted-foreground">Due Date</Label>
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>{new Date(assignment.due_date).toLocaleDateString()}</span>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Max Points</Label>
              <div className="flex items-center gap-2 mt-1">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{assignment.max_points} points</span>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Submissions</Label>
              <div className="flex items-center gap-2 mt-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>{submittedCount} / {submissions.length}</span>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Graded</Label>
              <div className="flex items-center gap-2 mt-1">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <span>{gradedCount} / {submissions.length}</span>
              </div>
            </div>
          </div>

          {assignment.class_model && (
            <div>
              <Label className="text-muted-foreground">Class</Label>
              <p className="mt-1 font-medium">{assignment.class_model.name} ({assignment.class_model.code})</p>
            </div>
          )}
          {assignment.instructions && (
            <div>
              <Label className="text-muted-foreground">Instructions</Label>
              <div className="mt-1 text-sm whitespace-pre-line">{assignment.instructions.replace(/\\n/g, '\n')}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
          <CardDescription>
            Review and grade student submissions for this assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <Card key={submission.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">
                            {submission.student?.user?.name || submission.student?.name || 'Unknown Student'}
                          </h3>
                          {getStatusBadge(submission.status)}
                          {submission.grade !== null && submission.grade !== undefined && (
                            <Badge variant="outline" className="ml-2">
                              Grade: {parseFloat(submission.grade).toFixed(2)} / {assignment.max_points}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {submission.submitted_at 
                              ? `Submitted: ${new Date(submission.submitted_at).toLocaleString()}`
                              : 'Not submitted'
                            }
                          </div>
                          {submission.graded_at && (
                            <div className="flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Graded: {new Date(submission.graded_at).toLocaleString()}
                            </div>
                          )}
                        </div>

                        {submission.text_submission && (
                          <div className="mt-3 p-3 bg-muted rounded-lg">
                            <Label className="text-xs text-muted-foreground">Text Submission</Label>
                            <p className="mt-1 text-sm">{submission.text_submission}</p>
                          </div>
                        )}

                        {submission.file_url && (
                          <div className="mt-3">
                            <Label className="text-xs text-muted-foreground">File Submission</Label>
                            <div className="mt-1">
                              <a 
                                href={submission.file_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                <FileText className="h-4 w-4" />
                                View File
                              </a>
                            </div>
                          </div>
                        )}

                        {submission.link_submission && (
                          <div className="mt-3">
                            <Label className="text-xs text-muted-foreground">Link Submission</Label>
                            <div className="mt-1">
                              <a 
                                href={submission.link_submission} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline"
                              >
                                {submission.link_submission}
                              </a>
                            </div>
                          </div>
                        )}

                        {submission.feedback && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                            <Label className="text-xs text-muted-foreground">Feedback</Label>
                            <p className="mt-1 text-sm">{submission.feedback}</p>
                          </div>
                        )}
                      </div>

                      <Button 
                        onClick={() => openGradeDialog(submission)}
                        variant={submission.status === 'graded' ? 'outline' : 'default'}
                        size="sm"
                      >
                        {submission.status === 'graded' ? 'Update Grade' : 'Grade Submission'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Grade Submission - {selectedSubmission?.student?.user?.name || selectedSubmission?.student?.name || 'Student'}
            </DialogTitle>
            <DialogDescription>
              Enter the grade and feedback for this submission
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="grade">Grade (out of {assignment.max_points})</Label>
              <Input
                id="grade"
                type="number"
                min="0"
                max={assignment.max_points}
                value={gradeData.grade}
                onChange={(e) => setGradeData(prev => ({ ...prev, grade: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback">Feedback</Label>
              <Textarea
                id="feedback"
                value={gradeData.feedback}
                onChange={(e) => setGradeData(prev => ({ ...prev, feedback: e.target.value }))}
                placeholder="Provide feedback for the student..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleGradeSubmission} disabled={isGrading}>
              {isGrading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Grading...
                </>
              ) : (
                'Submit Grade'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

