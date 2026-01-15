import { useState, useEffect } from 'react';
import { Search, Mail, Phone, MoreHorizontal, FileText, TrendingUp, X, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '@/components/ui/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { tutorApi } from '@/lib/api';
import { StudentProgressModal } from '@/components/modals/StudentProgressModal';
import { StudentAssignmentsModal } from '@/components/modals/StudentAssignmentsModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Student {
  id: string;
  name: string;
  family: string;
  email: string;
  mobilePhone: string;
  homePhone: string;
  avatar: string;
  enrollmentId: string;
  grade: string;
  classes: string[];
  overallGrade: number;
  attendance: number;
  assignments: {
    completed: number;
    total: number;
  };
  status: 'active' | 'inactive' | 'warning';
  type: 'Child' | 'Adult';
}

export default function TutorStudents() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [students, setStudents] = useState<Student[]>([]);
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showAssignmentsModal, setShowAssignmentsModal] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<{ studentId: string; studentName: string; classIds: number[] } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch students and classes from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [studentsResponse, classesData] = await Promise.all([
          tutorApi.getStudents({ per_page: 100 }), // Get all students
          tutorApi.getClasses(),
        ]);

        console.log('Students response from API:', studentsResponse);
        
        // Handle paginated response - getStudents returns array directly, but check if it's wrapped
        let studentsList: any[] = [];
        if (Array.isArray(studentsResponse)) {
          studentsList = studentsResponse;
        } else if (studentsResponse?.data && Array.isArray(studentsResponse.data)) {
          studentsList = studentsResponse.data;
        }
        
        console.log('Students list to map:', studentsList);
        const mappedStudents: Student[] = studentsList.map((student: any) => {
          const userName = student.user?.name || '';
          const nameParts = userName.split(' ');
          const lastName = nameParts[nameParts.length - 1] || '';
          const firstName = nameParts.slice(0, -1).join(' ') || lastName;
          const fullName = lastName ? `${lastName}, ${firstName}` : userName;

          // Determine status based on overall_grade
          let status: 'active' | 'inactive' | 'warning' = 'active';
          if (student.overall_grade !== undefined && student.overall_grade !== null) {
            if (student.overall_grade < 70) {
              status = 'warning';
            } else if (student.overall_grade >= 70) {
              status = 'active';
            }
          }

          return {
            id: String(student.id),
            name: fullName || `Student ${student.id}`,
            family: lastName || '',
            email: student.user?.email || '',
            mobilePhone: student.user?.phone || '',
            homePhone: student.emergency_contact_phone || '',
            avatar: student.user?.avatar || '',
            enrollmentId: student.enrollment_id || `ST${student.id}`,
            grade: student.grade || '',
            classes: [], // Can be populated from class relationships if needed
            overallGrade: (student.overall_grade !== null && student.overall_grade !== undefined && !isNaN(Number(student.overall_grade))) 
              ? Number(student.overall_grade) 
              : 0,
            attendance: 0, // Can be calculated from attendance records if available
            assignments: {
              completed: student.completed_assignments || 0,
              total: student.total_assignments || 0,
            },
            status: status,
            type: student.user?.date_of_birth ? 'Child' : 'Adult',
          };
        });

        console.log('Mapped students:', mappedStudents);
        console.log('Students with grades:', mappedStudents.filter(s => s.overallGrade > 0));
        console.log('Overall grades:', mappedStudents.map(s => ({ id: s.id, name: s.name, grade: s.overallGrade })));
        setStudents(mappedStudents);
        setMyClasses(classesData || []);
      } catch (error) {
        console.error('Failed to load students:', error);
        toast({
          title: 'Error',
          description: 'Failed to load students data',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const getStatusColor = (status: Student['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getGradeColor = (grade: number) => {
    if (grade >= 90) return 'text-green-600 dark:text-green-400';
    if (grade >= 80) return 'text-blue-600 dark:text-blue-400';
    if (grade >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.enrollmentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For class filter, we'll need to check if student is enrolled in the selected class
    // For now, if 'all' is selected, show all students
    const matchesClass = selectedClass === 'all' || true; // TODO: Implement class filtering when class-student relationship is available
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClass, statusFilter]);

  const handleViewProgress = (student: Student) => {
    setSelectedStudent(student);
    setShowProgressModal(true);
  };

  const handleViewAssignments = (student: Student) => {
    setSelectedStudent(student);
    setShowAssignmentsModal(true);
  };

  const handleRemoveStudent = (student: Student) => {
    // Get class IDs from student's classes or from myClasses
    const classIds = myClasses.map(c => Number(c.id));
    setStudentToRemove({
      studentId: student.id,
      studentName: student.name,
      classIds: classIds
    });
    setShowRemoveDialog(true);
  };

  const confirmRemoveStudent = async () => {
    if (!studentToRemove) return;

    try {
      setIsRemoving(true);
      // Remove student from all classes
      await Promise.all(
        studentToRemove.classIds.map(classId =>
          tutorApi.removeStudentFromClass(Number(studentToRemove.studentId), classId)
        )
      );

      // Remove student from local state
      setStudents(prev => prev.filter(s => s.id !== studentToRemove.studentId));

      toast({
        title: "Student Removed",
        description: `${studentToRemove.studentName} has been removed from your classes.`,
      });

      setShowRemoveDialog(false);
      setStudentToRemove(null);
    } catch (error: any) {
      console.error('Failed to remove student:', error);
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to remove student. Please try again.",
        variant: 'destructive',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  // Calculate stats with proper handling for empty data
  const studentsWithGrades = students.filter(s => s.overallGrade !== null && s.overallGrade !== undefined && s.overallGrade > 0 && !isNaN(s.overallGrade));
  const avgGrade = studentsWithGrades.length > 0
    ? Math.round(studentsWithGrades.reduce((acc, s) => acc + s.overallGrade, 0) / studentsWithGrades.length)
    : 0;
  

  const stats = {
    totalStudents: students.length,
    activeStudents: students.filter(s => s.status === 'active').length,
    warningStudents: students.filter(s => s.status === 'warning').length,
    avgGrade: avgGrade,
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Students</h1>
          <p className="text-muted-foreground">
            Monitor student progress and manage your class roster
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.warningStudents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Grade</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.avgGrade > 0 ? getGradeColor(stats.avgGrade) : 'text-muted-foreground'}`}>
              {stats.avgGrade > 0 ? `${stats.avgGrade}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students by name, email, or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[180px]">
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
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Students Table View - Compact and Scrollable */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Assigned Students ({students.length})</CardTitle>
                  <CardDescription>
                    Manage your class roster. Showing {paginatedStudents.length} of {filteredStudents.length} students.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="rounded-md border max-h-[600px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[200px]">Student (Family)</TableHead>
                        <TableHead className="w-[200px]">Email</TableHead>
                        <TableHead className="w-[120px]">Mobile Phone</TableHead>
                        <TableHead className="w-[120px]">Home Phone</TableHead>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead className="w-[100px]">Status</TableHead>
                        <TableHead className="w-[80px]">Grade</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            {students.length === 0 ? 'No students assigned to you yet.' : 'No students found matching your filters.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={student.avatar} alt={student.name} />
                                <AvatarFallback className="text-xs">
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div>{student.name}</div>
                                <div className="text-xs text-muted-foreground">{student.enrollmentId}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {student.email ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3" />
                                {student.email}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.mobilePhone ? (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {student.mobilePhone}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {student.homePhone ? (
                              <span className="text-sm">{student.homePhone}</span>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{student.type}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(student.status)}>
                              {student.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-medium ${getGradeColor(student.overallGrade)}`}>
                              {student.overallGrade}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewProgress(student)}>
                                  <TrendingUp className="mr-2 h-4 w-4" />
                                  View Progress
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewAssignments(student)}>
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Assignments
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleRemoveStudent(student)}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Remove Student
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination */}
          {!isLoading && totalPages > 1 && filteredStudents.length > 0 && (
            <div className="flex items-center justify-center mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(prev => prev - 1);
                      }}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      href="#"
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // For small page counts, show all pages
                    if (totalPages <= 7) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                            href="#"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    
                    // For larger page counts, show first, last, current, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                            href="#"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  <PaginationItem>
                    <PaginationNext 
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
                      }}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      href="#"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
      </div>

      {/* Modals */}
      {selectedStudent && (
        <>
          <StudentProgressModal
            studentId={selectedStudent.id}
            studentName={selectedStudent.name}
            isOpen={showProgressModal}
            onClose={() => {
              setShowProgressModal(false);
              setSelectedStudent(null);
            }}
          />
          <StudentAssignmentsModal
            studentId={selectedStudent.id}
            studentName={selectedStudent.name}
            isOpen={showAssignmentsModal}
            onClose={() => {
              setShowAssignmentsModal(false);
              setSelectedStudent(null);
            }}
          />
        </>
      )}

      {/* Remove Student Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {studentToRemove?.studentName} from your classes? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveStudent}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}