import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { parentApi } from '@/lib/api/parent';
import { useParentContext } from '@/lib/store/parentStore';

export default function ParentLessonRequests() {
  const { toast } = useToast();
  const { activeChild } = useParentContext();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tutors, setTutors] = useState<Array<{ id: number; name: string }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    tutorUserId: '',
    subject: '',
    preferredDate: '',
    preferredTime: '',
    durationHours: '1',
    message: '',
  });

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!activeChild) return;
    parentApi.getChildClasses(Number(activeChild.id)).then((classes) => {
      const map = new Map<number, string>();
      classes.forEach((c: any) => {
        if (c.tutor?.user) map.set(c.tutor.user.id, c.tutor.user.name);
      });
      setTutors(Array.from(map.entries()).map(([id, name]) => ({ id, name })));
    }).catch(() => {});
  }, [activeChild]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const data = await parentApi.getLessonRequests();
      setRequests(data);
    } catch (error) {
      console.error('Failed to load lesson requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.tutorUserId || !form.subject || !form.preferredDate || !form.preferredTime) {
      toast({ title: 'Missing information', description: 'Please fill in tutor, subject, date, and time.', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      await parentApi.createLessonRequest({
        tutor_user_id: Number(form.tutorUserId),
        student_name: activeChild?.name || 'Student',
        subject: form.subject,
        preferred_date: form.preferredDate,
        preferred_time: form.preferredTime,
        duration_hours: parseFloat(form.durationHours) || 1,
        message: form.message,
      });
      toast({ title: 'Request Sent', description: 'Your lesson request has been sent to the tutor.' });
      setForm({ tutorUserId: '', subject: '', preferredDate: '', preferredTime: '', durationHours: '1', message: '' });
      loadRequests();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send request', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400"><CheckCircle2 className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'declined':
        return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400"><XCircle className="mr-1 h-3 w-3" />Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Lesson Requests</h1>
        <p className="text-muted-foreground mt-2">Request an extra lesson from your child's tutor and track its status.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request a Lesson</CardTitle>
          <CardDescription>Sent to the selected tutor for approval</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tutor</Label>
              <Select value={form.tutorUserId} onValueChange={(v) => setForm({ ...form, tutorUserId: v })}>
                <SelectTrigger><SelectValue placeholder="Select tutor" /></SelectTrigger>
                <SelectContent>
                  {tutors.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g., Mathematics" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Preferred Date</Label>
              <Input id="date" type="date" value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Preferred Time</Label>
              <Input id="time" type="time" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input id="duration" type="number" step="0.5" min="0.5" value={form.durationHours} onChange={(e) => setForm({ ...form, durationHours: e.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea id="message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Any details for the tutor..." />
          </div>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Request
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No lesson requests sent yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tutor</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Preferred Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.tutor_name || '—'}</TableCell>
                    <TableCell>{r.lesson_type}</TableCell>
                    <TableCell>{r.preferred_date}</TableCell>
                    <TableCell>{r.preferred_time}</TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
