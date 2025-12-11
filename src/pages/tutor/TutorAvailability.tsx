import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus, Trash2, Save } from "lucide-react";

interface TimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
}

export default function TutorAvailability() {
  const { toast } = useToast();
  const [lastUpdated] = useState('30/07/2025 09:20 AM');

  const [availability, setAvailability] = useState<TimeSlot[]>([
    { id: '1', day: 'Friday', startTime: '16:00', endTime: '20:00' },
    { id: '2', day: 'Saturday', startTime: '09:00', endTime: '16:00' },
    { id: '3', day: 'Sunday', startTime: '14:00', endTime: '17:00' },
  ]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const addTimeSlot = (day: string) => {
    const newSlot: TimeSlot = {
      id: Math.random().toString(36).substr(2, 9),
      day,
      startTime: '09:00',
      endTime: '17:00',
    };
    setAvailability([...availability, newSlot]);
  };

  const removeTimeSlot = (id: string) => {
    setAvailability(availability.filter(slot => slot.id !== id));
  };

  const updateTimeSlot = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(availability.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSave = () => {
    toast({
      title: "Availability Updated",
      description: "Your availability schedule has been saved successfully.",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Availability</h1>
          <p className="text-muted-foreground mt-2">
            Manage your weekly teaching availability
          </p>
        </div>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                Last updated: {lastUpdated} • Times in Sydney timezone
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {daysOfWeek.map(day => {
              const daySlots = availability.filter(slot => slot.day === day);
              
              return (
                <div key={day} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{day}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addTimeSlot(day)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Time
                    </Button>
                  </div>
                  
                  {daySlots.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-2 px-4 bg-muted/30 rounded-lg">
                      No availability set
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="flex items-center gap-4 p-3 border rounded-lg">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div className="flex items-center gap-2 flex-1">
                            <div className="space-y-1">
                              <Label htmlFor={`start-${slot.id}`} className="text-xs">Start</Label>
                              <Input
                                id={`start-${slot.id}`}
                                type="time"
                                value={slot.startTime}
                                onChange={(e) => updateTimeSlot(slot.id, 'startTime', e.target.value)}
                                className="w-32"
                              />
                            </div>
                            <span className="text-muted-foreground">to</span>
                            <div className="space-y-1">
                              <Label htmlFor={`end-${slot.id}`} className="text-xs">End</Label>
                              <Input
                                id={`end-${slot.id}`}
                                type="time"
                                value={slot.endTime}
                                onChange={(e) => updateTimeSlot(slot.id, 'endTime', e.target.value)}
                                className="w-32"
                              />
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTimeSlot(slot.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Calendar Integration</CardTitle>
          <CardDescription>
            Sync your availability with external calendar applications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Calendar Feed URL</Label>
            <div className="flex gap-2">
              <Input 
                value="https://mbest-tutoring.com/calendar/feed/tutor-123" 
                readOnly 
                className="font-mono text-sm"
              />
              <Button variant="outline">Copy</Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Use this URL to subscribe to your calendar in Google Calendar, Outlook, or other calendar apps
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
