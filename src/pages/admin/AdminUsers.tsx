import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Plus, MoreVertical, User, Users, GraduationCap, UserCheck, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { useToast } from '@/hooks/use-toast';
import { adminApi, AdminUser } from '@/lib/api/admin';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination';

export default function AdminUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');
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

      // Apply role filter based on active tab
      if (activeTab !== 'all') {
        params.role = activeTab === 'students' ? 'student' : activeTab.slice(0, -1); // Remove 's' from end
      } else if (roleFilter !== 'all') {
        params.role = roleFilter;
      }

      // Apply search
      if (searchTerm) {
        params.search = searchTerm;
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

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [activeTab, roleFilter]);

  // Debounce search separately
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, roleFilter, searchTerm, currentPage]);

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

      await adminApi.createUser({
        name: `${addUserForm.firstName} ${addUserForm.lastName}`,
        email: addUserForm.email,
        password: addUserForm.password,
        role: addUserForm.role,
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
      await adminApi.deleteUser(user.id);
      toast({
        title: "Success",
        description: "User deleted successfully",
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

  // Get department from tutor relationship
  const getDepartment = (user: AdminUser) => {
    if (user.role === 'tutor' && (user as any).tutor?.department) {
      return (user as any).tutor.department;
    }
    return '-';
  };

  // Get specialization from tutor relationship
  const getSpecialization = (user: AdminUser) => {
    if (user.role === 'tutor' && (user as any).tutor?.specialization) {
      return (user as any).tutor.specialization;
    }
    return [];
  };

  // Filter users for display (client-side filtering for tabs, excluding admins)
  const displayedUsers = useMemo(() => {
    // Already filtered in fetchUsers, but double-check to exclude admins
    let filtered = users.filter(user => user.role !== 'admin');
    
    if (activeTab === 'all') {
      return filtered;
    }
    const roleMap: Record<string, string> = {
      'students': 'student',
      'tutors': 'tutor',
      'parents': 'parent',
    };
    return filtered.filter(user => user.role === roleMap[activeTab]);
  }, [users, activeTab]);

  // Memoize student users to avoid re-filtering
  const studentUsers = useMemo(() => {
    return displayedUsers.filter(user => user.role === 'student');
  }, [displayedUsers]);

  // Memoize tutor users
  const tutorUsers = useMemo(() => {
    return displayedUsers.filter(user => user.role === 'tutor');
  }, [displayedUsers]);

  // Memoize parent users
  const parentUsers = useMemo(() => {
    return displayedUsers.filter(user => user.role === 'parent');
  }, [displayedUsers]);

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
            Manage students, tutors, parents, and administrators
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="tutors">Tutors</TabsTrigger>
          <TabsTrigger value="parents">Parents</TabsTrigger>
        </TabsList>

        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Administrators</SelectItem>
              <SelectItem value="tutor">Tutors</SelectItem>
              <SelectItem value="student">Students</SelectItem>
              <SelectItem value="parent">Parents</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            More Filters
          </Button>
        </div>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Complete list of all platform users
              </CardDescription>
            </CardHeader>
            <CardContent>
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
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar || undefined} alt={user.name} />
                              <AvatarFallback>
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleColor(user.role)}>
                            <div className="flex items-center gap-1">
                              {getRoleIcon(user.role)}
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{getDepartment(user)}</TableCell>
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
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : studentUsers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">No students found</div>
            ) : (
              studentUsers.map((student) => (
                <Card key={student.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={student.avatar || undefined} alt={student.name} />
                          <AvatarFallback>
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{student.name}</CardTitle>
                          <CardDescription>{student.email}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProfile(student)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(student)}>Edit Student</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(student)}>Reset Password</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {student.student?.grade && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Grade:</span>
                          <span className="font-medium">{student.student.grade}</span>
                        </div>
                      )}
                      {student.student?.enrollment_id && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Enrollment ID:</span>
                          <span className="font-medium">{student.student.enrollment_id}</span>
                        </div>
                      )}
                      {student.parents_data && student.parents_data.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Parent(s):</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {student.parents_data.map((parent) => (
                              <div key={parent.id} className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={parent.avatar || undefined} alt={parent.name} />
                                  <AvatarFallback className="text-xs">
                                    {parent.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium">{parent.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined:</span>
                        <span className="font-medium">
                          {new Date(student.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={student.is_active ? 'default' : 'secondary'}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="tutors" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tutorUsers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">No tutors found</div>
            ) : (
              tutorUsers.map((tutor) => (
                <Card key={tutor.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={tutor.avatar || undefined} alt={tutor.name} />
                          <AvatarFallback>
                            {tutor.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{tutor.name}</CardTitle>
                          <CardDescription>{tutor.email}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProfile(tutor)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(tutor)}>Edit Tutor</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(tutor)}>Reset Password</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Department:</span>
                        <span className="font-medium">{getDepartment(tutor)}</span>
                      </div>
                      {getSpecialization(tutor).length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Specializations:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {getSpecialization(tutor).map((spec: string) => (
                              <Badge key={spec} variant="outline" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined:</span>
                        <span className="font-medium">
                          {new Date(tutor.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="parents" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : parentUsers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">No parents found</div>
            ) : (
              parentUsers.map((parent) => (
                <Card key={parent.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={parent.avatar || undefined} alt={parent.name} />
                          <AvatarFallback>
                            {parent.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{parent.name}</CardTitle>
                          <CardDescription>{parent.email}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewProfile(parent)}>View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditUser(parent)}>Edit Parent</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleResetPassword(parent)}>Reset Password</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Joined:</span>
                        <span className="font-medium">
                          {new Date(parent.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={parent.is_active ? 'default' : 'secondary'}>
                          {parent.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

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
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <Input 
                id="newPassword" 
                type="password" 
                placeholder="Enter new password (min 8 characters)"
                value={resetPasswordForm.password}
                onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input 
                id="confirmPassword" 
                type="password" 
                placeholder="Confirm new password"
                value={resetPasswordForm.confirmPassword}
                onChange={(e) => setResetPasswordForm({ ...resetPasswordForm, confirmPassword: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleResetPasswordSubmit}>
                Reset Password
              </Button>
            </div>
          </div>
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
                  <Label className="text-muted-foreground">Department</Label>
                  <p className="font-medium">{getDepartment(selectedUser)}</p>
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
