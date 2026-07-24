import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, MoreVertical, User, Users, GraduationCap, UserCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminUser } from '@/lib/api/admin';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

type AdminListRoleFilter = 'tutor' | 'parent' | 'student';

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<AdminListRoleFilter>('tutor');
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [appliedAccountStatus, setAppliedAccountStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [appliedSpecialization, setAppliedSpecialization] = useState('');
  const [draftAccountStatus, setDraftAccountStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [draftSpecialization, setDraftSpecialization] = useState('');
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [viewProfileDialogOpen, setViewProfileDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  
  // Form states
  const [addUserForm, setAddUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: '',
    password: '',
    phone: '',
  });
  const [editUserForm, setEditUserForm] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    is_active: true,
  });
  const [resetPasswordForm, setResetPasswordForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [showResetPasswordNew, setShowResetPasswordNew] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [lastPage, setLastPage] = useState(1);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    tutors: 0,
    parents: 0,
  });

  // Fetch user stats from API
  const fetchUserStats = async () => {
    try {
      const statsData = await adminApi.getUserStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch user stats:', err);
      // Don't show error toast for stats, just log it
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {
        per_page: perPage,
        page: currentPage,
      };

      params.role = roleFilter;

      if (appliedSearch) {
        params.search = appliedSearch;
      }

      if (appliedAccountStatus !== 'all') {
        params.is_active = appliedAccountStatus === 'active';
      }

      const specialization = appliedSpecialization.trim();
      if (specialization) {
        params.specialization = specialization;
      }

      const result = await adminApi.getUsers(params);
      
      // Backend already excludes admin users, but double-check
      const filteredUsers = result.users.filter(u => u.role !== 'admin');
      setUsers(filteredUsers);
      setTotalUsers(result.total);
      setLastPage(result.last_page);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch users');
      toast({
        title: "Error",
        description: err.message || 'Failed to fetch users',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats on component mount
  useEffect(() => {
    fetchUserStats();
  }, []);

  const applySearch = () => {
    setAppliedSearch(searchInput.trim());
    setCurrentPage(1);
  };

  const clearAppliedSearch = () => {
    setSearchInput('');
    setAppliedSearch('');
    setCurrentPage(1);
  };

  const searchInputEmpty = searchInput.trim() === '';
  const showClearSearchButton = searchInputEmpty && appliedSearch !== '';

  const handleSearchControlClick = () => {
    if (showClearSearchButton) {
      clearAppliedSearch();
      return;
    }
    if (!searchInputEmpty) {
      applySearch();
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, appliedSearch, appliedAccountStatus, appliedSpecialization, currentPage]);

  // Refresh stats after user operations
  const refreshStats = () => {
    fetchUserStats();
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <UserCheck className="h-4 w-4" />;
      case 'tutor': return <GraduationCap className="h-4 w-4" />;
      case 'student': return <User className="h-4 w-4" />;
      case 'parent': return <Users className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'tutor': return 'default';
      case 'student': return 'secondary';
      case 'parent': return 'outline';
      default: return 'secondary';
    }
  };

  const handleAddUser = async () => {
    try {
      if (!addUserForm.firstName || !addUserForm.lastName || !addUserForm.email || !addUserForm.role || !addUserForm.password) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      const isValidPassword =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(addUserForm.password);
      if (!isValidPassword) {
        toast({
          title: "Validation Error",
          description: "Password must include uppercase, lowercase, a number, and a special character.",
          variant: "destructive",
        });
        return;
      }

      const phoneDigits = addUserForm.phone.trim();
      if (phoneDigits && !/^\+61\d{9}$/.test(phoneDigits.replace(/[\s-]/g, ''))) {
        toast({
          title: "Validation Error",
          description: "Phone must be a valid Australian number in the format +61XXXXXXXXX.",
          variant: "destructive",
        });
        return;
      }

      await adminApi.createUser({
        name: `${addUserForm.firstName} ${addUserForm.lastName}`,
        email: addUserForm.email,
        password: addUserForm.password,
        role: addUserForm.role,
        phone: phoneDigits ? phoneDigits.replace(/[\s-]/g, '') : undefined,
      });

      toast({
        title: "Success",
        description: "User created successfully",
      });
      
      setAddUserDialogOpen(false);
      setAddUserForm({
        firstName: '',
        lastName: '',
        email: '',
        role: '',
        password: '',
        phone: '',
      });
      fetchUsers();
      refreshStats();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to create user',
        variant: "destructive",
      });
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setEditUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      is_active: user.is_active,
    });
    setEditUserDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      await adminApi.updateUser(selectedUser.id, editUserForm);
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      setEditUserDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
      refreshStats();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update user',
        variant: "destructive",
      });
    }
  };

  const handleResetPassword = (user: AdminUser) => {
    setSelectedUser(user);
    setResetPasswordForm({
      password: '',
      confirmPassword: '',
    });
    setShowResetPasswordNew(false);
    setShowResetPasswordConfirm(false);
    setResetPasswordDialogOpen(true);
  };

  const handleResetPasswordSubmit = async () => {
    if (!selectedUser) return;

    if (!resetPasswordForm.password || resetPasswordForm.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }

    const isValidPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/.test(
        resetPasswordForm.password
      );
    if (!isValidPassword) {
      toast({
        title: "Validation Error",
        description: "Password must include uppercase, lowercase, a number, and a special character.",
        variant: "destructive",
      });
      return;
    }

    if (resetPasswordForm.password !== resetPasswordForm.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      await adminApi.resetUserPassword(selectedUser.id, resetPasswordForm.password);
      toast({
        title: "Success",
        description: "Password reset successfully",
      });
      setResetPasswordDialogOpen(false);
      setSelectedUser(null);
      setResetPasswordForm({
        password: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to reset password',
        variant: "destructive",
      });
    }
  };

  const handleDeactivateUser = async (user: AdminUser) => {
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active });
      toast({
        title: "Success",
        description: user.is_active ? "User deactivated successfully" : "User activated successfully",
      });
      fetchUsers();
      refreshStats();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to update user status',
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await adminApi.deleteUser(user.id);
      toast({
        title: result.deactivated ? "Account Deactivated" : "Success",
        description: result.message || "User deleted successfully",
      });
      fetchUsers();
      refreshStats();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Failed to delete user',
        variant: "destructive",
      });
    }
  };

  const handleViewProfile = (user: AdminUser) => {
    setSelectedUser(user);
    setViewProfileDialogOpen(true);
  };

  const userStats = [
    {
      role: 'Total Users',
      count: stats.total,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      role: 'Students',
      count: stats.students,
      icon: User,
      color: 'text-green-600'
    },
    {
      role: 'Tutors',
      count: stats.tutors,
      icon: GraduationCap,
      color: 'text-purple-600'
    },
    {
      role: 'Parents',
      count: stats.parents,
      icon: Users,
      color: 'text-orange-600'
    },
  ];

  const getSpecialization = (user: AdminUser): string[] => {
    if (user.role !== 'tutor' || !user.tutor?.specialization) return [];
    const s = user.tutor.specialization;
    return Array.isArray(s) ? s : [];
  };

  const getTutorHourlyRateDisplay = (user: AdminUser): string => {
    if (user.role !== 'tutor' || user.tutor?.hourly_rate == null) {
      return '—';
    }
    const n = Number(user.tutor.hourly_rate);
    if (Number.isNaN(n)) return '—';
    return `$${n.toFixed(2)}/hr`;
  };

  const firstDetailColumnTitle: string =
    roleFilter === 'tutor'
      ? 'Specialization'
      : roleFilter === 'parent'
        ? 'Package'
        : 'Family package';

  const secondDetailColumnTitle: string =
    roleFilter === 'tutor'
      ? 'Hourly rate'
      : roleFilter === 'parent'
        ? 'Student count'
        : 'Classes';

  const renderPackageOrFamilyPlanCell = (user: AdminUser): string => {
    if (user.role === 'parent') return user.package?.name ?? '—';
    if (user.role === 'student') return user.family_package_name ?? '—';
    return '—';
  };

  const renderCountCell = (user: AdminUser): string => {
    if (user.role === 'parent') return String(user.children_count ?? 0);
    if (user.role === 'student') return String(user.enrolled_classes_count ?? 0);
    return '—';
  };

  const displayedUsers = useMemo(
    () => users.filter((user) => user.role !== 'admin'),
    [users]
  );

  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const allDisplayedSelected = displayedUsers.length > 0 && selectedUserIds.length === displayedUsers.length;

  const toggleSelectAll = () => {
    setSelectedUserIds(allDisplayedSelected ? [] : displayedUsers.map((u) => u.id));
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUserIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleBulkSetActive = async (active: boolean) => {
    try {
      await Promise.all(selectedUserIds.map((id) => adminApi.updateUser(id, { is_active: active })));
      toast({
        title: "Success",
        description: `${selectedUserIds.length} user${selectedUserIds.length === 1 ? '' : 's'} ${active ? 'activated' : 'deactivated'}.`,
      });
      setSelectedUserIds([]);
      fetchUsers();
      refreshStats();
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || 'Bulk update failed',
        variant: "destructive",
      });
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground">
            Manage students, tutors, and parents
          </p>
        </div>
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account for the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Enter first name"
                    value={addUserForm.firstName}
                    onChange={(e) => setAddUserForm({ ...addUserForm, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Enter last name"
                    value={addUserForm.lastName}
                    onChange={(e) => setAddUserForm({ ...addUserForm, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="Enter email address"
                  value={addUserForm.email}
                  onChange={(e) => setAddUserForm({ ...addUserForm, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone">Phone (optional)</Label>
                <Input
                  id="add-phone"
                  type="tel"
                  placeholder="+61XXXXXXXXX"
                  value={addUserForm.phone}
                  onChange={(e) => setAddUserForm({ ...addUserForm, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select
                  value={addUserForm.role}
                  onValueChange={(value) => setAddUserForm({ ...addUserForm, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="tutor">Tutor</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Temporary Password *</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter temporary password"
                  value={addUserForm.password}
                  onChange={(e) => setAddUserForm({ ...addUserForm, password: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddUserDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddUser}>
                  Create User
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {userStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.role}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.role}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.count}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              name="admin-user-list-search"
              autoComplete="off"
              placeholder="Search users..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchControlClick();
                }
              }}
              className="pl-10"
            />
          </div>
          <Button
            type="button"
            variant={showClearSearchButton ? 'outline' : 'default'}
            disabled={searchInputEmpty && !appliedSearch}
            onClick={handleSearchControlClick}
          >
            {showClearSearchButton ? 'Clear Search' : 'Search'}
          </Button>
          <Select
            value={roleFilter}
            onValueChange={(v) => setRoleFilter(v as AdminListRoleFilter)}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutor">Tutors</SelectItem>
              <SelectItem value="parent">Parents</SelectItem>
              <SelectItem value="student">Students</SelectItem>
            </SelectContent>
          </Select>
          <Popover
            open={moreFiltersOpen}
            onOpenChange={(open) => {
              setMoreFiltersOpen(open);
              if (open) {
                setDraftAccountStatus(appliedAccountStatus);
                setDraftSpecialization(appliedSpecialization);
              }
            }}
          >
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" className="relative">
                <Filter className="mr-2 h-4 w-4" />
                More Filters
                {(appliedAccountStatus !== 'all' || appliedSpecialization.trim() !== '') && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-primary-foreground">
                    {(appliedAccountStatus !== 'all' ? 1 : 0) + (appliedSpecialization.trim() ? 1 : 0)}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Account status</Label>
                  <Select
                    value={draftAccountStatus}
                    onValueChange={(v) => setDraftAccountStatus(v as 'all' | 'active' | 'inactive')}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active only</SelectItem>
                      <SelectItem value="inactive">Inactive only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filter-department">Subjects Taught (tutors)</Label>
                  <Input
                    id="filter-department"
                    name="admin-user-filter-department"
                    autoComplete="off"
                    placeholder="e.g. Mathematics"
                    value={draftSpecialization}
                    onChange={(e) => setDraftSpecialization(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Narrows to tutor profiles whose subjects taught contain this text.
                  </p>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDraftAccountStatus('all');
                      setDraftSpecialization('');
                      setAppliedAccountStatus('all');
                      setAppliedSpecialization('');
                      setCurrentPage(1);
                      setMoreFiltersOpen(false);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setAppliedAccountStatus(draftAccountStatus);
                      setAppliedSpecialization(draftSpecialization.trim());
                      setCurrentPage(1);
                      setMoreFiltersOpen(false);
                    }}
                  >
                    Apply filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <Card>
            <CardHeader>
              <CardTitle>Users</CardTitle>
              <CardDescription>
                Tutors are shown by default. Switch the filter for parents or students. Admins are never listed here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedUserIds.length > 0 && (
                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg border bg-muted/40">
                  <span className="text-sm font-medium">{selectedUserIds.length} selected</span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkSetActive(true)}>Activate</Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkSetActive(false)}>Deactivate</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedUserIds([])}>Clear</Button>
                </div>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="text-center py-8 text-destructive">{error}</div>
              ) : displayedUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No users found</div>
              ) : (
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card shadow-sm [&_tr]:bg-card">
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox checked={allDisplayedSelected} onCheckedChange={toggleSelectAll} aria-label="Select all users" />
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>{firstDetailColumnTitle}</TableHead>
                      <TableHead>{secondDetailColumnTitle}</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.includes(user.id)}
                            onCheckedChange={() => toggleSelectUser(user.id)}
                            aria-label={`Select ${user.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar || undefined} alt={user.name} />
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              {user.name}
                              {user.role === 'student' && user.student?.grade ? ` – ${user.student.grade}` : ''}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={getRoleColor(user.role)}>
                              <div className="flex items-center gap-1">
                                {getRoleIcon(user.role)}
                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                              </div>
                            </Badge>
                            {user.is_incomplete_profile && (
                              <Badge variant="destructive">Incomplete profile</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell className="max-w-[220px]">
                          {roleFilter === 'tutor' ? (
                            getSpecialization(user).length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {getSpecialization(user).map((spec) => (
                                  <Badge key={spec} variant="outline" className="text-xs font-normal">
                                    {spec}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )
                          ) : (
                            <span
                              className="line-clamp-2"
                              title={renderPackageOrFamilyPlanCell(user)}
                            >
                              {renderPackageOrFamilyPlanCell(user)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
                          {roleFilter === 'tutor'
                            ? getTutorHourlyRateDisplay(user)
                            : renderCountCell(user)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? 'default' : 'secondary'}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewProfile(user)}>
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                                Reset Password
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeactivateUser(user)}
                              >
                                {user.is_active ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteUser(user)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!loading && !error && displayedUsers.length > 0 && lastPage > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * perPage) + 1} to {Math.min(currentPage * perPage, totalUsers)} of {totalUsers} users
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {(() => {
                        const pages = [];
                        const maxPages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
                        let endPage = Math.min(lastPage, startPage + maxPages - 1);
                        
                        if (endPage - startPage < maxPages - 1) {
                          startPage = Math.max(1, endPage - maxPages + 1);
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(i);
                        }
                        
                        return pages.map((pageNum) => (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        ));
                      })()}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < lastPage && setCurrentPage(currentPage + 1)}
                          className={currentPage === lastPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Full Name *</Label>
              <Input 
                id="editName" 
                placeholder="Enter full name"
                value={editUserForm.name}
                onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email Address *</Label>
              <Input 
                id="editEmail" 
                type="email" 
                placeholder="Enter email address"
                value={editUserForm.email}
                onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Phone</Label>
              <Input 
                id="editPhone" 
                placeholder="Enter phone number"
                value={editUserForm.phone}
                onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select 
                value={editUserForm.is_active ? 'active' : 'inactive'} 
                onValueChange={(value) => setEditUserForm({ ...editUserForm, is_active: value === 'active' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditUserDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateUser}>
                Update User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog
        open={resetPasswordDialogOpen}
        onOpenChange={(open) => {
          setResetPasswordDialogOpen(open);
          if (!open) {
            setShowResetPasswordNew(false);
            setShowResetPasswordConfirm(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 mt-4"
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              handleResetPasswordSubmit();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  name="admin-reset-password-new"
                  type={showResetPasswordNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter new password (min 8 characters)"
                  value={resetPasswordForm.password}
                  onChange={(e) =>
                    setResetPasswordForm({ ...resetPasswordForm, password: e.target.value })
                  }
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowResetPasswordNew((v) => !v)}
                  aria-label={showResetPasswordNew ? 'Hide password' : 'Show password'}
                >
                  {showResetPasswordNew ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="admin-reset-password-confirm"
                  type={showResetPasswordConfirm ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) =>
                    setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })
                  }
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowResetPasswordConfirm((v) => !v)}
                  aria-label={showResetPasswordConfirm ? 'Hide password' : 'Show password'}
                >
                  {showResetPasswordConfirm ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Reset Password
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Profile Dialog */}
      <Dialog open={viewProfileDialogOpen} onOpenChange={setViewProfileDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
            <DialogDescription>
              View detailed information about {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedUser.avatar || undefined} alt={selectedUser.name} />
                  <AvatarFallback className="text-lg">
                    {selectedUser.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <Badge variant={getRoleColor(selectedUser.role)} className="mt-2">
                    <div className="flex items-center gap-1">
                      {getRoleIcon(selectedUser.role)}
                      {selectedUser.role.charAt(0).toUpperCase() + selectedUser.role.slice(1)}
                    </div>
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <Label className="text-muted-foreground">Phone</Label>
                  <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium">
                    <Badge variant={selectedUser.is_active ? 'default' : 'secondary'}>
                      {selectedUser.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Joined</Label>
                  <p className="font-medium">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
                {selectedUser.role === 'tutor' && getSpecialization(selectedUser).length > 0 && (
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Specializations</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getSpecialization(selectedUser).map((spec: string) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setViewProfileDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setViewProfileDialogOpen(false);
                  handleEditUser(selectedUser);
                }}>
                  Edit User
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
