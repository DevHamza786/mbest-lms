import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, Users, Calendar, MapPin, MoreVertical, Loader2, BookOpen, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminClass, AdminUser, AdminSession } from '@/lib/api/admin';
import { Checkbox } from '@/components/ui/checkbox';

export default function AdminClasses() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<AdminClass | null>(null);
  const [classDetails, setClassDetails] = useState<AdminClass | null>(null);
  const [classSessions, setClassSessions] = useState<AdminSession[]>([]);
  const [loadingClassDetails, setLoadingClassDetails] = useState(false);
  
  // Dialogs
  const [addClassDialogOpen, setAddClassDialogOpen] = useState(false);
  const [addSessionDialogOpen, setAddSessionDialogOpen] = useState(false);
  const [editClassDialogOpen, setEditClassDialogOpen] = useState(false);
  
  // Form states
  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    description: '',
    category: '',
    level: 'Beginner',
    capacity: '',
    credits: '',
    duration: '',
    tutor_id: '',
    start_date: '',
    end_date: '',
  });
  
  const [sessionForm, setSessionForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    teacher_id: '',
    class_id: '',
    subject: '',
    year_level: '',
    location: '',
    session_type: 'group' as '1:1' | 'group',
    student_ids: [] as number[],
  });
  
  // Options
  const [tutors, setTutors] = useState<AdminUser[]>([]);
  const [students, setStudents] = useState<AdminUser[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(12);
  const [totalClasses, setTotalClasses] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Fetch classes
  const fetchClasses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        per_page: perPage,
        page: currentPage,
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      if (searchTerm) {
        params.search = searchTerm;
      }

      const result = await adminApi.getClasses(params);
      setClasses(result.classes);
      setTotalClasses(result.total);
      setLastPage(result.last_page);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch classes');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch classes',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch tutors and students for dropdowns
  const fetchTutorsAndStudents = async () => {
    try {
      const [tutorsResult, studentsResult] = await Promise.all([
        adminApi.getUsers({ role: 'tutor', per_page: 100 }),
        adminApi.getUsers({ role: 'student', per_page: 100 }),
      ]);
      setTutors(tutorsResult.users);
      setStudents(studentsResult.users);
    } catch (err) {
      console.error('Failed to fetch tutors/students:', err);
    }
  };

  // Fetch class details with sessions and assignments
  const fetchClassDetails = async (classId: number) => {
    try {
      setLoadingClassDetails(true);
      setClassDetails(null); // Clear previous data
      setClassSessions([]);
      
      console.log('Fetching class details for ID:', classId);
      
      // Fetch class details - it already includes schedules, assignments, and students
      const classData = await adminApi.getClass(classId);
      
      console.log('Class details loaded:', classData);
      console.log('Has students?', !!classData.students, classData.students?.length);
      console.log('Has assignments?', !!classData.assignments, classData.assignments?.length);
      console.log('Has schedules?', !!classData.schedules, classData.schedules?.length);
      
      if (!classData) {
        throw new Error('No class data received');
      }
      
      setClassDetails(classData);
      
      // Also fetch tutoring sessions separately (these are different from class schedules)
      try {
        const sessions = await adminApi.getSessions({ class_id: classId, per_page: 50 });
        console.log('Tutoring sessions loaded:', sessions);
        setClassSessions(sessions);
      } catch (sessionErr) {
        console.warn('Could not fetch tutoring sessions:', sessionErr);
        // Continue without sessions - not critical
      }
    } catch (err: any) {
      console.error('Error fetching class details:', err);
      console.error('Error stack:', err.stack);
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch class details',
        variant: "destructive",
      });
      setClassDetails(null);
    } finally {
      setLoadingClassDetails(false);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTutorsAndStudents();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchClasses();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const handleCreateClass = async () => {
    try {
      if (!classForm.name || !classForm.code || !classForm.tutor_id) {
    toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Get tutor ID from user ID
      const tutorUser = tutors.find(t => t.id === parseInt(classForm.tutor_id));
      if (!tutorUser || !tutorUser.tutor) {
        toast({
          title: "Error",
          description: "Selected tutor not found",
          variant: "destructive",
        });
        return;
      }

      await adminApi.createClass({
        name: classForm.name,
        code: classForm.code,
        description: classForm.description || undefined,
        category: classForm.category || undefined,
        level: classForm.level as 'Beginner' | 'Intermediate' | 'Advanced',
        capacity: classForm.capacity ? parseInt(classForm.capacity) : undefined,
        credits: classForm.credits ? parseInt(classForm.credits) : undefined,
        duration: classForm.duration || undefined,
        tutor_id: tutorUser.tutor.id,
        start_date: classForm.start_date || undefined,
        end_date: classForm.end_date || undefined,
        status: 'active',
      });

      toast({
        title: "Success",
        description: "Class created successfully",
      });
      
      setAddClassDialogOpen(false);
      setClassForm({
        name: '',
        code: '',
        description: '',
        category: '',
        level: 'Beginner',
        capacity: '',
        credits: '',
        duration: '',
        tutor_id: '',
        start_date: '',
        end_date: '',
      });
      fetchClasses();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to create class',
        variant: "destructive",
      });
    }
  };

  const handleCreateSession = async () => {
    try {
      if (!sessionForm.date || !sessionForm.start_time || !sessionForm.end_time || 
          !sessionForm.teacher_id || !sessionForm.subject || !sessionForm.location) {
    toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      // Get tutor ID from user ID - need to find the tutor record
      const tutorUser = tutors.find(t => t.id === parseInt(sessionForm.teacher_id));
      if (!tutorUser) {
        toast({
          title: "Error",
          description: "Selected tutor not found",
          variant: "destructive",
        });
        return;
      }

      // The teacher_id should be the tutor's ID, not the user ID
      // We need to get the tutor record ID. Since we have the user, we need to fetch the tutor
      // For now, let's assume the API accepts user_id and converts it, or we need to pass tutor.id
      // Let me check the API - it expects tutor.id (teacher_id), so we need tutor.tutor.id
      const tutorId = tutorUser.tutor?.id;
      if (!tutorId) {
        toast({
          title: "Error",
          description: "Tutor record not found for selected user",
          variant: "destructive",
        });
        return;
      }

      await adminApi.createSession({
        date: sessionForm.date,
        start_time: sessionForm.start_time,
        end_time: sessionForm.end_time,
        teacher_id: tutorId,
        class_id: sessionForm.class_id ? parseInt(sessionForm.class_id) : undefined,
        subject: sessionForm.subject,
        year_level: sessionForm.year_level || undefined,
        location: sessionForm.location,
        session_type: sessionForm.session_type,
        student_ids: sessionForm.session_type === '1:1' && sessionForm.student_ids.length > 0 
          ? sessionForm.student_ids 
          : undefined,
      });

      toast({
        title: "Success",
        description: "Session created successfully",
      });
      
      setAddSessionDialogOpen(false);
      setSessionForm({
        date: '',
        start_time: '',
        end_time: '',
        teacher_id: '',
        class_id: '',
        subject: '',
        year_level: '',
        location: '',
        session_type: 'group',
        student_ids: [],
      });
      
      if (selectedClass) {
        fetchClassDetails(selectedClass.id);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to create session',
        variant: "destructive",
      });
    }
  };

  const handleDeleteClass = async (classId: number) => {
    if (!confirm('Are you sure you want to delete this class? This action cannot be undone.')) {
      return;
    }

    try {
      await adminApi.deleteClass(classId);
      toast({
        title: "Success",
        description: "Class deleted successfully",
      });
      fetchClasses();
    } catch (err: any) {
    toast({
        title: "Error",
        description: err.message || 'Failed to delete class',
        variant: "destructive",
      });
    }
  };

  const handleEditClass = (cls: AdminClass) => {
    setSelectedClass(cls);
    setClassForm({
      name: cls.name,
      code: cls.code,
      description: cls.description || '',
      category: cls.category || '',
      level: cls.level || 'Beginner',
      capacity: cls.capacity?.toString() || '',
      credits: cls.credits?.toString() || '',
      duration: cls.duration || '',
      tutor_id: cls.tutor_id.toString(),
      start_date: cls.start_date || '',
      end_date: cls.end_date || '',
    });
    setEditClassDialogOpen(true);
  };

  const handleUpdateClass = async () => {
    if (!selectedClass) return;

    try {
      // Get tutor ID from user ID
      const tutorUser = tutors.find(t => t.id === parseInt(classForm.tutor_id));
      if (!tutorUser || !tutorUser.tutor) {
        toast({
          title: "Error",
          description: "Selected tutor not found",
          variant: "destructive",
        });
        return;
      }

      await adminApi.updateClass(selectedClass.id, {
        name: classForm.name,
        code: classForm.code,
        description: classForm.description || undefined,
        category: classForm.category || undefined,
        level: classForm.level as 'Beginner' | 'Intermediate' | 'Advanced',
        capacity: classForm.capacity ? parseInt(classForm.capacity) : undefined,
        credits: classForm.credits ? parseInt(classForm.credits) : undefined,
        duration: classForm.duration || undefined,
        tutor_id: tutorUser.tutor.id,
        start_date: classForm.start_date || undefined,
        end_date: classForm.end_date || undefined,
      });

      toast({
        title: "Success",
        description: "Class updated successfully",
      });
      
      setEditClassDialogOpen(false);
      setSelectedClass(null);
      fetchClasses();
    } catch (err: any) {
    toast({
        title: "Error",
        description: err.message || 'Failed to update class',
        variant: "destructive",
      });
    }
  };

  const getTutorName = (cls: AdminClass) => {
    return cls.tutor?.user?.name || 'Unknown Tutor';
  };

  const getEnrolledCount = (cls: AdminClass) => {
    return cls.students?.length || cls.enrolled || 0;
  };

  const getCapacity = (cls: AdminClass) => {
    return cls.capacity || 0;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Class Management</h1>
          <p className="text-muted-foreground">
            Manage classes, sessions, and course schedules
          </p>
        </div>
        <Dialog open={addClassDialogOpen} onOpenChange={setAddClassDialogOpen}>
          <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Add a new class to the system
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="className">Class Name *</Label>
                  <Input 
                    id="className" 
                    placeholder="Enter class name"
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classCode">Class Code *</Label>
                  <Input 
                    id="classCode" 
                    placeholder="Enter class code"
                    value={classForm.code}
                    onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classDescription">Description</Label>
                <Textarea 
                  id="classDescription" 
                  placeholder="Enter class description"
                  value={classForm.description}
                  onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classCategory">Category</Label>
                  <Input 
                    id="classCategory" 
                    placeholder="e.g., Computer Science"
                    value={classForm.category}
                    onChange={(e) => setClassForm({ ...classForm, category: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classLevel">Level *</Label>
                  <Select 
                    value={classForm.level} 
                    onValueChange={(value) => setClassForm({ ...classForm, level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Beginner">Beginner</SelectItem>
                      <SelectItem value="Intermediate">Intermediate</SelectItem>
                      <SelectItem value="Advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classCapacity">Capacity</Label>
                  <Input 
                    id="classCapacity" 
                    type="number"
                    placeholder="e.g., 25"
                    value={classForm.capacity}
                    onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classCredits">Credits</Label>
                  <Input 
                    id="classCredits" 
                    type="number"
                    placeholder="e.g., 3"
                    value={classForm.credits}
                    onChange={(e) => setClassForm({ ...classForm, credits: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classDuration">Duration</Label>
                  <Input 
                    id="classDuration" 
                    placeholder="e.g., 12 weeks"
                    value={classForm.duration}
                    onChange={(e) => setClassForm({ ...classForm, duration: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="classTutor">Tutor *</Label>
                <Select 
                  value={classForm.tutor_id} 
                  onValueChange={(value) => setClassForm({ ...classForm, tutor_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tutor" />
                  </SelectTrigger>
                  <SelectContent>
                    {tutors.map((tutor) => (
                      <SelectItem key={tutor.id} value={tutor.id.toString()}>
                        {tutor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="classStartDate">Start Date</Label>
                  <Input 
                    id="classStartDate" 
                    type="date"
                    value={classForm.start_date}
                    onChange={(e) => setClassForm({ ...classForm, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="classEndDate">End Date</Label>
                  <Input 
                    id="classEndDate" 
                    type="date"
                    value={classForm.end_date}
                    onChange={(e) => setClassForm({ ...classForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddClassDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateClass}>
                  Create Class
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes, codes, or tutors..."
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
            <SelectItem value="all">All Classes</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          More Filters
        </Button>
      </div>

      {/* Classes Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-destructive">{error}</div>
      ) : classes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No classes found matching your criteria.</p>
        </div>
      ) : (
        <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {classes.map((cls) => (
          <Card key={cls.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                  <CardDescription>{cls.code}</CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedClass(cls);
                          fetchClassDetails(cls.id);
                        }}>
                          View Details
                    </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditClass(cls)}>
                          Edit Class
                    </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteClass(cls.id)}
                        >
                          Delete Class
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant={getStatusColor(cls.status)}>
                  {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="mr-2 h-4 w-4" />
                      {getEnrolledCount(cls)}/{getCapacity(cls)} students
                </div>
                    {cls.schedules && cls.schedules.length > 0 && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                        {cls.schedules[0].day_of_week} • {cls.schedules[0].start_time} - {cls.schedules[0].end_time}
                </div>
                    )}
                    {cls.schedules && cls.schedules.length > 0 && cls.schedules[0].room && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="mr-2 h-4 w-4" />
                        {cls.schedules[0].room}
                </div>
                    )}
              </div>

              <div className="pt-2">
                <p className="text-sm font-medium text-foreground">
                      {getTutorName(cls)}
                </p>
                    {cls.category && cls.level && (
                <p className="text-xs text-muted-foreground">
                  {cls.category} • {cls.level}
                </p>
                    )}
              </div>

                  <Sheet onOpenChange={(open) => {
                    if (open) {
                      setSelectedClass(cls);
                      fetchClassDetails(cls.id);
                    } else {
                      setClassDetails(null);
                      setClassSessions([]);
                    }
                  }}>
                <SheetTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    View Details
                  </Button>
                </SheetTrigger>
                    <SheetContent className="!w-[95vw] md:!w-[1000px] lg:!w-[1200px] xl:!w-[1400px] !max-w-[1400px] overflow-y-auto [&[data-state]]:!duration-200">
                  <SheetHeader>
                        <SheetTitle>{classDetails?.name || cls.name}</SheetTitle>
                    <SheetDescription>
                          {classDetails?.code || cls.code} • {getTutorName(classDetails || cls)}
                    </SheetDescription>
                  </SheetHeader>
                  
                      {loadingClassDetails ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="ml-2 text-sm text-muted-foreground">Loading class details...</span>
                        </div>
                      ) : classDetails ? (
                    <div className="space-y-6 mt-6">
                          {/* Class Info Card */}
                          <Card className="border-2">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Class Information
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {classDetails.description && (
                                <p className="text-sm text-muted-foreground leading-relaxed bg-muted/50 p-3 rounded-lg">
                                  {classDetails.description}
                                </p>
                              )}
                              <div className="grid grid-cols-2 gap-4">
                                {classDetails.duration && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration</p>
                                    <p className="text-base font-semibold">{classDetails.duration}</p>
                          </div>
                                )}
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Capacity</p>
                                  <p className="text-base font-semibold">
                                    <span className="text-primary">{getEnrolledCount(classDetails)}</span>
                                    <span className="text-muted-foreground">/{getCapacity(classDetails)}</span>
                                  </p>
                          </div>
                                {classDetails.start_date && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</p>
                                    <p className="text-base font-semibold">
                                      {new Date(classDetails.start_date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })}
                            </p>
                          </div>
                                )}
                                {classDetails.end_date && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End Date</p>
                                    <p className="text-base font-semibold">
                                      {new Date(classDetails.end_date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric', 
                                        year: 'numeric' 
                                      })}
                            </p>
                          </div>
                                )}
                                {classDetails.category && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Category</p>
                                    <Badge variant="secondary" className="text-sm">{classDetails.category}</Badge>
                        </div>
                                )}
                                {classDetails.level && (
                                  <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Level</p>
                                    <Badge variant="outline" className="text-sm">{classDetails.level}</Badge>
                        </div>
                                )}
                      </div>
                            </CardContent>
                          </Card>

                          {/* Students */}
                          {classDetails.students && classDetails.students.length > 0 && (
                            <Card className="border-2">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Users className="h-5 w-5 text-primary" />
                                  Students
                                  <Badge variant="secondary" className="ml-auto">{classDetails.students.length}</Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                  {classDetails.students.map((student) => (
                                    <div key={student.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Users className="h-5 w-5 text-primary" />
                              </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold truncate">{student.user?.name || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground truncate">{student.user?.email || ''}</p>
                                        {student.grade && (
                                          <Badge variant="outline" className="mt-1 text-xs">{student.grade}</Badge>
                                        )}
                                      </div>
                            </div>
                          ))}
                        </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Assignments */}
                          <Card className="border-2">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Assignments
                                {classDetails.assignments && classDetails.assignments.length > 0 && (
                                  <Badge variant="secondary" className="ml-auto">{classDetails.assignments.length}</Badge>
                                )}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              {classDetails.assignments && classDetails.assignments.length > 0 ? (
                                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                  {classDetails.assignments.map((assignment) => (
                                    <div key={assignment.id} className="p-4 border-2 rounded-lg bg-card hover:shadow-md transition-shadow">
                                      <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-start gap-3 flex-1">
                                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <BookOpen className="h-5 w-5 text-primary" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-base mb-1 line-clamp-2">{assignment.title}</h4>
                                            {assignment.description && (
                                              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{assignment.description}</p>
                                            )}
                                          </div>
                                        </div>
                                        <Badge 
                                          variant={assignment.status === 'published' ? 'default' : 'secondary'}
                                          className="shrink-0"
                                        >
                                          {assignment.status}
                                        </Badge>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-3 text-xs">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-muted rounded-md">
                                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                          <span className="font-medium">
                                            Due: {new Date(assignment.due_date).toLocaleDateString('en-US', { 
                                              month: 'short', 
                                              day: 'numeric', 
                                              year: 'numeric' 
                                            })}
                                          </span>
                                        </div>
                                        {assignment.max_points && (
                                          <div className="px-2 py-1 bg-blue-50 dark:bg-blue-950 rounded-md">
                                            <span className="font-medium text-blue-700 dark:text-blue-300">
                                              {assignment.max_points} pts
                                            </span>
                                          </div>
                                        )}
                                        {assignment.submissions_count !== undefined && (
                                          <div className="px-2 py-1 bg-green-50 dark:bg-green-950 rounded-md">
                                            <span className="font-medium text-green-700 dark:text-green-300">
                                              {assignment.submissions_count} submissions
                                            </span>
                                          </div>
                                        )}
                                        {assignment.graded_count !== undefined && (
                                          <div className="px-2 py-1 bg-purple-50 dark:bg-purple-950 rounded-md">
                                            <span className="font-medium text-purple-700 dark:text-purple-300">
                                              {assignment.graded_count} graded
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-8 text-muted-foreground">
                                  <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No assignments yet</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Class Schedules */}
                          {classDetails.schedules && classDetails.schedules.length > 0 && (
                            <Card className="border-2">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Calendar className="h-5 w-5 text-primary" />
                                  Class Schedule
                                  <Badge variant="secondary" className="ml-auto">{classDetails.schedules.length}</Badge>
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                  {classDetails.schedules.map((schedule) => (
                                    <div key={schedule.id} className="p-4 border-2 rounded-lg bg-card hover:shadow-md transition-shadow">
                                      <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                          <Calendar className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-2">
                                            <p className="font-semibold text-base">{schedule.day_of_week}</p>
                                          </div>
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-medium text-muted-foreground">
                                              {schedule.start_time} - {schedule.end_time}
                                            </span>
                                          </div>
                                          {schedule.room && (
                                            <div className="flex items-center gap-2 mb-2">
                                              <MapPin className="h-4 w-4 text-muted-foreground" />
                                              <span className="text-sm text-muted-foreground">{schedule.room}</span>
                                            </div>
                                          )}
                                          {schedule.meeting_link && (
                                            <a 
                                              href={schedule.meeting_link} 
                                              target="_blank" 
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mt-1"
                                            >
                                              <span>Join Meeting</span>
                                              <span>→</span>
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Tutoring Sessions */}
                          <Card className="border-2">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <Calendar className="h-5 w-5 text-primary" />
                                  Tutoring Sessions
                                  <Badge variant="secondary" className="ml-auto">{classSessions.length}</Badge>
                                </CardTitle>
                        <Button 
                          variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSessionForm({
                                      ...sessionForm,
                                      class_id: classDetails.id.toString(),
                                      subject: classDetails.name,
                                    });
                                    setAddSessionDialogOpen(true);
                                  }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                                  Schedule Session
                        </Button>
                      </div>
                            </CardHeader>
                            <CardContent>
                              {classSessions.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                  <p className="text-sm">No tutoring sessions scheduled</p>
                                </div>
                              ) : (
                                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                  {classSessions.map((session) => (
                                    <div key={session.id} className="p-4 border-2 rounded-lg bg-card hover:shadow-md transition-shadow">
                                      <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1">
                                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Calendar className="h-5 w-5 text-primary" />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                              <p className="font-semibold text-base">
                                                {new Date(session.date).toLocaleDateString('en-US', { 
                                                  month: 'short', 
                                                  day: 'numeric', 
                                                  year: 'numeric' 
                                                })}
                                              </p>
                                            </div>
                                            <p className="text-sm font-medium text-muted-foreground mb-2">
                                              {session.start_time} - {session.end_time}
                                            </p>
                                            {session.location && (
                                              <div className="flex items-center gap-2 mb-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm text-muted-foreground">{session.location}</span>
                                              </div>
                                            )}
                                            {session.subject && (
                                              <Badge variant="outline" className="text-xs mt-1">{session.subject}</Badge>
                                            )}
                                          </div>
                                        </div>
                                        <Badge variant="outline" className="shrink-0">{session.status}</Badge>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </CardContent>
                          </Card>

                          {/* Grading */}
                          {classDetails.assignments && classDetails.assignments.length > 0 && (
                            <Card className="border-2">
                              <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                  <BookOpen className="h-5 w-5 text-primary" />
                                  Grading Overview
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                      <div className="space-y-4">
                                  {classDetails.assignments.map((assignment) => (
                                    <div key={assignment.id} className="border-2 rounded-lg p-4 bg-card">
                                      <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                          <h4 className="font-semibold text-base mb-1">{assignment.title}</h4>
                                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span>
                                              {assignment.submissions_count || 0} submissions
                                            </span>
                                            <span>•</span>
                                            <span>
                                              {assignment.graded_count || 0} graded
                                            </span>
                      </div>
                                        </div>
                                        {assignment.max_points && (
                                          <Badge variant="outline" className="shrink-0">
                                            {assignment.max_points} points
                                          </Badge>
                                        )}
                                      </div>
                                      {assignment.submissions && assignment.submissions.length > 0 ? (
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                          {assignment.submissions.map((submission) => (
                                            <div key={submission.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold truncate">
                                                  {submission.student?.user?.name || 'Unknown Student'}
                                                </p>
                                                {submission.submitted_at && (
                                                  <p className="text-xs text-muted-foreground mt-0.5">
                                                    Submitted: {new Date(submission.submitted_at).toLocaleDateString('en-US', { 
                                                      month: 'short', 
                                                      day: 'numeric', 
                                                      year: 'numeric' 
                                                    })}
                                                  </p>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 shrink-0 ml-3">
                                                {submission.grade !== null && submission.grade !== undefined ? (
                                                  <>
                                                    <span className="text-sm font-bold text-primary">
                                                      {submission.grade}
                                                      {assignment.max_points && `/${assignment.max_points}`}
                                                    </span>
                                                    <Badge variant="default" className="text-xs">
                                                      Graded
                                                    </Badge>
                                                  </>
                                                ) : (
                                                  <Badge variant="secondary" className="text-xs">
                                                    Pending
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <div className="text-center py-6 text-muted-foreground">
                                          <p className="text-sm">No submissions yet</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                      </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>Click "View Details" to load class information</p>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        ))}
      </div>
        </>
      )}

      {/* Create Session Dialog */}
      <Dialog open={addSessionDialogOpen} onOpenChange={setAddSessionDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule New Session</DialogTitle>
            <DialogDescription>
              Create a new tutoring session for a class or individual students
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionDate">Date *</Label>
                <Input 
                  id="sessionDate" 
                  type="date"
                  value={sessionForm.date}
                  onChange={(e) => setSessionForm({ ...sessionForm, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionType">Session Type *</Label>
                <Select 
                  value={sessionForm.session_type} 
                  onValueChange={(value: '1:1' | 'group') => setSessionForm({ ...sessionForm, session_type: value, student_ids: [] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="group">Group (Class)</SelectItem>
                    <SelectItem value="1:1">1:1 (Individual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionStartTime">Start Time *</Label>
                <Input 
                  id="sessionStartTime" 
                  type="time"
                  value={sessionForm.start_time}
                  onChange={(e) => setSessionForm({ ...sessionForm, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionEndTime">End Time *</Label>
                <Input 
                  id="sessionEndTime" 
                  type="time"
                  value={sessionForm.end_time}
                  onChange={(e) => setSessionForm({ ...sessionForm, end_time: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTutor">Tutor *</Label>
              <Select 
                value={sessionForm.teacher_id} 
                onValueChange={(value) => setSessionForm({ ...sessionForm, teacher_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id.toString()}>
                      {tutor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {sessionForm.session_type === 'group' && (
              <div className="space-y-2">
                <Label htmlFor="sessionClass">Class (Optional)</Label>
                <Select 
                  value={sessionForm.class_id} 
                  onValueChange={(value) => setSessionForm({ ...sessionForm, class_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name} ({cls.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
        </div>
      )}
            <div className="space-y-2">
              <Label htmlFor="sessionSubject">Subject *</Label>
              <Input 
                id="sessionSubject" 
                placeholder="Enter subject"
                value={sessionForm.subject}
                onChange={(e) => setSessionForm({ ...sessionForm, subject: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sessionYearLevel">Year Level</Label>
                <Input 
                  id="sessionYearLevel" 
                  placeholder="e.g., Grade 12"
                  value={sessionForm.year_level}
                  onChange={(e) => setSessionForm({ ...sessionForm, year_level: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionLocation">Location *</Label>
                <Input 
                  id="sessionLocation" 
                  placeholder="e.g., Room 201, Online"
                  value={sessionForm.location}
                  onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })}
                />
              </div>
            </div>
            {sessionForm.session_type === '1:1' && (
              <div className="space-y-2">
                <Label>Select Students *</Label>
                <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2 py-2">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={sessionForm.student_ids.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSessionForm({
                              ...sessionForm,
                              student_ids: [...sessionForm.student_ids, student.id],
                            });
                          } else {
                            setSessionForm({
                              ...sessionForm,
                              student_ids: sessionForm.student_ids.filter(id => id !== student.id),
                            });
                          }
                        }}
                      />
                      <label
                        htmlFor={`student-${student.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {student.name}
                      </label>
                    </div>
                  ))}
                </div>
        </div>
      )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddSessionDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSession}>
                Create Session
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Class Dialog */}
      <Dialog open={editClassDialogOpen} onOpenChange={setEditClassDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Class</DialogTitle>
            <DialogDescription>
              Update class information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editClassName">Class Name *</Label>
                <Input 
                  id="editClassName" 
                  placeholder="Enter class name"
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editClassCode">Class Code *</Label>
                <Input 
                  id="editClassCode" 
                  placeholder="Enter class code"
                  value={classForm.code}
                  onChange={(e) => setClassForm({ ...classForm, code: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editClassDescription">Description</Label>
              <Textarea 
                id="editClassDescription" 
                placeholder="Enter class description"
                value={classForm.description}
                onChange={(e) => setClassForm({ ...classForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editClassCategory">Category</Label>
                <Input 
                  id="editClassCategory" 
                  placeholder="e.g., Computer Science"
                  value={classForm.category}
                  onChange={(e) => setClassForm({ ...classForm, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editClassLevel">Level *</Label>
                <Select 
                  value={classForm.level} 
                  onValueChange={(value) => setClassForm({ ...classForm, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editClassCapacity">Capacity</Label>
                <Input 
                  id="editClassCapacity" 
                  type="number"
                  placeholder="e.g., 25"
                  value={classForm.capacity}
                  onChange={(e) => setClassForm({ ...classForm, capacity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editClassCredits">Credits</Label>
                <Input 
                  id="editClassCredits" 
                  type="number"
                  placeholder="e.g., 3"
                  value={classForm.credits}
                  onChange={(e) => setClassForm({ ...classForm, credits: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editClassDuration">Duration</Label>
                <Input 
                  id="editClassDuration" 
                  placeholder="e.g., 12 weeks"
                  value={classForm.duration}
                  onChange={(e) => setClassForm({ ...classForm, duration: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editClassTutor">Tutor *</Label>
              <Select 
                value={classForm.tutor_id} 
                onValueChange={(value) => setClassForm({ ...classForm, tutor_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select tutor" />
                </SelectTrigger>
                <SelectContent>
                  {tutors.map((tutor) => (
                    <SelectItem key={tutor.id} value={tutor.id.toString()}>
                      {tutor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editClassStartDate">Start Date</Label>
                <Input 
                  id="editClassStartDate" 
                  type="date"
                  value={classForm.start_date}
                  onChange={(e) => setClassForm({ ...classForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editClassEndDate">End Date</Label>
                <Input 
                  id="editClassEndDate" 
                  type="date"
                  value={classForm.end_date}
                  onChange={(e) => setClassForm({ ...classForm, end_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditClassDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateClass}>
                Update Class
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
