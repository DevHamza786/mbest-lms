import { useState, useEffect } from 'react';
import { Plus, Edit, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminApi, type Package, type CreatePackageData, type AdminClass } from '@/lib/api/admin';

export default function AdminPackages() {
  const { toast } = useToast();
  const [packages, setPackages] = useState<Package[]>([]);
  const [classes, setClasses] = useState<AdminClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [formData, setFormData] = useState<CreatePackageData>({
    name: '',
    price: 0,
    description: '',
    student_limit: 0,
    class_ids: [],
    allows_one_on_one: false,
    bank_details: '',
    is_active: true,
    subject: '',
    billing_type: 'recurring',
    package_type: 'group',
  });

  // Debug: Log packages state changes
  useEffect(() => {
    console.log('Packages state updated:', packages);
  }, [packages]);

  useEffect(() => {
    loadPackages();
    loadClasses();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getPackages();
      console.log('Loaded packages from API:', data);
      console.log('Is array?', Array.isArray(data));
      console.log('Packages count:', data?.length);
      
      if (Array.isArray(data)) {
        setPackages(data);
        console.log('Packages state set to:', data);
      } else {
        console.warn('Data is not an array:', data);
        setPackages([]);
      }
    } catch (error: any) {
      console.error('Error loading packages:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load packages',
        variant: 'destructive',
      });
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      setLoadingClasses(true);
      const data = await adminApi.getAllClasses();
      setClasses(data);
    } catch (error: any) {
      console.error('Failed to load classes:', error);
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleCreate = () => {
    setSelectedPackage(null);
    setFormData({
      name: '',
      price: 0,
      description: '',
      student_limit: 0,
      class_ids: [],
      allows_one_on_one: false,
      bank_details: '',
      is_active: true,
      subject: '',
      billing_type: 'recurring',
      package_type: 'group',
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setSelectedPackage(pkg);
    const rawIds = pkg.classes?.map((c) => c.id) || [];
    const classIds = rawIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id));
    setFormData({
      name: pkg.name,
      price: typeof pkg.price === 'string' ? parseFloat(pkg.price) : pkg.price,
      description: pkg.description || '',
      student_limit: pkg.student_limit,
      class_ids: classIds,
      allows_one_on_one: pkg.allows_one_on_one,
      bank_details: pkg.bank_details || '',
      is_active: pkg.is_active,
      subject: 'all',
      billing_type: 'recurring',
      package_type: 'group',
    });
    setIsDialogOpen(true);
  };

  const classMatchesSubjectFilter = (cls: AdminClass, subjectFilter: string | undefined) => {
    if (!subjectFilter || subjectFilter === 'all') return true;
    return (cls.category || '').toLowerCase() === subjectFilter.toLowerCase();
  };

  const handleClassToggle = (classId: number) => {
    setFormData((prev) => {
      const currentIds = prev.class_ids || [];
      const has = currentIds.some((id) => Number(id) === classId);
      const nextIds = has
        ? currentIds.filter((id) => Number(id) !== classId)
        : [...currentIds, classId];
      return { ...prev, class_ids: nextIds };
    });
  };

  const handleSubmit = async () => {
    try {
      const classIds = (formData.class_ids || [])
        .map((id) => Number(id))
        .filter((id) => !Number.isNaN(id));

      // Avoid sending "all" to backend as a real subject filter; subject is UI-only for class list.
      const { subject: _subject, ...rest } = formData;
      const cleanedFormData: CreatePackageData = {
        ...rest,
        class_ids: classIds,
      };

      if (selectedPackage) {
        await adminApi.updatePackage(selectedPackage.id, cleanedFormData);
        toast({
          title: 'Success',
          description: 'Subscription plan updated successfully',
        });
      } else {
        await adminApi.createPackage(cleanedFormData);
        toast({
          title: 'Success',
          description: 'Subscription plan created successfully',
        });
      }
      setIsDialogOpen(false);
      loadPackages();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save package',
        variant: 'destructive',
      });
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Subscription plan</h1>
          <p className="text-muted-foreground">Manage subscription plans for parents</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Subscription plan
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Subscription plans</CardTitle>
          <CardDescription>
            Manage subscription plans and their limits. Plans cannot be deleted to maintain subscription history. 
            Use the "Active" toggle to deactivate plans instead.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Classes</TableHead>
                <TableHead>1:1 Sessions</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!loading && packages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No subscription plans found. Create your first plan.
                  </TableCell>
                </TableRow>
              ) : packages.length > 0 ? (
                packages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell className="font-medium">{pkg.name}</TableCell>
                    <TableCell>${typeof pkg.price === 'string' ? parseFloat(pkg.price).toFixed(2) : pkg.price.toFixed(2)}</TableCell>
                    <TableCell>{pkg.student_limit}</TableCell>
                    <TableCell>
                      {pkg.classes && pkg.classes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {pkg.classes.slice(0, 3).map((cls) => (
                            <Badge key={cls.id} variant="outline" className="text-xs">
                              {cls.name}
                            </Badge>
                          ))}
                          {pkg.classes.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{pkg.classes.length - 3} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {pkg.allows_one_on_one ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                        {pkg.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(pkg)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedPackage ? 'Edit Subscription plan' : 'Create Subscription plan'}</DialogTitle>
            <DialogDescription>
              {selectedPackage ? 'Update plan details' : 'Create a new subscription plan'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Subscription plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Basic Plan"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plan description..."
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="student_limit">Student Limit *</Label>
              <Input
                id="student_limit"
                type="number"
                value={formData.student_limit}
                onChange={(e) => setFormData({ ...formData, student_limit: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subject">Subject</Label>
              <Select
                value={formData.subject && formData.subject !== '' ? formData.subject : 'all'}
                onValueChange={(value) => {
                  setFormData((prev) => {
                    const allowedIds = new Set(
                      classes
                        .filter((cls) => classMatchesSubjectFilter(cls, value))
                        .map((cls) => Number(cls.id)),
                    );
                    const nextIds = (prev.class_ids || []).filter((id) =>
                      allowedIds.has(Number(id)),
                    );
                    return { ...prev, subject: value, class_ids: nextIds };
                  });
                }}
              >
                <SelectTrigger id="subject">
                  <SelectValue placeholder="Filter classes by subject/category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {Array.from(new Set(classes.map((c) => c.category).filter(Boolean))).map((cat) => (
                    <SelectItem key={cat as string} value={cat as string}>
                      {cat as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Select Classes *</Label>
              <ScrollArea className="h-64 border rounded-md p-4">
                {loadingClasses ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : classes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No classes available</p>
                ) : (
                  <div className="space-y-2">
                    {classes
                      .filter((cls) => classMatchesSubjectFilter(cls, formData.subject))
                      .map((cls) => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-${cls.id}`}
                          checked={(formData.class_ids || []).map(Number).includes(Number(cls.id))}
                          onCheckedChange={() => handleClassToggle(Number(cls.id))}
                        />
                        <Label
                          htmlFor={`class-${cls.id}`}
                          className="text-sm font-normal cursor-pointer flex-1"
                        >
                          {cls.name} ({cls.code})
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                Selected: {(formData.class_ids || []).length} class(es)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="billing_type">Billing Type</Label>
              <Select
                value={formData.billing_type || 'recurring'}
                onValueChange={(value) => setFormData({ ...formData, billing_type: value as any })}
              >
                <SelectTrigger id="billing_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="package_type">Plan Type</Label>
              <Select
                value={formData.package_type || 'group'}
                onValueChange={(value) => setFormData({ ...formData, package_type: value as any })}
              >
                <SelectTrigger id="package_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="group">Group</SelectItem>
                  <SelectItem value="1:1">1:1</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="allows_one_on_one"
                checked={formData.allows_one_on_one}
                onCheckedChange={(checked) => setFormData({ ...formData, allows_one_on_one: checked })}
              />
              <Label htmlFor="allows_one_on_one">Allows 1:1 Sessions</Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bank_details">Bank Details</Label>
              <Textarea
                id="bank_details"
                value={formData.bank_details}
                onChange={(e) => setFormData({ ...formData, bank_details: e.target.value })}
                placeholder="Bank account details for payment instructions..."
                rows={4}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <div className="flex flex-col">
                <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Inactive plans won't be available for new subscriptions but existing subscriptions remain valid
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {selectedPackage ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
