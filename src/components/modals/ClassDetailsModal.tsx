import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  GraduationCap,
  FileText,
  Video,
  Users,
  AlertCircle,
  Eye,
  MessageSquare
} from 'lucide-react';

interface ClassDetails {
  id: string;
  name: string;
  tutor: string;
  schedule: string;
  room?: string;
  status: string;
  isLive?: boolean;
  description?: string;
  duration?: string;
  capacity?: number;
  enrolled?: number;
  nextSession?: string;
  materials?: Array<{
    id: string;
    title: string;
    type: string;
  }>;
  recentAnnouncements?: Array<{
    id: string;
    title: string;
    date: string;
  }>;
}

interface ClassDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classDetails: ClassDetails | null;
}

const statusStyles = {
  planned: "bg-blue-100 text-blue-700 border-blue-200",
  completed: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
  "no-show": "bg-orange-100 text-orange-700 border-orange-200",
  rescheduled: "bg-purple-100 text-purple-700 border-purple-200",
  unavailable: "bg-gray-100 text-gray-700 border-gray-200",
};

export function ClassDetailsModal({ open, onOpenChange, classDetails }: ClassDetailsModalProps) {
  if (!classDetails) return null;
  // console.log(classDetails)
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'video': return <Video className="h-4 w-4 text-blue-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span>{classDetails.name}</span>
                <Badge className={getStatusColor(classDetails.status)}>
                  {classDetails.status}
                </Badge>
                {classDetails.isLive && (
                  <Badge variant="destructive" className="animate-pulse">
                    Live
                  </Badge>
                )}
              </div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Class details and information for {classDetails.name}
          </DialogDescription>
          <DialogDescription>
            <b>Tutor Name:</b> {classDetails.tutor}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {classDetails?.scheduleData && classDetails.scheduleData.length > 0 ? (
                  classDetails.scheduleData.map((item, index) => (
                    <div key={item.id || index} className={index !== 0 ? "pt-3 border-t" : ""}>
                      {/* Session/Subject Display */}
                      {item.subject && (
                        <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">
                          Session: {item.subject}
                        </p>
                      )}
                      
                      {/* Date Formatting */}
                      <p className="font-semibold text-sm text-foreground">
                        {new Date(item.date).toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                      
                      {/* Time Display Badge */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-mono">
                          {item.start_time.substring(0, 5)} — {item.end_time.substring(0, 5)}
                        </span>
                      </div>

                      {/* Status Badge */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`
                          px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border
                          ${statusStyles[item.status?.toLowerCase()] || "bg-secondary text-secondary-foreground border-transparent"}
                        `}>
                          {item.status || 'Unknown'}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-4 text-center">
                    <p className="text-sm text-muted-foreground italic">No upcoming sessions scheduled.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {classDetails.room && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">{classDetails.room}</p>
                </CardContent>
              </Card>
            )}

            {classDetails.capacity && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Enrollment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-semibold">
                    {classDetails.enrolled || 0} / {classDetails.capacity}
                  </p>
                  <p className="text-sm text-muted-foreground">Students enrolled</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Description */}
          {classDetails.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Course Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{classDetails.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Next Session */}
          {classDetails.nextSession && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Next Session
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-primary">{classDetails.nextSession}</p>
              </CardContent>
            </Card>
          )}

          {/* Course Materials */}
          {classDetails.materials && classDetails.materials.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Course Materials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {classDetails.materials.map((material) => (
                    <div key={material.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      {getTypeIcon(material.type)}
                      <span className="text-sm font-medium">{material.title}</span>
                      <Badge variant="outline" className="text-xs ml-auto">
                        {material.type.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Announcements */}
          {classDetails.recentAnnouncements && classDetails.recentAnnouncements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Recent Announcements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classDetails.recentAnnouncements.map((announcement) => (
                    <div key={announcement.id} className="border-l-2 border-primary/20 pl-3">
                      <p className="text-sm font-medium">{announcement.title}</p>
                      <p className="text-xs text-muted-foreground">{announcement.date}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Parent Access Notice */}
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                    Parent Access
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    As a parent, you have view-only access to your child's class information. 
                    You cannot join live sessions or submit assignments on their behalf.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Instructor
            </Button>
            
            {classDetails.isLive && (
              <Button variant="outline" disabled className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                View Live Session (Parent Access)
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
