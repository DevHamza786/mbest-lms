import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ExternalLink, Users, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { studentApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ClassScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number | null;
  className: string;
  classData: any | null;
}

export const ClassScheduleModal: React.FC<ClassScheduleModalProps> = ({
  isOpen,
  onClose,
  classId,
  className,
  classData
}) => {
  const { toast } = useToast();
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [classDetails, setClassDetails] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0,
  });

  useEffect(() => {
    if (isOpen && classId) {
      loadClassDetails();
      loadUpcomingSessions();
      setCurrentPage(1); // Reset to first page when modal opens
    } else {
      setUpcomingSessions([]);
      setClassDetails(null);
      setCurrentPage(1);
    }
  }, [isOpen, classId]);

  useEffect(() => {
    if (isOpen && classId) {
      loadUpcomingSessions();
    }
  }, [currentPage]);

  const loadClassDetails = async () => {
    if (!classId) return;
    
    // Use classData if provided, otherwise fetch it
    if (classData) {
      setClassDetails(classData);
      return;
    }
    
    try {
      setIsLoadingDetails(true);
      const details = await studentApi.getClass(classId);
      setClassDetails(details);
    } catch (error) {
      console.error('Failed to load class details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const loadUpcomingSessions = async () => {
    if (!classId) return;
    
    try {
      setIsLoading(true);
      // Get upcoming lessons/sessions for this specific class with pagination
      const result = await studentApi.getClassLessons(classId, { 
        per_page: 10, 
        page: currentPage 
      });
      setUpcomingSessions(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Failed to load class lessons:', error);
      toast({
        title: 'Error',
        description: 'Failed to load class lessons',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format schedule from classDetails
  const formatSchedule = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return null;
    const days = schedules.map(s => s.day_of_week).join(', ');
    const firstSchedule = schedules[0];
    const time = `${firstSchedule.start_time} - ${firstSchedule.end_time}`;
    return { days, time, room: firstSchedule.room || 'TBD' };
  };

  const regularSchedule = classDetails?.schedules ? formatSchedule(classDetails.schedules) : null;
  const tutorName = classDetails?.tutor?.user?.name || classDetails?.tutor?.name || 'Tutor';

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'lecture': return 'default';
      case 'lab': return 'secondary';
      case 'workshop': return 'outline';
      case 'group': return 'default';
      default: return 'default';
    }
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    // Convert 24-hour to 12-hour format if needed
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Class Schedule - {className}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Regular Schedule */}
          {regularSchedule && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Regular Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Days</p>
                      <p className="text-sm text-muted-foreground">
                        {regularSchedule.days}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Time</p>
                      <p className="text-sm text-muted-foreground">
                        {regularSchedule.time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">
                        {regularSchedule.room}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Instructor</p>
                      <p className="text-sm text-muted-foreground">
                        {tutorName}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Class Lessons */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No upcoming lessons found for this class.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {upcomingSessions.map((session) => {
                      const sessionDate = new Date(session.date);
                      const timeRange = `${formatTime(session.start_time)} - ${formatTime(session.end_time)}`;
                      const location = session.location === 'centre' ? (session.room || session.location || 'TBD') : 
                                      session.location === 'online' ? 'Online' : 
                                      session.location === 'home' ? 'Home' : session.room || session.location || 'TBD';
                      const meetingLink = session.location === 'online' ? (session.meeting_link || 'https://meet.google.com/abc-def-123') : null;
                      const attendanceStatus = session.attendance_status;
                      
                      return (
                        <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{session.subject || session.topic || 'Class Session'}</h4>
                              <Badge variant={getTypeColor(session.session_type || 'group')}>
                                {session.session_type === '1:1' ? '1:1' : session.session_type || 'Group'}
                              </Badge>
                              {attendanceStatus && (
                                <Badge variant={
                                  attendanceStatus === 'present' ? 'default' : 
                                  attendanceStatus === 'late' ? 'secondary' : 
                                  'destructive'
                                }>
                                  {attendanceStatus.charAt(0).toUpperCase() + attendanceStatus.slice(1)}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {sessionDate.toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {timeRange}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {location}
                              </div>
                            </div>
                            {session.topics_taught && (
                              <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium">Topics:</span> {session.topics_taught}
                              </p>
                            )}
                            {session.lesson_note && (
                              <p className="text-sm text-muted-foreground mt-1">
                                <span className="font-medium">Notes:</span> {session.lesson_note}
                              </p>
                            )}
                          </div>
                          {meetingLink ? (
                            <Button variant="outline" size="sm" asChild className="ml-4">
                              <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Join
                              </a>
                            </Button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Pagination */}
                  {pagination.last_page > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {(pagination.current_page - 1) * pagination.per_page + 1} to{' '}
                        {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                        {pagination.total} lessons
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
                          Page {pagination.current_page} of {pagination.last_page}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.min(pagination.last_page, prev + 1))}
                          disabled={currentPage === pagination.last_page || isLoading}
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};