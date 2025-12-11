import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Clock, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { AskQuestionModal } from '@/components/modals/AskQuestionModal';
import { AssignmentDetailsModal } from '@/components/modals/AssignmentDetailsModal';
import { SubmitAssignmentModal } from '@/components/modals/SubmitAssignmentModal';
import { useToast } from '@/hooks/use-toast';

const StudentAssignments = () => {
  const { toast } = useToast();
  const [questionModal, setQuestionModal] = useState<{ isOpen: boolean; assignment: any }>({
    isOpen: false,
    assignment: null,
  });
  const [detailsModal, setDetailsModal] = useState<{ isOpen: boolean; assignment: any }>({
    isOpen: false,
    assignment: null,
  });
  const [submitModal, setSubmitModal] = useState<{ isOpen: boolean; assignment: any }>({
    isOpen: false,
    assignment: null,
  });
  const assignments = [
    {
      id: "1",
      title: "Calculus Problem Set #3",
      description: "Complete exercises 1-20 from Chapter 5: Integration Techniques",
      class: "Advanced Mathematics",
      tutor: "Mr. Smith",
      dueDate: "2024-01-25",
      maxPoints: 100,
      status: "pending",
      submissionType: "file",
      priority: "high"
    },
    {
      id: "2",
      title: "Physics Lab Report",
      description: "Write a comprehensive report on the pendulum experiment",
      class: "Physics Fundamentals", 
      tutor: "Dr. Johnson",
      dueDate: "2024-01-28",
      maxPoints: 75,
      status: "pending",
      submissionType: "file",
      priority: "medium"
    },
    {
      id: "3",
      title: "Literature Essay",
      description: "Analyze the themes in Shakespeare's Hamlet (1500 words)",
      class: "English Literature",
      tutor: "Ms. Williams", 
      dueDate: "2024-01-30",
      maxPoints: 150,
      status: "pending",
      submissionType: "text",
      priority: "medium"
    },
    {
      id: "4",
      title: "Programming Project",
      description: "Create a simple calculator using Python",
      class: "Computer Science",
      tutor: "Prof. Davis",
      dueDate: "2024-02-05",
      maxPoints: 200,
      status: "pending", 
      submissionType: "file",
      priority: "low"
    }
  ];

  const completedAssignments = [
    {
      id: "5",
      title: "Algebra Quiz #2", 
      description: "Quadratic equations and functions",
      class: "Advanced Mathematics",
      tutor: "Mr. Smith",
      submittedDate: "2024-01-15",
      maxPoints: 50,
      grade: 46,
      feedback: "Excellent work! Minor calculation error in question 3.",
      status: "graded"
    },
    {
      id: "6",
      title: "Newton's Laws Assignment",
      description: "Practical applications of Newton's three laws",
      class: "Physics Fundamentals",
      tutor: "Dr. Johnson", 
      submittedDate: "2024-01-12",
      maxPoints: 100,
      grade: 85,
      feedback: "Good understanding shown. Work on diagram clarity.",
      status: "graded"
    },
    {
      id: "7",
      title: "Poetry Analysis",
      description: "Robert Frost poetry interpretation",
      class: "English Literature",
      tutor: "Ms. Williams",
      submittedDate: "2024-01-10",
      maxPoints: 100,
      grade: 92,
      feedback: "Insightful analysis with strong textual evidence.",
      status: "graded"
    }
  ];

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            Track your pending and completed assignments
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({assignments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <div className="grid gap-4">
            {assignments.map((assignment) => {
              const daysUntilDue = getDaysUntilDue(assignment.dueDate);
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
                          {assignment.class} • {assignment.tutor}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(assignment.priority)}>
                          {assignment.priority} priority
                        </Badge>
                        {daysUntilDue <= 2 && (
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
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          <span className="font-medium">Points: {assignment.maxPoints}</span>
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

                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setSubmitModal({ isOpen: true, assignment })}>
                        Submit Assignment
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setDetailsModal({ isOpen: true, assignment })}>
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setQuestionModal({ isOpen: true, assignment })}>
                        Ask Question
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {completedAssignments.map((assignment) => (
              <Card key={assignment.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        {assignment.title}
                      </CardTitle>
                      <CardDescription>
                        {assignment.class} • {assignment.tutor}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getGradeColor(assignment.grade, assignment.maxPoints)}`}>
                        {assignment.grade}/{assignment.maxPoints}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((assignment.grade / assignment.maxPoints) * 100)}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {assignment.description}
                  </p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>Submitted: {new Date(assignment.submittedDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {assignment.feedback && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-1">Tutor Feedback:</p>
                      <p className="text-sm text-muted-foreground">{assignment.feedback}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast({ title: "Viewing Submission", description: `Opening submission for ${assignment.title}...` })}>
                      View Submission
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments.length}</div>
            <p className="text-xs text-muted-foreground">
              {assignments.filter(a => getDaysUntilDue(a.dueDate) <= 7).length} due this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedAssignments.length}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                completedAssignments.reduce((sum, a) => sum + (a.grade / a.maxPoints * 100), 0) / completedAssignments.length
              )}%
            </div>
            <p className="text-xs text-muted-foreground">Across all subjects</p>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <AskQuestionModal
        isOpen={questionModal.isOpen}
        onClose={() => setQuestionModal({ isOpen: false, assignment: null })}
        assignmentTitle={questionModal.assignment?.title}
        className={questionModal.assignment?.class}
      />
      
      <AssignmentDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, assignment: null })}
        assignment={detailsModal.assignment}
      />
      
      <SubmitAssignmentModal
        isOpen={submitModal.isOpen}
        onClose={() => setSubmitModal({ isOpen: false, assignment: null })}
        assignment={submitModal.assignment}
      />
    </div>
  );
};

export default StudentAssignments;