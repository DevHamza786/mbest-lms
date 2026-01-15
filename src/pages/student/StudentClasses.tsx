import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Calendar, Clock, Users, ExternalLink, Loader2, Search, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { ViewMaterialsModal } from '@/components/modals/ViewMaterialsModal';
import { ClassScheduleModal } from '@/components/modals/ClassScheduleModal';
import { useToast } from '@/hooks/use-toast';
import { studentApi } from '@/lib/api';

const StudentClasses = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [attendanceStats, setAttendanceStats] = useState({
    totalSessions: 0,
    present: 0,
    absent: 0,
  });
  const itemsPerPage = 6;
  const [materialsModal, setMaterialsModal] = useState<{ isOpen: boolean; classId: number | null; className: string }>({
    isOpen: false,
    classId: null,
    className: '',
  });
  const [scheduleModal, setScheduleModal] = useState<{ isOpen: boolean; classId: number | null; className: string; classData: any | null }>({
    isOpen: false,
    classId: null,
    className: '',
    classData: null,
  });

  useEffect(() => {
    const loadClasses = async () => {
      try {
        setIsLoading(true);
        const params: any = {
          per_page: 100,
          page: currentPage,
        };
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
        // Backend already filters to show only enrolled classes
        const response = await studentApi.getClasses(params);
        setAllClasses(response);
        setTotalCount(response.length);
      } catch (error) {
        console.error('Failed to load classes:', error);
        toast({
          title: 'Error',
          description: 'Failed to load classes',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadClasses();
  }, [toast, currentPage, statusFilter]);

  useEffect(() => {
    const loadAttendanceStats = async () => {
      try {
        const response = await studentApi.getAttendance();
        if (response.statistics) {
          setAttendanceStats({
            totalSessions: response.statistics.total_sessions || 0,
            present: response.statistics.present || 0,
            absent: response.statistics.absent || 0,
          });
        }
      } catch (error) {
        console.error('Failed to load attendance stats:', error);
        // Don't show error toast, just use default values
      }
    };

    loadAttendanceStats();
  }, []);

  useEffect(() => {
    // Filter and paginate classes
    let filtered = allClasses;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((classItem) =>
        classItem.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classItem.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        classItem.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((classItem) => classItem.status === statusFilter);
    }

    // Calculate pagination
    const total = filtered.length;
    setTotalPages(Math.ceil(total / itemsPerPage));
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setEnrolledClasses(filtered.slice(startIndex, endIndex));
    setTotalCount(total);
  }, [allClasses, searchQuery, statusFilter, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);
  
  const handleViewMaterials = (classItem: any) => {
    setMaterialsModal({ 
      isOpen: true, 
      classId: classItem.id,
      className: classItem.name || 'Class'
    });
  };
  
  const handleClassSchedule = (classItem: any) => {
    setScheduleModal({ 
      isOpen: true, 
      classId: classItem.id,
      className: classItem.name || 'Class',
      classData: classItem
    });
  };

  const formatSchedule = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return 'Not scheduled';
    const days = schedules.map(s => s.day_of_week).join(', ');
    const firstSchedule = schedules[0];
    const time = `${firstSchedule.start_time} - ${firstSchedule.end_time}`;
    return { days, time, room: firstSchedule.room || 'TBD' };
  };

  const getNextSession = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return null;
    // This would need to be calculated based on current date and schedules
    return null;
  };

  const calculateProgress = (classItem: any) => {
    // Progress calculation would need to be based on completed assignments/sessions
    // For now, return a placeholder
    return 0;
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Calculate stats from enrolled classes and attendance
  const totalClasses = allClasses.length;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground">
            Enrolled in {totalCount} {totalCount === 1 ? 'course' : 'courses'}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClasses}</div>
            <p className="text-xs text-muted-foreground">Enrolled classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendanceStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">All class sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Sessions</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{attendanceStats.present}</div>
            <p className="text-xs text-muted-foreground">Attended sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Sessions</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{attendanceStats.absent}</div>
            <p className="text-xs text-muted-foreground">Missed sessions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes by name, code, or description..."
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : enrolledClasses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No classes enrolled yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {enrolledClasses.map((classItem) => {
            const schedule = formatSchedule(classItem.schedules || []);
            const progress = calculateProgress(classItem);
            const tutorName = classItem.tutor?.user?.name || 'Tutor';
            const meetingLink = classItem.schedules?.[0]?.meeting_link;
            
            return (
              <Card key={classItem.id} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {classItem.name}
                      </CardTitle>
                      <CardDescription className="text-base">
                        {classItem.code} • {classItem.description || ''}
                      </CardDescription>
                    </div>
                    <Badge variant={classItem.status === 'active' ? 'default' : 'secondary'}>
                      {classItem.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Tutor:</span>
                        <span className="ml-1">{tutorName}</span>
                      </div>
                      
                      {schedule.days !== 'Not scheduled' && (
                        <>
                          <div className="flex items-center text-sm">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Schedule:</span>
                            <span className="ml-1">{schedule.days}</span>
                          </div>
                          
                          <div className="flex items-center text-sm">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Time:</span>
                            <span className="ml-1">{schedule.time}</span>
                          </div>
                          
                          <div className="text-sm">
                            <span className="font-medium">Location:</span>
                            <span className="ml-1">{schedule.room}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="space-y-3">
                      {progress > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium">Course Progress</span>
                            <span>{progress}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(progress)}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    {meetingLink && (
                      <Button size="sm" asChild>
                        <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Join Class
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => handleViewMaterials(classItem)}>
                      View Materials
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleClassSchedule(classItem)}>
                      Class Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount} classes
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || isLoading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modals */}
      <ViewMaterialsModal
        isOpen={materialsModal.isOpen}
        onClose={() => setMaterialsModal({ isOpen: false, classId: null, className: '' })}
        classId={materialsModal.classId}
        className={materialsModal.className}
      />
      
      <ClassScheduleModal
        isOpen={scheduleModal.isOpen}
        onClose={() => setScheduleModal({ isOpen: false, classId: null, className: '', classData: null })}
        classId={scheduleModal.classId}
        className={scheduleModal.className}
        classData={scheduleModal.classData}
      />
    </div>
  );
};

export default StudentClasses;