import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Session } from '@/lib/types/session';
import { formatTimeDisplay, calculateDuration } from '@/lib/utils/sessionUtils';
import { format } from 'date-fns';
import { DollarSign, Loader2, User, Users, Calendar, Clock, BookOpen } from 'lucide-react';
import { adminApi } from '@/lib/api/admin';

interface SessionInvoicePreviewModalProps {
  session: Session | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (session: Session) => void;
}

export function SessionInvoicePreviewModal({
  session,
  open,
  onOpenChange,
  onConfirm,
}: SessionInvoicePreviewModalProps) {
  const [tutorRate, setTutorRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const durationHours = session ? calculateDuration(session.startTime, session.endTime) : 0;
  const amount = tutorRate != null ? Math.round(tutorRate * durationHours * 100) / 100 : null;

  useEffect(() => {
    if (!open || !session?.teacherId) {
      setTutorRate(null);
      return;
    }
    const tutorId = parseInt(session.teacherId, 10);
    if (Number.isNaN(tutorId)) {
      setTutorRate(null);
      return;
    }
    setLoading(true);
    adminApi
      .getTutor(tutorId)
      .then((tutor) => {
        setTutorRate(tutor.hourly_rate != null ? Number(tutor.hourly_rate) : null);
      })
      .catch(() => {
        setTutorRate(null);
      })
      .finally(() => setLoading(false));
  }, [open, session?.teacherId, session?.teacherName]);

  const handleConfirm = () => {
    if (!session) return;
    setConfirming(true);
    try {
      onConfirm(session);
      onOpenChange(false);
    } finally {
      setConfirming(false);
    }
  };

  if (!session) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Invoice Preview
          </DialogTitle>
          <DialogDescription>
            Review tutor rate and calculated amount before marking this session ready for invoicing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Session summary */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(session.date), 'EEEE, MMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatTimeDisplay(session.startTime)} – {formatTimeDisplay(session.endTime)} ({durationHours}h)
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{session.teacherName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{session.studentNames.join(', ')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              <span>{session.subject}{session.yearLevel ? ` – Year ${session.yearLevel}` : ''}</span>
            </div>
          </div>

          {/* Tutor rate from database */}
          <div className="rounded-lg border p-4 space-y-1">
            <p className="text-sm font-medium">Tutor invoice rate (from database)</p>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading rate…
              </div>
            ) : tutorRate != null ? (
              <p className="text-lg font-semibold">${tutorRate.toFixed(2)} / hour</p>
            ) : (
              <p className="text-sm text-muted-foreground">No hourly rate set for this tutor.</p>
            )}
          </div>

          {/* Calculated amount */}
          {!loading && (
            <div className="rounded-lg border bg-primary/5 border-primary/20 p-4">
              <p className="text-sm font-medium text-muted-foreground mb-1">Calculated amount</p>
              <p className="text-2xl font-bold">
                {amount != null ? `$${amount.toFixed(2)}` : '—'}
              </p>
              {amount != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {durationHours}h × ${tutorRate!.toFixed(2)}/h
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirming}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || confirming}
          >
            {confirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Marking…
              </>
            ) : (
              <>
                <DollarSign className="mr-2 h-4 w-4" />
                Mark Ready for Invoicing
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
