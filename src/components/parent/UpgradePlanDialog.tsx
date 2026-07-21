import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { parentApi, type Package } from '@/lib/api';

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradePlanDialog({ open, onOpenChange }: UpgradePlanDialogProps) {
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [slip, setSlip] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedPackageId(null);
    setSlip(null);
    setIsLoading(true);
    parentApi
      .getPackages()
      .then(setPackages)
      .catch(() => {
        toast({
          title: 'Error',
          description: 'Failed to load packages',
          variant: 'destructive',
        });
      })
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedPackageId || !slip) {
      toast({
        title: 'Missing information',
        description: 'Select a package and upload a payment slip.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await parentApi.submitPayment(selectedPackageId, slip);
      toast({
        title: 'Upgrade request submitted',
        description: 'Your current plan stays active until an admin approves this request.',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit upgrade request',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upgrade Your Package</DialogTitle>
          <DialogDescription>
            Choose a new package and upload proof of payment. Your current plan and students
            stay active while this is reviewed.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading packages…</p>
        ) : (
          <div className="space-y-3">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-colors ${
                  selectedPackageId === pkg.id ? 'border-primary' : ''
                }`}
                onClick={() => setSelectedPackageId(pkg.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{pkg.name}</CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                  ${pkg.price} · up to {pkg.student_limit} student{pkg.student_limit === 1 ? '' : 's'}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="upgrade-payment-slip" className="text-sm font-medium">
            Payment slip
          </label>
          <input
            id="upgrade-payment-slip"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => setSlip(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button onClick={handleSubmit} disabled={isSubmitting || !selectedPackageId || !slip}>
          {isSubmitting ? 'Submitting…' : 'Submit Upgrade Request'}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
