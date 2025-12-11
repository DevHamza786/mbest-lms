import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Clock, Users, ExternalLink } from "lucide-react";
import { ViewMaterialsModal } from '@/components/modals/ViewMaterialsModal';
import { ClassScheduleModal } from '@/components/modals/ClassScheduleModal';
import { useToast } from '@/hooks/use-toast';

const StudentClasses = () => {
  const { toast } = useToast();
  const [materialsModal, setMaterialsModal] = useState<{ isOpen: boolean; className: string }>({
    isOpen: false,
    className: '',
  });
  const [scheduleModal, setScheduleModal] = useState<{ isOpen: boolean; className: string }>({
    isOpen: false,
    className: '',
  });
  
  const handleViewMaterials = (className: string) => {
    setMaterialsModal({ isOpen: true, className });
  };
  
  const handleClassSchedule = (className: string) => {
    setScheduleModal({ isOpen: true, className });
  };
  const enrolledClasses = [
    {
      id: "1",
      name: "Advanced Mathematics",
      code: "MATH-401",
      tutor: "Mr. Smith",
      schedule: {
        days: ["Monday", "Wednesday", "Friday"],
        time: "10:00 AM - 11:30 AM",
        room: "Room A-101"
      },
      nextSession: "2024-01-22 10:00",
      meetingLink: "https://meet.google.com/abc-def-123",
      progress: 78,
      status: "active",
      description: "Advanced calculus and mathematical analysis"
    },
    {
      id: "2", 
      name: "Physics Fundamentals",
      code: "PHYS-201",
      tutor: "Dr. Johnson",
      schedule: {
        days: ["Tuesday", "Thursday"],
        time: "2:00 PM - 3:30 PM", 
        room: "Room B-203"
      },
      nextSession: "2024-01-23 14:00",
      meetingLink: "https://meet.google.com/ghi-jkl-456",
      progress: 85,
      status: "active",
      description: "Introduction to classical mechanics and thermodynamics"
    },
    {
      id: "3",
      name: "English Literature", 
      code: "ENG-301",
      tutor: "Ms. Williams",
      schedule: {
        days: ["Monday", "Thursday"],
        time: "1:00 PM - 2:30 PM",
        room: "Room C-105"
      },
      nextSession: "2024-01-25 13:00",
      meetingLink: "https://meet.google.com/mno-pqr-789",
      progress: 92,
      status: "active",
      description: "Analysis of classical and contemporary literature"
    },
    {
      id: "4",
      name: "Computer Science",
      code: "CS-201", 
      tutor: "Prof. Davis",
      schedule: {
        days: ["Tuesday", "Friday"],
        time: "11:00 AM - 12:30 PM",
        room: "Lab D-301"
      },
      nextSession: "2024-01-26 11:00",
      meetingLink: "https://meet.google.com/stu-vwx-012",
      progress: 73,
      status: "active",
      description: "Programming fundamentals and data structures"
    }
  ];

  const formatNextSession = (sessionTime: string) => {
    const date = new Date(sessionTime);
    return date.toLocaleDateString() + " at " + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
          <p className="text-muted-foreground">
            Enrolled in {enrolledClasses.length} active courses
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {enrolledClasses.map((classItem) => (
          <Card key={classItem.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {classItem.name}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {classItem.code} • {classItem.description}
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
                    <span className="ml-1">{classItem.tutor}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Schedule:</span>
                    <span className="ml-1">{classItem.schedule.days.join(", ")}</span>
                  </div>
                  
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Time:</span>
                    <span className="ml-1">{classItem.schedule.time}</span>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Location:</span>
                    <span className="ml-1">{classItem.schedule.room}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">Course Progress</span>
                      <span>{classItem.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(classItem.progress)}`}
                        style={{ width: `${classItem.progress}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium">Next Session:</span>
                    <span className="ml-1">{formatNextSession(classItem.nextSession)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button size="sm" asChild>
                  <a href={classItem.meetingLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Join Class
                  </a>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleViewMaterials(classItem.name)}>
                  View Materials
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleClassSchedule(classItem.name)}>
                  Class Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledClasses.length}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(enrolledClasses.reduce((sum, c) => sum + c.progress, 0) / enrolledClasses.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Across all courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Class</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Today 10:00 AM</div>
            <p className="text-xs text-muted-foreground">Advanced Mathematics</p>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <ViewMaterialsModal
        isOpen={materialsModal.isOpen}
        onClose={() => setMaterialsModal({ isOpen: false, className: '' })}
        className={materialsModal.className}
      />
      
      <ClassScheduleModal
        isOpen={scheduleModal.isOpen}
        onClose={() => setScheduleModal({ isOpen: false, className: '' })}
        className={scheduleModal.className}
      />
    </div>
  );
};

export default StudentClasses;