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
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  Search, 
  AlertCircle,
  Eye,
  GraduationCap
} from 'lucide-react';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useParentContext, useParentStore } from '@/lib/store/parentStore';
import { parentApi } from '@/lib/api';
import { ClassDetailsModal } from '@/components/modals/ClassDetailsModal';
import type { ParentClass } from '@/lib/store/parentStore';

export default function ParentClasses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<ParentClass | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  
  const {
    activeChild,
    classes,
    isLoading,
    stats,
  } = useParentContext();

  const {
    setClasses,
    setLoading,
  } = useParentStore();

  // Load classes when active child changes
  useEffect(() => {
    if (!activeChild?.id) return;

    const loadClasses = async () => {
      try {
        setLoading(true);
        const classesData = await parentApi.getChildClasses(Number(activeChild.id));
        
        // Map API response to store format
        const mappedClasses = classesData.map(cls => {
          // Format schedules day-wise
          const scheduleMap: { [key: string]: string[] } = {};
          cls.schedules.forEach(s => {
            if (!scheduleMap[s.day_of_week]) {
              scheduleMap[s.day_of_week] = [];
            }
            scheduleMap[s.day_of_week].push(`${s.start_time}-${s.end_time}`);
          });
          
          // Create formatted schedule string with day-wise times
          const scheduleString = Object.keys(scheduleMap)
            .map(day => {
              const times = scheduleMap[day].join(', ');
              return `${day}: ${times}`;
            })
            .join(' | ');
          
          return {
            id: String(cls.id),
            name: cls.name,
            tutor: cls.tutor.user.name,
            schedule: scheduleString || 'No schedule',
            scheduleData: cls.schedules, // Keep original for detailed view
            room: cls.schedules[0]?.room,
            meetingLink: cls.schedules[0]?.meeting_link,
            status: cls.status as 'active' | 'upcoming' | 'completed',
            isLive: false,
          };
        });
        
        setClasses(mappedClasses);
      } catch (error) {
        console.error('Failed to load classes:', error);
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, [activeChild?.id, setClasses, setLoading]);

  // Filter classes based on search and status
  const filteredClasses = classes?.filter((classItem) => {
    const matchesSearch = classItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         classItem.tutor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || classItem.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'upcoming': return 'secondary';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const handleViewClass = async (classItem: ParentClass) => {
    if (!activeChild?.id) return;
    
    try {
      // Fetch class details from API
      const classDetailsData = await parentApi.getChildClass(Number(activeChild.id), Number(classItem.id));
      
      if (!classDetailsData) {
        throw new Error('Class details not found');
      }
      
      // Format schedules day-wise
      const scheduleMap: { [key: string]: string[] } = {};
      if (classDetailsData.schedules && Array.isArray(classDetailsData.schedules)) {
        classDetailsData.schedules.forEach((s: any) => {
          if (!scheduleMap[s.day_of_week]) {
            scheduleMap[s.day_of_week] = [];
          }
          scheduleMap[s.day_of_week].push(`${s.start_time}-${s.end_time}`);
        });
      }
      
      const scheduleString = Object.keys(scheduleMap)
        .map(day => {
          const times = scheduleMap[day].join(', ');
          return `${day}: ${times}`;
        })
        .join(' | ') || classItem.schedule;
      
      // Convert API response to ClassDetails format
      const classDetails = {
        ...classItem,
        description: classDetailsData.description || `This is a comprehensive ${classItem.name} course designed to provide students with fundamental knowledge and practical skills.`,
        schedule: scheduleString,
        duration: classDetailsData.duration || 'TBD',
        capacity: classDetailsData.capacity || 0,
        enrolled: classDetailsData.enrolled || 0,
        materials: (classDetailsData.resources && Array.isArray(classDetailsData.resources)) ? classDetailsData.resources.map((r: any) => ({
          id: String(r.id),
          title: r.title,
          type: r.type,
        })) : [],
        recentAnnouncements: [] // Announcements could be fetched separately if needed
      };
      
      setSelectedClass(classDetails);
      setDetailsModalOpen(true);
    } catch (error) {
      console.error('Failed to load class details:', error);
      // Fallback to basic class info if API call fails
      setSelectedClass(classItem);
      setDetailsModalOpen(true);
    }
  };

  if (!activeChild) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Child Selected</h2>
            <p className="text-muted-foreground">Please select a child to view their classes.</p>
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
          <h1 className="text-3xl font-bold text-foreground">Classes</h1>
          <p className="text-muted-foreground">
            {activeChild.name}'s enrolled courses and schedules
          </p>
        </div>
        <ChildSwitcher />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Enrolled this semester</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes?.filter(c => c.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently ongoing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Now</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {classes?.filter(c => c.isLive).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Classes in session</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes or tutors..."
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
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading classes...</p>
          </div>
        </div>
      ) : filteredClasses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredClasses.map((classItem, index) => (
            <div 
              key={classItem.id} 
              className="group perspective-1000 stagger-item"
              style={{ 
                animation: `slideInUp 0.6s ease-out ${index * 0.1}s both` 
              }}
            >
              <Card className="parent-card relative cursor-pointer transform-gpu bg-gradient-to-br from-background to-muted/20 overflow-hidden">
                <div className="gradient-overlay absolute inset-0 rounded-lg" />
                
                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-300">
                        <BookOpen className="h-5 w-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
                        {classItem.name}
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={getStatusColor(classItem.status)}
                        className="group-hover:scale-105 transition-transform duration-300"
                      >
                        {classItem.status}
                      </Badge>
                      {classItem.isLive && (
                        <Badge variant="destructive" className="animate-pulse group-hover:scale-105 transition-transform duration-300">
                          Live
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardDescription className="group-hover:text-foreground/80 transition-colors duration-300">
                    with {classItem.tutor}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4 relative z-10">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 mt-0.5 group-hover:text-primary transition-colors duration-300 flex-shrink-0" />
                        <div className="flex-1 space-y-1">
                          {classItem.schedule.split(' | ').map((scheduleLine, idx) => (
                            <div key={idx}>{scheduleLine}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {classItem.room && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground/70 transition-colors duration-300">
                        <MapPin className="h-4 w-4 group-hover:text-primary transition-colors duration-300" />
                        <span>{classItem.room}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button 
                      variant="outline" 
                      className="parent-button w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                      onClick={() => handleViewClass(classItem)}
                    >
                      <Eye className="icon-hover mr-2 h-4 w-4" />
                      View Class Details
                    </Button>
                    
                    <div className="text-xs text-muted-foreground text-center group-hover:text-foreground/60 transition-colors duration-300">
                      <span className="inline-flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        View-only access
                      </span>
                    </div>
                  </div>
                </CardContent>
                
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-2 h-2 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100" />
                <div className="absolute bottom-4 left-4 w-1 h-1 bg-secondary/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200" />
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Classes Found</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm || statusFilter !== 'all' 
                ? 'No classes match your current filters.' 
                : `${activeChild.name} is not enrolled in any classes yet.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Class Details Modal */}
      <ClassDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        classDetails={selectedClass}
      />
    </div>
  );
}
