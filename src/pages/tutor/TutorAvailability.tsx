import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, Plus, Trash2, Save, Loader2 } from "lucide-react";
import { tutorApi, TutorAvailability as TutorAvailabilityType } from '@/lib/api';
import { format } from 'date-fns';

interface TimeSlot {
  id: string | number;
  day: string;
  startTime: string;
  endTime: string;
  isAvailable?: boolean;
}

export default function TutorAvailability() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [availability, setAvailability] = useState<TimeSlot[]>([]);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Load availability on mount
  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setIsLoading(true);
      const data = await tutorApi.getAvailability();
      
      // Map API response to component's TimeSlot format
      const mappedSlots: TimeSlot[] = data.map((slot: TutorAvailabilityType) => {
        // Convert time from "HH:MM:SS" to "HH:MM" format for HTML time inputs
        const formatTimeForInput = (time: string) => {
          if (!time) return '09:00';
          // If time is in "HH:MM:SS" format, extract just "HH:MM"
          return time.substring(0, 5);
        };

        return {
          id: slot.id,
          day: slot.day_of_week,
          startTime: formatTimeForInput(slot.start_time),
          endTime: formatTimeForInput(slot.end_time),
          isAvailable: slot.is_available ?? true,
        };
      });

      setAvailability(mappedSlots);
    } catch (error) {
      console.error('Failed to load availability:', error);
      toast({
        title: 'Error',
        description: 'Failed to load availability. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTimeSlot = (day: string) => {
    const newSlot: TimeSlot = {
      id: `temp-${Date.now()}`, // Temporary ID for new slots
      day,
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
    };
    setAvailability([...availability, newSlot]);
  };

  const removeTimeSlot = async (id: string | number) => {
    // If it's a real ID (number), delete from API
    if (typeof id === 'number') {
      try {
        await tutorApi.deleteAvailability(id);
        setAvailability(availability.filter(slot => slot.id !== id));
        toast({
          title: "Time Slot Removed",
          description: "Availability slot has been removed successfully.",
        });
      } catch (error) {
        console.error('Failed to delete availability:', error);
        toast({
          title: "Error",
          description: "Failed to remove time slot. Please try again.",
          variant: 'destructive',
        });
      }
    } else {
      // If it's a temporary ID, just remove from local state
      setAvailability(availability.filter(slot => slot.id !== id));
    }
  };

  const updateTimeSlot = (id: string | number, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(availability.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Group slots by day and prepare data for API
      const availabilityData = availability.map(slot => ({
        day_of_week: slot.day,
        start_time: slot.startTime,
        end_time: slot.endTime,
        is_available: slot.isAvailable ?? true,
      }));

      // The API expects array of availability objects
      await tutorApi.setAvailability(availabilityData);
      
      // Reload availability to get updated data
      await loadAvailability();
      
      // Update last updated timestamp
      setLastUpdated(format(new Date(), 'dd/MM/yyyy hh:mm a'));
      
      toast({
        title: "Availability Updated",
        description: "Your availability schedule has been saved successfully.",
      });
    } catch (error: any) {
      console.error('Failed to save availability:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save availability. Please try again.",
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
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
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Weekly Schedule</CardTitle>
              <CardDescription>
                {lastUpdated ? `Last updated: ${lastUpdated} • ` : ''}Times in Sydney timezone
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
