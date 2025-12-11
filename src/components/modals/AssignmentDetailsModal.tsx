import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, FileText, User, Target } from "lucide-react";

interface AssignmentDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: any;
}

export const AssignmentDetailsModal: React.FC<AssignmentDetailsModalProps> = ({
  isOpen,
  onClose,
  assignment
}) => {
  if (!assignment) return null;

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

  const daysUntilDue = getDaysUntilDue(assignment.dueDate);

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
                <span>{assignment.title}</span>
                <Badge variant={getPriorityColor(assignment.priority)}>
                  {assignment.priority} priority
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{assignment.description}</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Instructor</p>
                    <p className="text-sm text-muted-foreground">{assignment.tutor}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Class</p>
                    <p className="text-sm text-muted-foreground">{assignment.class}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(assignment.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Points</p>
                    <p className="text-sm text-muted-foreground">{assignment.maxPoints} points</p>
                  </div>
                </div>
              </div>

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

              <div className="space-y-2">
                <p className="text-sm font-medium">Submission Requirements:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Submit as {assignment.submissionType === 'file' ? 'file upload' : 'text entry'}</li>
                  <li>Original work required - no plagiarism</li>
                  <li>Follow proper formatting guidelines</li>
                  <li>Include all required sections</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              Start Assignment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};