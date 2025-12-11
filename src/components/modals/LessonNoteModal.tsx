import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Session, StudentNote } from '@/lib/types/session';
import { FileText, Users, User, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LessonNoteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: Session | null;
  onSave: (sessionId: string, lessonNote: string, topicsTaught: string, homeworkResources: string, studentNotes: StudentNote[]) => void;
}

export function LessonNoteModal({ open, onOpenChange, session, onSave }: LessonNoteModalProps) {
  const { toast } = useToast();
  const [generalNote, setGeneralNote] = useState('');
  const [topicsTaught, setTopicsTaught] = useState('');
  const [homeworkResources, setHomeworkResources] = useState('');
  const [studentNotes, setStudentNotes] = useState<StudentNote[]>([]);

  // Initialize form data when session changes
  useEffect(() => {
    if (session) {
      setGeneralNote(session.lessonNote || '');
      setTopicsTaught(session.topicsTaught || '');
      setHomeworkResources(session.homeworkResources || '');
      
      // Initialize student notes for each student
      if (session.studentNotes && session.studentNotes.length > 0) {
        setStudentNotes(session.studentNotes);
      } else {
        // Create empty notes for each student
        const initialNotes: StudentNote[] = session.studentIds.map((studentId, index) => ({
          studentId,
          studentName: session.studentNames[index] || 'Unknown',
          behaviorIssues: '',
          homeworkCompleted: true,
          homeworkNotes: '',
          privateNotes: '',
        }));
        setStudentNotes(initialNotes);
      }
    }
  }, [session, open]);

  const handleSave = () => {
    if (!session) return;

    // Validate that general notes are filled
    if (!generalNote.trim() && !topicsTaught.trim() && !homeworkResources.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in at least the general lesson notes, topics taught, or homework resources.',
        variant: 'destructive',
      });
      return;
    }

    onSave(session.id, generalNote, topicsTaught, homeworkResources, studentNotes);
    toast({
      title: 'Lesson Note Saved',
      description: 'Lesson notes have been saved successfully.',
    });
    onOpenChange(false);
  };

  const updateStudentNote = (index: number, field: keyof StudentNote, value: any) => {
    const updatedNotes = [...studentNotes];
    updatedNotes[index] = {
      ...updatedNotes[index],
      [field]: value,
    };
    setStudentNotes(updatedNotes);
  };

  if (!session) return null;

  const isGroupClass = session.sessionType === 'group' && session.studentIds.length > 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Complete Lesson Note
          </DialogTitle>
          <DialogDescription>
            Record what was taught, topics covered, homework resources, and any student-specific notes.
            {isGroupClass && ' Individual student notes will only be shared with their respective parents.'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">
              <FileText className="mr-2 h-4 w-4" />
              General Lesson Notes
            </TabsTrigger>
            {isGroupClass && (
              <TabsTrigger value="students">
                <Users className="mr-2 h-4 w-4" />
                Individual Student Notes ({session.studentNames.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Lesson Information</CardTitle>
                <CardDescription>
                  This information will be shared with all parents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="topics-taught">Topics Taught *</Label>
                  <Textarea
                    id="topics-taught"
                    placeholder="What topics were covered in this lesson? (e.g., Quadratic equations, Chapter 5: Functions)"
                    value={topicsTaught}
                    onChange={(e) => setTopicsTaught(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="homework-resources">Homework Resources Provided</Label>
                  <Textarea
                    id="homework-resources"
                    placeholder="What homework or resources were provided to students? (e.g., Worksheet pages 12-15, Practice problems 1-10)"
                    value={homeworkResources}
                    onChange={(e) => setHomeworkResources(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="general-note">General Lesson Notes</Label>
                  <Textarea
                    id="general-note"
                    placeholder="General notes about the lesson, class progress, or any other information to share with all parents..."
                    value={generalNote}
                    onChange={(e) => setGeneralNote(e.target.value)}
                    rows={4}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isGroupClass && (
            <TabsContent value="students" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Individual Student Notes</CardTitle>
                  <CardDescription>
                    These notes are private and will only be shared with each student's parent.
                    Use this section to record behavior issues, homework completion, or other individual concerns.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {studentNotes.map((note, index) => (
                    <div key={note.studentId}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <h4 className="font-semibold">{note.studentName}</h4>
                          <Badge variant="outline">Private to Parent</Badge>
                        </div>
                      </div>

                      <div className="space-y-3 pl-6 border-l-2 border-muted">
                        <div>
                          <Label htmlFor={`homework-${index}`}>Homework Completion</Label>
                          <div className="flex items-center space-x-2 mt-2">
                            <Checkbox
                              id={`homework-completed-${index}`}
                              checked={note.homeworkCompleted}
                              onCheckedChange={(checked) => 
                                updateStudentNote(index, 'homeworkCompleted', checked)
                              }
                            />
                            <Label 
                              htmlFor={`homework-completed-${index}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              Homework completed
                            </Label>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`homework-notes-${index}`}>Homework Notes</Label>
                          <Textarea
                            id={`homework-notes-${index}`}
                            placeholder="Notes about homework completion or issues..."
                            value={note.homeworkNotes || ''}
                            onChange={(e) => updateStudentNote(index, 'homeworkNotes', e.target.value)}
                            rows={2}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`behavior-${index}`}>
                            <AlertCircle className="inline h-4 w-4 mr-1 text-yellow-600" />
                            Behavior Issues or Concerns
                          </Label>
                          <Textarea
                            id={`behavior-${index}`}
                            placeholder="Record any behavior issues, incidents, or concerns about this student..."
                            value={note.behaviorIssues || ''}
                            onChange={(e) => updateStudentNote(index, 'behaviorIssues', e.target.value)}
                            rows={3}
                            className="mt-2"
                          />
                        </div>

                        <div>
                          <Label htmlFor={`private-notes-${index}`}>Additional Private Notes</Label>
                          <Textarea
                            id={`private-notes-${index}`}
                            placeholder="Any other private notes about this student that should only be shared with their parent..."
                            value={note.privateNotes || ''}
                            onChange={(e) => updateStudentNote(index, 'privateNotes', e.target.value)}
                            rows={2}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {index < studentNotes.length - 1 && <Separator className="my-4" />}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Lesson Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

