import { useEffect, useState } from 'react';
import '@/styles/parent-portal.css';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Search, 
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  Timer
} from 'lucide-react';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useParentContext, useParentStore } from '@/lib/store/parentStore';
import { parentApi } from '@/lib/api';
import type { ParentAssignment } from '@/lib/store/parentStore';

export default function ParentAssignments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<ParentAssignment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAssignments, setTotalAssignments] = useState(0);
  
  const {
    activeChild,
    assignments,
    isLoading,
  } = useParentContext();

  const {
    setAssignments,
    setLoading,
  } = useParentStore();

  // Load assignments when active child changes or page changes
  useEffect(() => {
    if (!activeChild?.id) return;

    const loadAssignments = async () => {
      try {
        setLoading(true);
        const response = await parentApi.getChildAssignments(Number(activeChild.id), {
          page: currentPage,
          per_page: perPage,
        });
        
        // Handle paginated response
        let assignmentsArray = [];
        if (Array.isArray(response)) {
          assignmentsArray = response;
        } else if (response.data && Array.isArray(response.data)) {
          assignmentsArray = response.data;
          // Set pagination info
          if (response.current_page) {
            setCurrentPage(response.current_page);
            setTotalPages(response.last_page || 1);
            setTotalAssignments(response.total || 0);
          }
        }
        
        // Map API response to store format
        const mappedAssignments = assignmentsArray.map((a: any) => {
          const submission = a.submissions?.[0];
          let status: 'due' | 'submitted' | 'late' | 'graded' = 'due';
          
          if (submission) {
            if (submission.status === 'graded') status = 'graded';
            else if (submission.status === 'submitted') status = 'submitted';
          } else {
            // Check if overdue
            const dueDate = new Date(a.due_date);
            const now = new Date();
            if (dueDate < now) status = 'late';
          }
          
          return {
            id: String(a.id),
            title: a.title,
            subject: (a.class && a.class.category) ? a.class.category : (a.class && a.class.name ? a.class.name : 'Unknown'),
            dueDate: a.due_date,
            status,
            grade: submission?.grade,
            maxGrade: a.max_points,
            feedback: submission?.feedback,
            rubric: a.description,
          };
        });
        
        setAssignments(mappedAssignments);
        
        // If no pagination data was set above, set defaults
        if (!response.current_page) {
          setTotalPages(1);
          setTotalAssignments(mappedAssignments.length);
        }
      } catch (error) {
        console.error('Failed to load assignments:', error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    loadAssignments();
  }, [activeChild?.id, currentPage, perPage, setAssignments, setLoading]);

  // Filter assignments based on search and status (client-side filtering on current page)
  const filteredAssignments = assignments?.filter((assignment) => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'due': return 'destructive';
      case 'submitted': return 'secondary';
      case 'graded': return 'default';
      case 'late': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'due': return Timer;
      case 'submitted': return CheckCircle;
      case 'graded': return CheckCircle;
      case 'late': return XCircle;
      default: return FileText;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (!activeChild) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Child Selected</h2>
            <p className="text-muted-foreground">Please select a child to view their assignments.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground">
            Track {activeChild.name}'s homework and project progress
          </p>
        </div>
        <ChildSwitcher />
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Due Soon</CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments?.filter(a => a.status === 'due').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Submitted</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments?.filter(a => a.status === 'submitted' || a.status === 'graded').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Completed work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments?.filter(a => a.grade).length > 0 
                ? Math.round(assignments.filter(a => a.grade).reduce((sum, a) => sum + (a.grade || 0), 0) / assignments.filter(a => a.grade).length)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Graded assignments</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments or subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignments</SelectItem>
            <SelectItem value="due">Due</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="late">Late</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignments List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading assignments...</p>
          </div>
        </div>
      ) : filteredAssignments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Assignment List</CardTitle>
            <CardDescription>
              {filteredAssignments.length} assignment{filteredAssignments.length !== 1 ? 's' : ''} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredAssignments.map((assignment, index) => {
                const StatusIcon = getStatusIcon(assignment.status);
                const daysUntilDue = getDaysUntilDue(assignment.dueDate);
                
                return (
                  <div 
                    key={assignment.id} 
                    className="group relative overflow-hidden"
                    style={{ 
                      animation: `slideInUp 0.6s ease-out ${index * 0.1}s both` 
                    }}
                  >
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer bg-gradient-to-r from-background to-muted/10 group-hover:from-primary/5 group-hover:to-secondary/5">
                      {/* Background gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/3 to-secondary/3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                      
                      <div className="flex items-center gap-4 relative z-10">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
                          <StatusIcon className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-semibold group-hover:text-primary transition-colors duration-300">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">{assignment.subject}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground group-hover:text-foreground/60 transition-colors duration-300">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 group-hover:text-primary transition-colors duration-300" />
                              Due: {formatDate(assignment.dueDate)}
                            </span>
                            {assignment.status === 'due' && daysUntilDue >= 0 && (
                              <span className={`flex items-center gap-1 ${daysUntilDue <= 1 ? 'text-destructive' : ''} group-hover:scale-105 transition-transform duration-300`}>
                                <Clock className="h-3 w-3" />
                                {daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} left`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 relative z-10">
                        {assignment.grade && (
                          <div className="text-right group-hover:scale-105 transition-transform duration-300">
                            <div className="font-semibold group-hover:text-primary transition-colors duration-300">{assignment.grade}%</div>
                            <div className="text-xs text-muted-foreground">
                              {assignment.maxGrade ? `/ ${assignment.maxGrade}` : ''}
                            </div>
                          </div>
                        )}
                        
                        <Badge 
                          variant={getStatusColor(assignment.status)}
                          className="group-hover:scale-105 transition-transform duration-300"
                        >
                          {assignment.status}
                        </Badge>
                        
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="parent-button group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300"
                              onClick={() => {
                                setSelectedAssignment(assignment);
                                // Smooth scroll to top when opening assignment details
                                setTimeout(() => {
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }, 100);
                              }}
                            >
                              <Eye className="icon-hover h-4 w-4 group-hover:text-primary transition-colors duration-300" />
                            </Button>
                          </SheetTrigger>
                        <SheetContent className="w-[400px] sm:w-[540px]">
                          <SheetHeader>
                            <SheetTitle>{assignment.title}</SheetTitle>
                            <SheetDescription>
                              {assignment.subject} • Due {formatDate(assignment.dueDate)}
                            </SheetDescription>
                          </SheetHeader>
                          
                          <div className="mt-6 space-y-6">
                            <div>
                              <h4 className="font-medium mb-2">Status</h4>
                              <Badge variant={getStatusColor(assignment.status)}>
                                {assignment.status}
                              </Badge>
                            </div>
                            
                            {assignment.grade && (
                              <div>
                                <h4 className="font-medium mb-2">Grade</h4>
                                <div className="text-2xl font-bold">
                                  {assignment.grade}%
                                  {assignment.maxGrade && (
                                    <span className="text-sm text-muted-foreground ml-2">
                                      ({assignment.grade}/{assignment.maxGrade})
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {assignment.rubric && (
                              <div>
                                <h4 className="font-medium mb-2">Assignment Details</h4>
                                <p className="text-sm text-muted-foreground">{assignment.rubric}</p>
                              </div>
                            )}
                            
                            {assignment.feedback && (
                              <div>
                                <h4 className="font-medium mb-2">Teacher Feedback</h4>
                                <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-sm">{assignment.feedback}</p>
                                </div>
                              </div>
                            )}
                            
                            <div className="pt-4 border-t">
                              <div className="text-xs text-muted-foreground text-center">
                                <span className="inline-flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  View-only access - Contact teacher for questions
                                </span>
                              </div>
                            </div>
                          </div>
                        </SheetContent>
                      </Sheet>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalAssignments)} of {totalAssignments} assignments
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          disabled={isLoading}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Assignments Found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || statusFilter !== 'all' 
                ? 'No assignments match your current filters.' 
                : `${activeChild.name} has no assignments yet.`}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
