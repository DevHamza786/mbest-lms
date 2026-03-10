import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  HelpCircle,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  FileText,
  Download,
  Loader2,
  Send,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { tutorApi } from '@/lib/api';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export default function TutorQuestions() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');
  const [assignments, setAssignments] = useState<any[]>([]);

  const [selectedQuestion, setSelectedQuestion] = useState<any | null>(null);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    loadQuestions();
  }, [statusFilter, assignmentFilter]);

  useEffect(() => {
    tutorApi.getAssignments({ per_page: 100 }).then((res) => {
      setAssignments(res.assignments || []);
    }).catch(() => {});
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const params: any = { per_page: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (assignmentFilter !== 'all') params.assignment_id = Number(assignmentFilter);
      const response = await tutorApi.getQuestions(params);
      const list = response?.data?.data ?? response?.data ?? [];
      setQuestions(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Failed to load questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load questions',
        variant: 'destructive',
      });
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      const matches =
        q.subject?.toLowerCase().includes(term) ||
        q.question?.toLowerCase().includes(term) ||
        q.student?.user?.name?.toLowerCase().includes(term) ||
        q.assignment?.title?.toLowerCase().includes(term);
      if (!matches) return false;
    }
    if (activeTab === 'pending') return q.status === 'pending';
    if (activeTab === 'answered') return q.status === 'answered';
    if (activeTab === 'closed') return q.status === 'closed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered':
        return 'secondary';
      case 'pending':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const handleViewReply = (question: any) => {
    setSelectedQuestion(question);
    setAnswerText(question.answer || '');
    setReplyModalOpen(true);
    if (question.id) {
      setDetailLoading(true);
      tutorApi
        .getQuestion(question.id)
        .then((full) => {
          setSelectedQuestion((prev: any) => (prev ? { ...prev, ...full } : full));
          setAnswerText((full as any)?.answer || question.answer || '');
        })
        .finally(() => setDetailLoading(false));
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedQuestion?.id || !answerText.trim()) {
      toast({
        title: 'Validation',
        description: 'Please enter your answer.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setReplySubmitting(true);
      await tutorApi.replyToQuestion(selectedQuestion.id, answerText.trim());
      await tutorApi.updateQuestionStatus(selectedQuestion.id, 'answered');
      toast({
        title: 'Success',
        description: 'Answer submitted successfully',
      });
      setReplyModalOpen(false);
      setSelectedQuestion(null);
      setAnswerText('');
      loadQuestions();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to submit answer',
        variant: 'destructive',
      });
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleDownloadAttachment = (attachment: any) => {
    const url = attachment.file_path?.startsWith('http')
      ? attachment.file_path
      : `${API_BASE.replace('/api/v1', '')}/storage/${attachment.file_path}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.file_name || 'attachment';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingCount = questions.filter((q) => q.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HelpCircle className="h-8 w-8" />
          Student Questions
        </h1>
        <p className="text-muted-foreground">
          View and answer questions from students about assignments and concepts
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by subject, question, or student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Assignment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignments</SelectItem>
            {assignments.map((a) => (
              <SelectItem key={a.id} value={String(a.id)}>
                {a.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Questions</TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingCount})
          </TabsTrigger>
          <TabsTrigger value="answered" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Answered ({questions.filter((q) => q.status === 'answered').length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Closed ({questions.filter((q) => q.status === 'closed').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No questions match your filters.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          {question.subject}
                        </CardTitle>
                        <CardDescription>
                          {question.assignment?.title || question.classModel?.name || 'General'}
                          {question.student?.user?.name && ` • ${question.student.user.name}`}
                        </CardDescription>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {question.question}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={getPriorityColor(question.priority)}>
                            {question.priority || 'medium'}
                          </Badge>
                          <Badge variant={getStatusColor(question.status)}>
                            {question.status}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant={question.status === 'pending' ? 'default' : 'outline'}
                          onClick={() => handleViewReply(question)}
                        >
                          {question.status === 'pending' ? 'Reply' : 'View'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <span className="text-xs text-muted-foreground">
                      Asked {question.created_at ? new Date(question.created_at).toLocaleDateString() : '—'}
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={replyModalOpen} onOpenChange={setReplyModalOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              {selectedQuestion?.subject ?? 'Question'}
            </DialogTitle>
            <DialogDescription>
              {selectedQuestion?.assignment?.title || 'General'} •{' '}
              {selectedQuestion?.student?.user?.name ?? 'Student'}
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Chat-style message thread */}
              <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border bg-muted/30 p-4 space-y-4">
                {/* Student message (left) */}
                <div className="flex justify-start">
                  <div className="max-w-[85%]">
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {selectedQuestion?.student?.user?.name ?? 'Student'}
                    </p>
                    <div className="rounded-2xl rounded-tl-sm bg-muted px-4 py-3 shadow-sm">
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedQuestion?.question ?? '—'}
                      </p>
                      {selectedQuestion?.attachments?.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                          {selectedQuestion.attachments.map((att: any) => (
                            <div
                              key={att.id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                              <span className="truncate flex-1">{att.file_name}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => handleDownloadAttachment(att)}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedQuestion?.created_at
                        ? new Date(selectedQuestion.created_at).toLocaleString()
                        : ''}
                    </p>
                  </div>
                </div>

                {/* Tutor reply (right) */}
                {(selectedQuestion?.answer || answerText) && (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] text-right">
                      <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center justify-end gap-1">
                        You
                      </p>
                      <div className="rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 shadow-sm inline-block">
                        <p className="text-sm whitespace-pre-wrap text-left">
                          {selectedQuestion?.status === 'answered'
                            ? selectedQuestion.answer
                            : answerText}
                        </p>
                      </div>
                      {(selectedQuestion?.answered_at || selectedQuestion?.answer) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {selectedQuestion?.answered_at
                            ? new Date(selectedQuestion.answered_at).toLocaleString()
                            : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {!selectedQuestion?.answer && selectedQuestion?.status === 'pending' && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    Reply below to answer the student.
                  </p>
                )}
              </div>

              {/* Reply input (chat-style) */}
              <div className="border-t pt-4 space-y-3">
                {selectedQuestion?.status !== 'answered' ? (
                  <>
                    <Label htmlFor="answer" className="text-sm">Your reply</Label>
                    <Textarea
                      id="answer"
                      placeholder="Type your answer..."
                      value={answerText}
                      onChange={(e) => setAnswerText(e.target.value)}
                      className="min-h-[100px] resize-none"
                      disabled={replySubmitting}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setReplyModalOpen(false)}>
                        Close
                      </Button>
                      <Button
                        onClick={handleReplySubmit}
                        disabled={replySubmitting || !answerText.trim()}
                      >
                        {replySubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        Send reply
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => setReplyModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
