import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, CheckCircle, Clock, AlertCircle, Loader2, Search, FileText, Download } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { studentApi } from '@/lib/api';

const StudentQuestions = () => {
  const { toast } = useToast();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const assignmentId = location.state?.assignmentId;

  useEffect(() => {
    loadQuestions();
  }, [statusFilter, assignmentId]);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const params: any = { per_page: 100 };
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (assignmentId) {
        params.assignment_id = assignmentId;
      }
      const response = await studentApi.getQuestions(params);
      let questionsData = response.data || [];
      
      // If filtering by assignment, show only that assignment's questions
      if (assignmentId) {
        questionsData = questionsData.filter((q: any) => q.assignment_id === assignmentId);
      }
      
      setQuestions(questionsData);
    } catch (error) {
      console.error('Failed to load questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load questions',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (searchQuery.trim()) {
      const matches = q.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     q.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                     q.answer?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matches) return false;
    }
    if (activeTab === 'pending') return q.status === 'pending';
    if (activeTab === 'answered') return q.status === 'answered';
    if (activeTab === 'closed') return q.status === 'closed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'secondary';
      case 'pending': return 'default';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const handleDownloadAttachment = (attachment: any) => {
    // Create download link
    const link = document.createElement('a');
    link.href = `/storage/${attachment.file_path}`;
    link.download = attachment.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Questions</h1>
        <p className="text-muted-foreground">View and manage your questions to tutors</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search questions by subject or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="answered">Answered</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Questions</TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({questions.filter(q => q.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="answered" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Answered ({questions.filter(q => q.status === 'answered').length})
          </TabsTrigger>
          <TabsTrigger value="closed" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Closed ({questions.filter(q => q.status === 'closed').length})
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
                <p className="text-muted-foreground">No questions found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredQuestions.map((question) => (
                <Card key={question.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          {question.subject}
                        </CardTitle>
                        <CardDescription>
                          {question.assignment?.title || question.classModel?.name || 'General Question'}
                          {question.tutor?.user?.name && ` • ${question.tutor.user.name}`}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPriorityColor(question.priority)}>
                          {question.priority} priority
                        </Badge>
                        <Badge variant={getStatusColor(question.status)}>
                          {question.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Your Question:</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{question.question}</p>
                    </div>

                    {question.attachments && question.attachments.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Attachments:</p>
                        <div className="space-y-2">
                          {question.attachments.map((attachment: any) => (
                            <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm flex-1">{attachment.file_name}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownloadAttachment(attachment)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.answer && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">Tutor's Answer:</p>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-200 whitespace-pre-wrap">{question.answer}</p>
                        {question.answered_at && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                            Answered on: {new Date(question.answered_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    )}

                    {!question.answer && question.status === 'pending' && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-yellow-600" />
                          <p className="text-sm text-yellow-800 dark:text-yellow-200">
                            Waiting for tutor's response...
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground">
                      Asked on: {new Date(question.created_at).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentQuestions;

