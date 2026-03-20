import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { parentApi, type AddStudentData } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddStudentModal({ isOpen, onClose, onSuccess }: AddStudentModalProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getTodayISO = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayISO = getTodayISO();
  const normalizePhone = (value: string) => value.replace(/[\s-]/g, '');
  const isValidAusPhone = (value: string) => /^\+61\d{9}$/.test(normalizePhone(value));
  const isValidGrade = (value: string) => /^Year (?:[1-9]|1[0-2])$/.test(value.trim());
  const isValidPassword = (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(value);
  const isFutureDOB = (value: string) => {
    const date = new Date(value + 'T00:00:00');
    const today = new Date(todayISO + 'T00:00:00');
    return date.getTime() > today.getTime();
  };

  const [formData, setFormData] = useState<AddStudentData>({
    name: '',
    email: '',
    password: '',
    grade: '',
    school: '',
    phone: '',
    date_of_birth: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    // Best-effort client-side block for known invalid example domains.
    if (formData.email.toLowerCase().endsWith('.comm')) {
      toast({
        title: 'Validation Error',
        description: 'Email domain is invalid.',
        variant: 'destructive',
      });
      return;
    }

    // Validate Australian phone format (+61xxxxxxxxx). Allow empty values.
    if (formData.phone && !isValidAusPhone(formData.phone)) {
      toast({
        title: 'Validation Error',
        description: 'Phone must be in the format +61XXXXXXXXX.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.emergency_contact_phone && !isValidAusPhone(formData.emergency_contact_phone)) {
      toast({
        title: 'Validation Error',
        description: 'Emergency contact phone must be in the format +61XXXXXXXXX.',
        variant: 'destructive',
      });
      return;
    }

    if (!isValidPassword(formData.password)) {
      toast({
        title: 'Validation Error',
        description: 'Password must include uppercase, lowercase, a number, and a special character.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.grade && !isValidGrade(formData.grade)) {
      toast({
        title: 'Validation Error',
        description: 'Grade must be in the format "Year X" (Year 1 - Year 12).',
        variant: 'destructive',
      });
      return;
    }

    // Date of birth must not be in the future.
    if (formData.date_of_birth && isFutureDOB(formData.date_of_birth)) {
      toast({
        title: 'Validation Error',
        description: 'Date of birth cannot be in the future.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: AddStudentData = {
        ...formData,
        phone: formData.phone ? normalizePhone(formData.phone) : '',
        emergency_contact_phone: formData.emergency_contact_phone
          ? normalizePhone(formData.emergency_contact_phone)
          : '',
      };

      await parentApi.addStudent(payload);
      toast({
        title: 'Success',
        description: 'Student added successfully!',
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        password: '',
        grade: '',
        school: '',
        phone: '',
        date_of_birth: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
      });
      
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add student',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription>
            Create a new student account for your child
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter student's full name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter student's email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <Select
                value={formData.grade || ''}
                onValueChange={(value) => setFormData({ ...formData, grade: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year level (e.g., Year 10)" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={`Year ${n}`}>
                      {`Year ${n}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="school">School</Label>
              <Input
                id="school"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                placeholder="Enter school name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                max={todayISO}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                placeholder="Emergency contact name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                placeholder="Emergency contact phone"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Student'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
