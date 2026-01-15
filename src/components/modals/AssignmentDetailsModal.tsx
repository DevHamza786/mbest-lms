import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, User, Target, Loader2, CheckCircle, Edit, Eye, Download, ExternalLink } from "lucide-react";
import { studentApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AssignmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  onEditSubmission?: (assignment: any, submission: any) => void;
  onViewSubmission?: (assignment: any, submission: any) => void;
}

export const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  isOpen,
  onClose,
  assignment,
  onEditSubmission,
  onViewSubmission
}) => {
  const { toast } = useToast();
  const [fullAssignment, setFullAssignment] = useState<any>(assignment);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && assignment?.id) {
      // Always fetch full assignment details to ensure we have classModel
      loadFullAssignment();
    } else {
      setFullAssignment(assignment);
    }
  }, [isOpen, assignment]);

  const loadFullAssignment = async () => {
    if (!assignment?.id) return;
    
    try {
      setIsLoading(true);
      const fullData = await studentApi.getAssignment(assignment.id);
      console.log('Full assignment data:', fullData);
      console.log('Class Model:', fullData.classModel);
      console.log('Class:', fullData.class);
      setFullAssignment(fullData);
    } catch (error) {
      console.error('Failed to load assignment details:', error);
      // Keep using the original assignment data
      setFullAssignment(assignment);
    } finally {
      setIsLoading(false);
    }
  };

  if (!assignment) return null;

  const getDaysUntilDue = (dueDate: string | null | undefined) => {
    if (!dueDate) return 0;
    try {
      const due = new Date(dueDate);
      if (isNaN(due.getTime())) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 0;
    }
  };

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriority = (dueDate: string | null | undefined) => {
    const days = getDaysUntilDue(dueDate);
    if (days < 0) return 'high';
    if (days <= 2) return 'high';
    if (days <= 7) return 'medium';
    return 'low';
  };

  const assignmentData = fullAssignment || assignment;
  const dueDate = assignmentData.due_date || assignmentData.dueDate;
  const daysUntilDue = getDaysUntilDue(dueDate);
  const priority = getPriority(dueDate);
  const submission = assignmentData.submissions?.[0];
  const isSubmitted = !!submission;
  const isPastDue = daysUntilDue < 0;
  const canEdit = isSubmitted && !isPastDue;
  
  // Try multiple paths to get tutor name
  const tutorName = assignmentData.tutor?.user?.name || 
                    assignmentData.tutor?.name ||
                    (typeof assignmentData.tutor === 'string' ? assignmentData.tutor : null) ||
                    assignmentData.classModel?.tutor?.user?.name ||
                    assignmentData.classModel?.tutor?.name ||
                    'N/A';
  
  // Try multiple paths to get class name
  const className = assignmentData.classModel?.name || 
                   assignmentData.class_model?.name ||
                   assignmentData.class?.name || 
                   (typeof assignmentData.class === 'string' ? assignmentData.class : null) ||
                   assignmentData.class_name ||
                   'N/A';
  const maxPoints = assignmentData.max_points || assignmentData.maxPoints || 0;
  const submissionType = assignmentData.submission_type || assignmentData.submissionType || 'text';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Assignment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{assignmentData.title}</span>
                <Badge variant={getPriorityColor(priority)}>
                  {priority} priority
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <p className="text-muted-foreground">{assignmentData.description || assignmentData.instructions || 'No description'}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Instructor</p>
                    <p className="text-sm text-muted-foreground">{tutorName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Class</p>
                    <p className="text-sm text-muted-foreground">
                      {assignmentData.classModel?.name || 
                       assignmentData.class_model?.name ||
                       assignmentData.class?.name || 
                       (typeof assignmentData.class === 'string' ? assignmentData.class : null) ||
                       assignmentData.class_name ||
                       'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-sm text-muted-foreground">
                      {dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Points</p>
                    <p className="text-sm text-muted-foreground">{maxPoints} points</p>
                  </div>
                </div>
              </div>

              {dueDate && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Time Remaining</p>
                  </div>
                  <p className={`text-sm ${
                    daysUntilDue <= 2 ? 'text-red-600' : 
                    daysUntilDue <= 7 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {daysUntilDue === 0 ? 'Due today' : 
                     daysUntilDue === 1 ? 'Due tomorrow' :
                     daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} days overdue` :
                     `${daysUntilDue} days remaining`}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium">Submission Requirements:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Submit as {submissionType === 'file' ? 'file upload' : submissionType === 'link' ? 'link' : 'text entry'}</li>
                  {assignmentData.allowed_file_types && assignmentData.allowed_file_types.length > 0 && (
                    <li>Allowed file types: {assignmentData.allowed_file_types.join(', ')}</li>
                  )}
                  <li>Original work required - no plagiarism</li>
                  <li>Follow proper formatting guidelines</li>
                  {assignmentData.instructions && (
                    <li className="list-none mt-2">
                      <p className="font-medium mb-1">Instructions:</p>
                      <div className="whitespace-pre-line text-xs">{assignmentData.instructions}</div>
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Submission Status Card */}
          {isSubmitted && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Submission Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Submitted
                    </Badge>
                    {submission.status && (
                      <Badge variant="outline">
                        {submission.status}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>

                {/* Submission Content Preview */}
                {submission.text_submission && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Text Submission:</p>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm line-clamp-3">{submission.text_submission}</p>
                    </div>
                  </div>
                )}

                {submission.link_submission && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Link Submission:</p>
                    <div className="flex items-center gap-2">
                      <a 
                        href={submission.link_submission} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {submission.link_submission}
                      </a>
                    </div>
                  </div>
                )}

                {submission.file_url && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium">File Submission:</p>
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm flex-1">{submission.file_url.split('/').pop()}</span>
                    </div>
                  </div>
                )}

                {/* Grade and Feedback */}
                {submission.grade !== undefined && submission.grade !== null && (
                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Grade:</p>
                      <div className="text-lg font-bold">
                        {submission.grade}/{maxPoints}
                        <span className="text-sm text-muted-foreground ml-2">
                          ({Math.round((submission.grade / maxPoints) * 100)}%)
                        </span>
                      </div>
                    </div>
                    {submission.feedback && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Tutor Feedback:</p>
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{submission.feedback}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {onViewSubmission && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => {
                        onViewSubmission(assignmentData, submission);
                        onClose();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Submission
                    </Button>
                  )}
                  {canEdit && onEditSubmission && (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => {
                        onEditSubmission(assignmentData, submission);
                        onClose();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Submission
                    </Button>
                  )}
                  {isPastDue && !submission.grade && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Submission closed after due date
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!isSubmitted && (
              <Button onClick={() => {
                // This would open the submit modal - handled by parent
                onClose();
              }}>
                Start Assignment
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};