import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, ExternalLink, Calendar } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';

interface ViewSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
  submission: any;
}

export const ViewSubmissionModal: React.FC<ViewSubmissionModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submission
}) => {
  const { toast } = useToast();

  if (!assignment || !submission) return null;

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'submitted': return 'default';
      case 'graded': return 'secondary';
      case 'late': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Submission Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardHeader>
              <CardTitle>{assignment.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{assignment.description || assignment.instructions}</p>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Due: {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'N/A'}</span>
                </div>
                <span>Points: {assignment.max_points || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Submission Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Submission</CardTitle>
                <Badge variant={getStatusColor(submission.status)}>
                  {submission.status || 'Submitted'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Submitted: {submission.submitted_at ? new Date(submission.submitted_at).toLocaleDateString() : 'N/A'}</span>
              </div>

              {/* Text Submission */}
              {submission.text_submission && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Text Submission:</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm whitespace-pre-wrap">{submission.text_submission}</p>
                  </div>
                </div>
              )}

              {/* Link Submission */}
              {submission.link_submission && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Link Submission:</Label>
                  <div className="flex items-center gap-2">
                    <a 
                      href={submission.link_submission} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {submission.link_submission}
                    </a>
                  </div>
                </div>
              )}

              {/* File Submission */}
              {submission.file_url && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">File Submission:</Label>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm flex-1">{submission.file_url.split('/').pop()}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(submission.file_url, submission.file_url.split('/').pop())}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              )}

              {/* Grade and Feedback */}
              {submission.grade !== undefined && submission.grade !== null && (
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Grade:</Label>
                    <div className="text-lg font-bold">
                      {submission.grade}/{assignment.max_points}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({Math.round((submission.grade / assignment.max_points) * 100)}%)
                      </span>
                    </div>
                  </div>
                  {submission.feedback && (
                    <div className="space-y-1">
                      <Label className="text-sm font-medium">Tutor Feedback:</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{submission.feedback}</p>
                      </div>
                    </div>
                  )}
                  {submission.graded_at && (
                    <p className="text-xs text-muted-foreground">
                      Graded on: {new Date(submission.graded_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

