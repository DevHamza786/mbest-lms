import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, ExternalLink, Users } from "lucide-react";

interface ClassScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
}

export const ClassScheduleModal: React.FC<ClassScheduleModalProps> = ({
  isOpen,
  onClose,
  className
}) => {
  // Mock schedule data - in real app, this would be fetched based on className
  const scheduleData = {
    "Advanced Mathematics": {
      regularSchedule: {
        days: ["Monday", "Wednesday", "Friday"],
        time: "10:00 AM - 11:30 AM",
        room: "Room A-101",
        tutor: "Mr. Smith"
      },
      upcomingClasses: [
        {
          date: "2024-01-22",
          time: "10:00 AM - 11:30 AM",
          topic: "Derivatives and Chain Rule",
          type: "Lecture",
          room: "Room A-101"
        },
        {
          date: "2024-01-24",
          time: "10:00 AM - 11:30 AM", 
          topic: "Practice Problems",
          type: "Workshop",
          room: "Room A-101"
        },
        {
          date: "2024-01-26",
          time: "10:00 AM - 11:30 AM",
          topic: "Integration Techniques",
          type: "Lecture",
          room: "Room A-101"
        }
      ]
    },
    "Physics Fundamentals": {
      regularSchedule: {
        days: ["Tuesday", "Thursday"],
        time: "2:00 PM - 3:30 PM",
        room: "Room B-203",
        tutor: "Dr. Johnson"
      },
      upcomingClasses: [
        {
          date: "2024-01-23",
          time: "2:00 PM - 3:30 PM",
          topic: "Thermodynamics Lab",
          type: "Lab",
          room: "Lab B-205"
        },
        {
          date: "2024-01-25",
          time: "2:00 PM - 3:30 PM",
          topic: "Heat and Energy Transfer",
          type: "Lecture",
          room: "Room B-203"
        }
      ]
    }
  };

  const currentSchedule = scheduleData[className as keyof typeof scheduleData] || scheduleData["Advanced Mathematics"];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Lecture': return 'default';
      case 'Lab': return 'secondary';
      case 'Workshop': return 'outline';
      default: return 'default';
    }
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
                      {currentSchedule.regularSchedule.days.join(", ")}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {currentSchedule.regularSchedule.time}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {currentSchedule.regularSchedule.room}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Instructor</p>
                    <p className="text-sm text-muted-foreground">
                      {currentSchedule.regularSchedule.tutor}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Classes */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentSchedule.upcomingClasses.map((classItem, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{classItem.topic}</h4>
                        <Badge variant={getTypeColor(classItem.type)}>
                          {classItem.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(classItem.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {classItem.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {classItem.room}
                        </div>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Join
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button>
              Add to Calendar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};