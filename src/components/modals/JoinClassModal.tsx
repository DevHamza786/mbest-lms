import { useState } from 'react';
import { ExternalLink, Clock, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ClassDetails {
  id: string;
  name: string;
  tutor: string;
  time: string;
  room: string;
  meetingLink: string;
  status: string;
}

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classDetails: ClassDetails | null;
}

export function JoinClassModal({ isOpen, onClose, classDetails }: JoinClassModalProps) {
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinClass = async () => {
    if (!classDetails?.meetingLink) return;
    
    setIsJoining(true);
    
    // Simulate joining process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Joining Class",
      description: `Opening ${classDetails.name} in a new window...`,
    });
    
    // Open meeting link in new window
    window.open(classDetails.meetingLink, '_blank', 'noopener,noreferrer');
    
    setIsJoining(false);
    onClose();
  };

  if (!classDetails) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Join Class Session
            <Badge variant={classDetails.status === 'today' ? 'default' : 'secondary'}>
              {classDetails.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            You're about to join an online class session
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-lg">{classDetails.name}</h4>
            <p className="text-sm text-muted-foreground">with {classDetails.tutor}</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{classDetails.time}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{classDetails.room}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>Online Meeting</span>
            </div>
          </div>
          
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              By joining this class, you agree to follow the class guidelines and maintain 
              professional conduct during the session.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleJoinClass} disabled={isJoining}>
            <ExternalLink className="mr-2 h-4 w-4" />
            {isJoining ? 'Joining...' : 'Join Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}