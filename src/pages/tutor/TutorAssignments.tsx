import { useState } from 'react';
import { Plus, Search, Calendar, FileText, Users, Clock, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
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
import classesData from '@/data/classes.json';

interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  dueDate: string;
  maxPoints: number;
  submissionType: 'file' | 'text' | 'link';
  status: 'draft' | 'published' | 'archived';
  submissions: number;
  totalStudents: number;
  createdAt: string;
}

export default function TutorAssignments() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    instructions: '',
    classId: '',
    dueDate: '',
    maxPoints: 100,
    submissionType: 'file' as 'file' | 'text' | 'link',
  });

  const myClasses = classesData.filter(cls => cls.tutorId === 'tutor-1');

  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: '1',
      title: 'React Component Architecture',
      description: 'Create a reusable component library with proper TypeScript definitions',
      classId: 'class-1',
      className: 'Advanced Web Development',
      dueDate: '2024-01-25',
      maxPoints: 100,
      submissionType: 'file',
      status: 'published',
      submissions: 15,
      totalStudents: 18,
      createdAt: '2024-01-10'
    },
    {
      id: '2',
      title: 'Algorithm Analysis Report',
      description: 'Analyze the time complexity of sorting algorithms',
      classId: 'class-2',
      className: 'Data Structures & Algorithms',
      dueDate: '2024-01-28',
      maxPoints: 80,
      submissionType: 'text',
      status: 'published',
      submissions: 20,
      totalStudents: 24,
      createdAt: '2024-01-12'
    },
    {
      id: '3',
      title: 'Database Design Project',
      description: 'Design and implement a normalized database schema',
      classId: 'class-1',
      className: 'Advanced Web Development',
      dueDate: '2024-02-05',
      maxPoints: 150,
      submissionType: 'file',
      status: 'draft',
      submissions: 0,
      totalStudents: 18,
      createdAt: '2024-01-15'
    }
  ]);

  const getStatusColor = (status: Assignment['status']) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'draft': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'archived': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const handleCreateAssignment = () => {
    if (!newAssignment.title || !newAssignment.classId || !newAssignment.dueDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const selectedClass = myClasses.find(cls => cls.id === newAssignment.classId);
    
    const assignment: Assignment = {
      id: Date.now().toString(),
      title: newAssignment.title,
      description: newAssignment.description,
      classId: newAssignment.classId,
      className: selectedClass?.name || '',
      dueDate: newAssignment.dueDate,
      maxPoints: newAssignment.maxPoints,
      submissionType: newAssignment.submissionType,
      status: 'draft',
      submissions: 0,
      totalStudents: selectedClass?.enrolled || 0,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setAssignments(prev => [...prev, assignment]);
    setNewAssignment({
      title: '',
      description: '',
      instructions: '',
      classId: '',
      dueDate: '',
      maxPoints: 100,
      submissionType: 'file',
    });
    setIsCreateOpen(false);

    toast({
      title: "Assignment Created",
      description: "Your assignment has been created successfully.",
    });
  };

  const handlePublishAssignment = (id: string) => {
    setAssignments(prev => prev.map(assignment => 
      assignment.id === id ? { ...assignment, status: 'published' as const } : assignment
    ));
    
    toast({
      title: "Assignment Published",
      description: "Assignment is now available to students.",
    });
  };

  const handleViewSubmissions = (title: string) => {
    toast({
      title: "Submissions",
      description: `Viewing submissions for "${title}"`,
    });
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = selectedClass === 'all' || assignment.classId === selectedClass;
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const stats = {
    total: assignments.length,
    published: assignments.filter(a => a.status === 'published').length,
    draft: assignments.filter(a => a.status === 'draft').length,
    pendingGrading: assignments.reduce((acc, a) => acc + (a.submissions - 0), 0) // Mock pending grading count
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
            Create, manage, and grade assignments for your classes
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
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
                <Select value={newAssignment.classId} onValueChange={(value) => setNewAssignment(prev => ({ ...prev, classId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {myClasses.map(cls => (
                      <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
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
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPoints">Max Points</Label>
                  <Input
                    id="maxPoints"
                    type="number"
                    min="1"
                    value={newAssignment.maxPoints}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, maxPoints: parseInt(e.target.value) || 100 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="submissionType">Submission Type</Label>
                <Select value={newAssignment.submissionType} onValueChange={(value: 'file' | 'text' | 'link') => setNewAssignment(prev => ({ ...prev, submissionType: value }))}>
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
            <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Grading</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.pendingGrading}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
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
                {myClasses.map(cls => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
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
          <div className="grid gap-4">
            {filteredAssignments.map((assignment) => (
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

                      <p className="text-sm text-muted-foreground">{assignment.description}</p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {assignment.dueDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {assignment.submissions}/{assignment.totalStudents} submitted
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {assignment.maxPoints} points
                        </div>
                        <div>{assignment.className}</div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {assignment.status === 'draft' && (
                          <Button size="sm" onClick={() => handlePublishAssignment(assignment.id)}>
                            Publish Assignment
                          </Button>
                        )}
                        {assignment.status === 'published' && assignment.submissions > 0 && (
                          <Button size="sm" variant="outline" onClick={() => handleViewSubmissions(assignment.title)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Submissions ({assignment.submissions})
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
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Assignment
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
              <div className="space-y-4">
                {assignments.filter(a => a.submissions > 0 && a.status === 'published').map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">{assignment.title}</h4>
                      <p className="text-sm text-muted-foreground">{assignment.className}</p>
                      <div className="text-sm text-muted-foreground mt-1">
                        {assignment.submissions} submissions to grade
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleViewSubmissions(assignment.title)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Start Grading
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}