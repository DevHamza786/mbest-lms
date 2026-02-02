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
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (pkg: Package) => {
    setSelectedPackage(pkg);
    setFormData({
      name: pkg.name,
      price: typeof pkg.price === 'string' ? parseFloat(pkg.price) : pkg.price,
      description: pkg.description || '',
      student_limit: pkg.student_limit,
      class_ids: pkg.classes?.map(c => c.id) || [],
      allows_one_on_one: pkg.allows_one_on_one,
      bank_details: pkg.bank_details || '',
      is_active: pkg.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleClassToggle = (classId: number) => {
    const currentIds = formData.class_ids || [];
    if (currentIds.includes(classId)) {
      setFormData({
        ...formData,
        class_ids: currentIds.filter(id => id !== classId),
      });
    } else {
      setFormData({
        ...formData,
        class_ids: [...currentIds, classId],
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (selectedPackage) {
        await adminApi.updatePackage(selectedPackage.id, formData);
        toast({
          title: 'Success',
          description: 'Package updated successfully',
        });
      } else {
        await adminApi.createPackage(formData);
        toast({
          title: 'Success',
          description: 'Package created successfully',
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
          <h1 className="text-3xl font-bold">Subscription Packages</h1>
          <p className="text-muted-foreground">Manage subscription packages for parents</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Package
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Packages</CardTitle>
          <CardDescription>
            Manage subscription packages and their limits. Packages cannot be deleted to maintain subscription history. 
            Use the "Active" toggle to deactivate packages instead.
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
                    No packages found. Create your first package.
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
            <DialogTitle>{selectedPackage ? 'Edit Package' : 'Create Package'}</DialogTitle>
            <DialogDescription>
              {selectedPackage ? 'Update package details' : 'Create a new subscription package'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Package Name *</Label>
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
                placeholder="Package description..."
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
                    {classes.map((cls) => (
                      <div key={cls.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`class-${cls.id}`}
                          checked={(formData.class_ids || []).includes(cls.id)}
                          onCheckedChange={() => handleClassToggle(cls.id)}
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
                  Inactive packages won't be available for new subscriptions but existing subscriptions remain valid
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
