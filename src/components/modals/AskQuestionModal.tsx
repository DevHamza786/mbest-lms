import { useState } from 'react';
import { MessageSquare, Send, FileText, Image, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AskQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment?: any;
  assignmentTitle?: string;
  className?: string;
}

export function AskQuestionModal({ isOpen, onClose, assignment, assignmentTitle, className }: AskQuestionModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    subject: '',
    priority: 'medium',
    category: 'assignment',
    question: '',
    attachments: [] as File[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get tutor and class names from assignment
  const tutorName = assignment?.tutor?.user?.name || 
                    assignment?.tutor?.name ||
                    assignment?.classModel?.tutor?.user?.name ||
                    'Tutor';
  const classDisplayName = assignment?.classModel?.name || 
                           assignment?.class_model?.name ||
                           assignment?.class?.name || 
                           className || 
                           'Class';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.question.trim()) {
      toast({
        title: "Question Required",
        description: "Please enter your question before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.subject.trim()) {
      toast({
        title: "Subject Required",
        description: "Please enter a subject for your question.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { studentApi } = await import('@/lib/api');
      
      const formDataToSend = new FormData();
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('question', formData.question);
      formDataToSend.append('priority', formData.priority);
      formDataToSend.append('category', formData.category);
      
      if (assignment?.id) {
        formDataToSend.append('assignment_id', assignment.id.toString());
      }
      if (assignment?.class_id || assignment?.classModel?.id) {
        formDataToSend.append('class_id', (assignment.class_id || assignment.classModel?.id).toString());
      }
      if (assignment?.tutor_id || assignment?.tutor?.id) {
        formDataToSend.append('tutor_id', (assignment.tutor_id || assignment.tutor?.id).toString());
      }
      
      // Add attachments
      formData.attachments.forEach((file) => {
        formDataToSend.append('attachments[]', file);
      });
      
      await studentApi.askQuestion(formDataToSend);
      
      toast({
        title: "Question Submitted",
        description: `Your question has been sent to ${tutorName}. You'll receive a response soon.`,
      });
      
      // Reset form
      setFormData({
        subject: '',
        priority: 'medium',
        category: 'assignment',
        question: '',
        attachments: [],
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files].slice(0, 3) // Max 3 files
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Ask a Question
          </DialogTitle>
          <DialogDescription>
            {assignmentTitle ? `Ask about: ${assignmentTitle}` : 'Get help from your tutor'}
            {classDisplayName && ` • ${classDisplayName}`}
            {tutorName && ` • ${tutorName}`}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief subject line..."
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignment">Assignment Help</SelectItem>
                <SelectItem value="concept">Concept Clarification</SelectItem>
                <SelectItem value="technical">Technical Issue</SelectItem>
                <SelectItem value="grading">Grading Question</SelectItem>
                <SelectItem value="general">General Question</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="question">Your Question</Label>
            <Textarea
              id="question"
              placeholder="Describe your question in detail. Include any specific problems you're facing or concepts you need help with..."
              value={formData.question}
              onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
              className="min-h-[120px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachments">Attachments (Optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachments"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('attachments')?.click()}
                disabled={formData.attachments.length >= 3}
              >
                <Paperclip className="mr-2 h-4 w-4" />
                Attach Files
              </Button>
              <span className="text-xs text-muted-foreground">
                Max 3 files (PDF, DOC, images)
              </span>
            </div>
            
            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate">{file.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Priority:</span>
            <Badge variant={getPriorityColor(formData.priority)}>
              {formData.priority}
            </Badge>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Send className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Sending...' : 'Send Question'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}