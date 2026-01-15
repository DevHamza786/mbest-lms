import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Calendar, FileText, Users, Clock, MoreHorizontal, Eye, Edit, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { tutorApi, TutorAssignment, TutorClass } from '@/lib/api/tutor';

interface AssignmentStats {
  total: number;
  published: number;
  drafts: number;
  pending_grading: number;
}

export default function TutorAssignments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TutorAssignment | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  
  const [assignments, setAssignments] = useState<TutorAssignment[]>([]);
  const [classes, setClasses] = useState<TutorClass[]>([]);
  const [stats, setStats] = useState<AssignmentStats>({
    total: 0,
    published: 0,
    drafts: 0,
    pending_grading: 0,
  });
  
  const resetFormState = () => ({
    title: '',
    description: '',
    instructions: '',
    class_id: '',
    due_date: '',
    max_points: 100,
    submission_type: 'file' as 'file' | 'text' | 'link',
    status: 'draft' as 'draft' | 'published' | 'archived',
  });

  const [newAssignment, setNewAssignment] = useState(resetFormState());

  useEffect(() => {
    loadClasses();
    // Load statistics once on mount (without filters)
    loadStatistics();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedClass, statusFilter, activeTab, searchTerm]);

  const loadClasses = async () => {
    try {
      const classesData = await tutorApi.getClasses();
      setClasses(classesData);
    } catch (error) {
      console.error('Failed to load classes:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      // Load statistics without any filters to get overall totals
      const response = await tutorApi.getAssignments({ per_page: 1 });
      if (response.statistics) {
        console.log('Statistics loaded:', response.statistics);
        setStats(response.statistics);
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        per_page: 50,
      };

      if (selectedClass !== 'all') {
        params.class_id = parseInt(selectedClass);
      }

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (activeTab === 'grading') {
        params.needs_grading = true;
      }

      const response = await tutorApi.getAssignments(params);
      setAssignments(response.assignments || []);
      
      // Statistics are loaded separately on mount, so we don't need to set them here
      // But if statistics are returned, we can use them (they should be the same as loaded separately)
    } catch (error: any) {
      console.error('Failed to load assignments:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load assignments',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.class_id || !newAssignment.due_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await tutorApi.createAssignment({
        title: newAssignment.title,
        description: newAssignment.description || undefined,
        instructions: newAssignment.instructions || undefined,
        class_id: parseInt(newAssignment.class_id),
        due_date: newAssignment.due_date,
        max_points: newAssignment.max_points,
        submission_type: newAssignment.submission_type,
        status: newAssignment.status,
      });

      setNewAssignment(resetFormState());
      setIsCreateOpen(false);
      
      toast({
        title: "Assignment Created",
        description: "Your assignment has been created successfully.",
      });

      await loadData();
      await loadStatistics(); // Reload statistics after creating
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      });
    }
  };

  const handleEditAssignment = (assignment: TutorAssignment) => {
    setEditingAssignment(assignment);
    setNewAssignment({
      title: assignment.title,
      description: assignment.description || '',
      instructions: assignment.instructions || '',
      class_id: assignment.class_id?.toString() || '',
      due_date: assignment.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : '',
      max_points: assignment.max_points,
      submission_type: assignment.submission_type as 'file' | 'text' | 'link',
      status: assignment.status as 'draft' | 'published' | 'archived',
    });
    setIsEditOpen(true);
  };

  const handleUpdateAssignment = async () => {
    if (!editingAssignment || !newAssignment.title || !newAssignment.class_id || !newAssignment.due_date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await tutorApi.updateAssignment(editingAssignment.id, {
        title: newAssignment.title,
        description: newAssignment.description || undefined,
        instructions: newAssignment.instructions || undefined,
        class_id: parseInt(newAssignment.class_id),
        due_date: newAssignment.due_date,
        max_points: newAssignment.max_points,
        submission_type: newAssignment.submission_type,
        status: newAssignment.status,
      });

      setNewAssignment(resetFormState());
      setIsEditOpen(false);
      setEditingAssignment(null);
      
      toast({
        title: "Assignment Updated",
        description: "Your assignment has been updated successfully.",
      });

      await loadData();
      await loadStatistics(); // Reload statistics after updating
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update assignment",
        variant: "destructive",
      });
    }
  };

  const handlePublishAssignment = async (id: number) => {
    try {
      await tutorApi.updateAssignment(id, { status: 'published' });
      
      toast({
        title: "Assignment Published",
        description: "Assignment is now available to students.",
      });

      await loadData();
      await loadStatistics(); // Reload statistics after publishing
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to publish assignment",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(id.toString());
      await tutorApi.deleteAssignment(id);
      
      toast({
        title: "Assignment Deleted",
        description: "The assignment has been deleted successfully.",
      });

      await loadData();
      await loadStatistics(); // Reload statistics after deleting
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete assignment",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleViewSubmissions = (assignmentId: number) => {
    navigate(`/tutor/assignments/${assignmentId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const getClassName = (classId: number | null) => {
    if (!classId) return 'No Class';
    const classItem = classes.find(c => c.id === classId);
    return classItem ? classItem.name : 'Unknown Class';
  };

  const getSubmissionsCount = (assignment: TutorAssignment) => {
    return (assignment as any).submissions_count || 0;
  };

  const getTotalStudents = (assignment: TutorAssignment) => {
    return (assignment as any).total_students || 0;
  };

  const filteredAssignments = assignments; // Already filtered by API

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            Create, manage, and grade assignments for your classes
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setNewAssignment(resetFormState());
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Create a new assignment for your students
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label htmlFor="title">Assignment Title *</Label>
                <Input
                  id="title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., React Component Architecture"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="class">Class *</Label>
                <Select value={newAssignment.class_id} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, class_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the assignment"
                  className="min-h-[80px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Detailed Instructions</Label>
                <Textarea
                  id="instructions"
                  value={newAssignment.instructions}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Provide detailed instructions for students..."
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newAssignment.due_date}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, due_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPoints">Max Points</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    min="1"
                    value={newAssignment.max_points}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, max_points: parseInt(e.target.value) || 100 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submissionType">Submission Type</Label>
                <Select value={newAssignment.submission_type} onValueChange={(value: 'file' | 'text' | 'link') => setNewAssignment(prev => ({ ...prev, submission_type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">File Upload</SelectItem>
                    <SelectItem value="text">Text Response</SelectItem>
                    <SelectItem value="link">Link/URL</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newAssignment.status} onValueChange={(value: 'draft' | 'published' | 'archived') => setNewAssignment(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAssignment}>Create Assignment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.drafts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pending_grading}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Assignments</TabsTrigger>
          <TabsTrigger value="grading">Need Grading</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search assignments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(cls => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assignments List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredAssignments.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">No assignments found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredAssignments.map((assignment) => {
                  const submissionsCount = getSubmissionsCount(assignment);
                  const totalStudents = getTotalStudents(assignment);
                  
                  return (
                    <Card key={assignment.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{assignment.title}</h3>
                              <Badge className={getStatusColor(assignment.status)}>
                                {assignment.status}
                              </Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">{assignment.description || 'No description provided'}</p>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Due: {formatDate(assignment.due_date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                {submissionsCount}/{totalStudents} submitted
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {assignment.max_points} points
                              </div>
                              <div>{getClassName(assignment.class_id)}</div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              {assignment.status === 'draft' && (
                                <Button size="sm" onClick={() => handlePublishAssignment(assignment.id)}>
                                  Publish Assignment
                                </Button>
                              )}
                              {assignment.status === 'published' && submissionsCount > 0 && (
                                <Button size="sm" variant="outline" onClick={() => handleViewSubmissions(assignment.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Submissions ({submissionsCount})
                                </Button>
                              )}
                            </div>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewSubmissions(assignment.id)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditAssignment(assignment)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Assignment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-red-600" 
                                onClick={() => handleDeleteAssignment(assignment.id)}
                                disabled={isDeleting === assignment.id.toString()}
                              >
                                {isDeleting === assignment.id.toString() ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="grading" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignments Needing Grading</CardTitle>
              <CardDescription>
                Review and grade student submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAssignments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No assignments need grading</p>
                    </div>
                  ) : (
                    filteredAssignments.map((assignment) => {
                      const submissionsCount = getSubmissionsCount(assignment);
                      
                      return (
                        <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{assignment.title}</h4>
                            <p className="text-sm text-muted-foreground">{getClassName(assignment.class_id)}</p>
                            <div className="text-sm text-muted-foreground mt-1">
                              {submissionsCount} submissions to grade
                            </div>
                          </div>
                          <Button size="sm" onClick={() => handleViewSubmissions(assignment.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Start Grading
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={(open) => {
        setIsEditOpen(open);
        if (!open) {
          setEditingAssignment(null);
          setNewAssignment(resetFormState());
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
            <DialogDescription>
              Update assignment details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Assignment Title *</Label>
              <Input
                id="edit-title"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., React Component Architecture"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-class">Class *</Label>
              <Select value={newAssignment.class_id} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, class_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(cls => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={newAssignment.description}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of the assignment"
                className="min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-instructions">Detailed Instructions</Label>
              <Textarea
                id="edit-instructions"
                value={newAssignment.instructions}
                onChange={(e) => setNewAssignment(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Provide detailed instructions for students..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date *</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={newAssignment.due_date}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxPoints">Max Points</Label>
                <Input
                  id="edit-maxPoints"
                  type="number"
                  min="1"
                  value={newAssignment.max_points}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, max_points: parseInt(e.target.value) || 100 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-submissionType">Submission Type</Label>
              <Select value={newAssignment.submission_type} onValueChange={(value: 'file' | 'text' | 'link') => setNewAssignment(prev => ({ ...prev, submission_type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="text">Text Response</SelectItem>
                  <SelectItem value="link">Link/URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={newAssignment.status} onValueChange={(value: 'draft' | 'published' | 'archived') => setNewAssignment(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditOpen(false);
              setEditingAssignment(null);
              setNewAssignment(resetFormState());
            }}>Cancel</Button>
            <Button onClick={handleUpdateAssignment}>Update Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
