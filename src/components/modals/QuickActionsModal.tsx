import { useState } from 'react';
import { FileText, GraduationCap, Library, MessageSquare, Calendar, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface QuickActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickActionsModal({ isOpen, onClose }: QuickActionsModalProps) {
  const { toast } = useToast();
  const navigate = useNavigate();

  const quickActions = [
    {
      id: 'submit-assignment',
      title: 'Submit Assignment',
      description: 'Upload and submit your completed assignments',
      icon: Upload,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      action: () => {
        navigate('/student/assignments');
        onClose();
        toast({
          title: "Navigating to Assignments",
          description: "You can submit your assignments from the assignments page.",
        });
      }
    },
    {
      id: 'view-grades',
      title: 'View Grades',
      description: 'Check your recent grades and feedback',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      action: () => {
        navigate('/student/grades');
        onClose();
        toast({
          title: "Navigating to Grades",
          description: "Check your latest grades and performance metrics.",
        });
      }
    },
    {
      id: 'access-resources',
      title: 'Access Resources',
      description: 'Browse course materials and study resources',
      icon: Library,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      action: () => {
        navigate('/student/resources');
        onClose();
        toast({
          title: "Navigating to Resources",
          description: "Explore your course materials and study resources.",
        });
      }
    },
    {
      id: 'message-tutor',
      title: 'Message Tutor',
      description: 'Send a message to your instructors',
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      action: () => {
        navigate('/student/messaging');
        onClose();
        toast({
          title: "Navigating to Messages",
          description: "Start a conversation with your tutors.",
        });
      }
    },
    {
      id: 'view-schedule',
      title: 'View Schedule',
      description: 'Check your class schedule and upcoming events',
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      action: () => {
        navigate('/student/classes');
        onClose();
        toast({
          title: "Navigating to Classes",
          description: "View your class schedule and join upcoming sessions.",
        });
      }
    },
    {
      id: 'download-materials',
      title: 'Download Materials',
      description: 'Download course materials and resources',
      icon: Download,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      action: () => {
        navigate('/student/resources');
        onClose();
        toast({
          title: "Resource Library",
          description: "Browse and download your course materials.",
        });
      }
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Quick Actions</DialogTitle>
          <DialogDescription>
            Choose an action to perform quickly
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={action.action}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`rounded-full p-2 ${action.bgColor}`}>
                      <Icon className={`h-4 w-4 ${action.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        {action.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-xs">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}