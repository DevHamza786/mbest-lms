import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { studentApi } from '@/lib/api';

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  submission?: any;
}

export const SubmitAssignmentModal: React.FC<SubmitAssignmentModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submission
}) => {
  const { toast } = useToast();
  const [submissionText, setSubmissionText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullAssignment, setFullAssignment] = useState<any>(assignment);
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!submission;

  useEffect(() => {
    if (isOpen && assignment?.id) {
      // If editing, load existing submission data
      if (submission) {
        setSubmissionText(submission.text_submission || submission.link_submission || '');
        setFiles([]); // Files can't be edited, only re-uploaded
      } else {
        // Reset form when creating new submission
        setSubmissionText('');
        setFiles([]);
      }
      
      // If assignment doesn't have tutor/class data, fetch full details
      if (!assignment.tutor?.user && !assignment.classModel) {
        loadFullAssignment();
      } else {
        setFullAssignment(assignment);
      }
    } else {
      setFullAssignment(assignment);
    }
  }, [isOpen, assignment, submission]);

  const loadFullAssignment = async () => {
    if (!assignment?.id) return;
    
    try {
      setIsLoading(true);
      const fullData = await studentApi.getAssignment(assignment.id);
      setFullAssignment(fullData);
    } catch (error) {
      console.error('Failed to load assignment details:', error);
      // Keep using the original assignment data
      setFullAssignment(assignment);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 5) {
      toast({
        title: "Too many files",
        description: "You can upload a maximum of 5 files.",
        variant: "destructive"
      });
      return;
    }
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const assignmentData = fullAssignment || assignment;
    const submissionType = assignmentData.submission_type || assignmentData.submissionType;
    
    if (submissionType === 'text' && !submissionText.trim()) {
      toast({
        title: "Missing content",
        description: "Please enter your submission text.",
        variant: "destructive"
      });
      return;
    }

    if (submissionType === 'file' && files.length === 0) {
      toast({
        title: "Missing submission",
        description: "Please upload a file for your submission.",
        variant: "destructive"
      });
      return;
    }

    if (submissionType === 'link' && !submissionText.trim()) {
      toast({
        title: "Missing link",
        description: "Please enter a submission link.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData: any = {};
      
      if (submissionType === 'text') {
        submissionData.text_submission = submissionText;
      }
      
      if (submissionType === 'file' && files.length > 0) {
        submissionData.file = files[0]; // API might only accept one file
      }

      if (submissionType === 'link') {
        submissionData.link_submission = submissionText;
      }

      await studentApi.submitAssignment(
        assignmentData.id || assignment.id, 
        submissionData,
        isEditMode ? submission?.id : undefined
      );

      toast({
        title: isEditMode ? "Submission Updated" : "Assignment Submitted",
        description: `Your submission for "${assignmentData?.title || assignment?.title}" has been ${isEditMode ? 'updated' : 'submitted'} successfully.`
      });

      setSubmissionText('');
      setFiles([]);
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit assignment",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!assignment) return null;

  const assignmentData = fullAssignment || assignment;
  const dueDate = assignmentData.due_date ? new Date(assignmentData.due_date) : null;
  const isOverdue = dueDate && dueDate < new Date();
  const getDaysUntilDue = () => {
    if (!dueDate) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  const daysUntilDue = getDaysUntilDue();
  const submissionType = assignmentData.submission_type || assignmentData.submissionType || 'text';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Submission' : 'Submit Assignment'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  <h3 className="font-medium">{assignmentData.title}</h3>
                  <p className="text-sm text-muted-foreground">{assignmentData.description || assignmentData.instructions || 'No description'}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Due: {dueDate ? dueDate.toLocaleDateString() : 'N/A'}</span>
                    <span>Points: {assignmentData.max_points || 0}</span>
                  </div>
                  {isOverdue && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ This assignment is {Math.abs(daysUntilDue)} days overdue. You can still submit, but it may be marked as late.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {submissionType === 'text' && (
              <div className="space-y-2">
                <Label htmlFor="submission-text">Submission Text</Label>
                <Textarea
                  id="submission-text"
                  placeholder="Enter your assignment submission here..."
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
              </div>
            )}

            {submissionType === 'file' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">File Attachments</Label>
                  {assignmentData.allowed_file_types && assignmentData.allowed_file_types.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Allowed file types: {assignmentData.allowed_file_types.join(', ')}
                    </p>
                  )}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Drag and drop files here, or click to browse
                      </p>
                      <Input
                        id="file-upload"
                        type="file"
                        accept={assignmentData.allowed_file_types?.map((type: string) => `.${type}`).join(',')}
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        Choose Files
                      </Button>
                    </div>
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-2">
                    <Label>Uploaded Files ({files.length}/5)</Label>
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {submissionType === 'link' && (
              <div className="space-y-2">
                <Label htmlFor="link-submission">Submission Link</Label>
                <Input
                  id="link-submission"
                  type="url"
                  placeholder="https://example.com/your-work"
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter the URL where your assignment can be accessed
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? "Updating..." : "Submitting...") : (isEditMode ? "Update Submission" : "Submit Assignment")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};