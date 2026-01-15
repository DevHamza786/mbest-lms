import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, Eye, EyeOff, Briefcase, GraduationCap, DollarSign, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/lib/store/authStore';
import { commonApi } from '@/lib/api';

export default function ProfileSettings() {
  const session = useSession();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    bio: '',
    // Student-specific fields
    enrollment_id: '',
    grade: '',
    school: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    // Tutor-specific fields
    department: '',
    specialization: [] as string[],
    hourly_rate: '',
    qualifications: '',
    experience_years: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    assignmentReminders: true,
    gradeAlerts: true,
    classUpdates: true,
    darkMode: false,
    compactView: false,
    autoSave: true,
  });

  // Load profile data from API
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        const profile = await commonApi.profile.get();
        
        // Format date_of_birth from ISO string to YYYY-MM-DD for date input
        let formattedDate = '';
        if (profile.date_of_birth) {
          try {
            const date = new Date(profile.date_of_birth);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        }
        
        setProfileData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
          date_of_birth: formattedDate,
          // Student-specific fields
          enrollment_id: (profile as any).student?.enrollment_id || '',
          grade: (profile as any).student?.grade || '',
          school: (profile as any).student?.school || '',
          emergency_contact_name: (profile as any).student?.emergency_contact_name || '',
          emergency_contact_phone: (profile as any).student?.emergency_contact_phone || '',
          // Tutor-specific fields
          bio: (profile as any).tutor?.bio || '',
          department: (profile as any).tutor?.department || '',
          specialization: Array.isArray((profile as any).tutor?.specialization) 
            ? (profile as any).tutor.specialization 
            : [],
          hourly_rate: (profile as any).tutor?.hourly_rate ? String((profile as any).tutor.hourly_rate) : '',
          qualifications: (profile as any).tutor?.qualifications || '',
          experience_years: (profile as any).tutor?.experience_years ? String((profile as any).tutor.experience_years) : '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        // Update avatar preview and session
        if (profile.avatar) {
          // Convert relative path to full URL
          const avatarUrl = profile.avatar.startsWith('http') 
            ? profile.avatar 
            : profile.avatar.startsWith('/')
            ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${profile.avatar}`
            : `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${profile.avatar}`;
          setAvatarPreview(avatarUrl);
        } else {
          setAvatarPreview(null);
        }
        
        // Update session store with latest profile data (including name if changed)
        const { useAuthStore } = await import('@/lib/store/authStore');
        const currentSession = useAuthStore.getState().session;
        if (currentSession) {
          useAuthStore.setState({
            session: {
              ...currentSession,
              name: profile.name || currentSession.name,
              email: profile.email || currentSession.email,
              avatar: profile.avatar || currentSession.avatar,
            },
          });
          // Also update in localStorage
          const { getStorageItem, setStorageItem, STORAGE_KEYS } = await import('@/lib/utils/storage');
          const stored = getStorageItem(STORAGE_KEYS.SESSION);
          if (stored) {
            setStorageItem(STORAGE_KEYS.SESSION, {
              ...stored,
              name: profile.name || stored.name,
              email: profile.email || stored.email,
              avatar: profile.avatar || stored.avatar,
            });
          }
        }
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to load profile information",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [toast]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Avatar must be less than 2MB",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

    try {
      setIsSaving(true);
      await commonApi.profile.uploadAvatar(avatarFile);
      toast({
        title: "Avatar Updated",
        description: "Your profile picture has been updated successfully.",
      });
      setAvatarFile(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileUpdate = async () => {
    try {
      setIsSaving(true);
      
      // Upload avatar first if changed
      if (avatarFile) {
        await handleAvatarUpload();
      }

      // Update profile
      const updateData: any = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        date_of_birth: profileData.date_of_birth || undefined,
      };

      // Include tutor-specific fields if user is a tutor
      if (session?.role === 'tutor') {
        updateData.department = profileData.department || undefined;
        updateData.specialization = profileData.specialization.length > 0 ? profileData.specialization : undefined;
        updateData.hourly_rate = profileData.hourly_rate ? parseFloat(profileData.hourly_rate) : undefined;
        updateData.qualifications = profileData.qualifications || undefined;
        updateData.experience_years = profileData.experience_years ? parseInt(profileData.experience_years) : undefined;
        updateData.bio = profileData.bio || undefined;
      }

      await commonApi.profile.update(updateData);

      // Reload profile data from API to reflect changes
      const refreshedProfile = await commonApi.profile.get();
      
      if (refreshedProfile) {
        // Format date_of_birth for date input
        let formattedDate = '';
        if (refreshedProfile.date_of_birth) {
          try {
            const date = new Date(refreshedProfile.date_of_birth);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
        }
        
        setProfileData(prev => ({
          ...prev,
          name: refreshedProfile.name || prev.name,
          email: refreshedProfile.email || prev.email,
          phone: refreshedProfile.phone || prev.phone,
          address: refreshedProfile.address || prev.address,
          date_of_birth: formattedDate || prev.date_of_birth,
          // Student-specific fields
          enrollment_id: (refreshedProfile as any).student?.enrollment_id || prev.enrollment_id,
          grade: (refreshedProfile as any).student?.grade || prev.grade,
          school: (refreshedProfile as any).student?.school || prev.school,
          emergency_contact_name: (refreshedProfile as any).student?.emergency_contact_name || prev.emergency_contact_name,
          emergency_contact_phone: (refreshedProfile as any).student?.emergency_contact_phone || prev.emergency_contact_phone,
          // Tutor-specific fields
          bio: (refreshedProfile as any).tutor?.bio || prev.bio,
          department: (refreshedProfile as any).tutor?.department || prev.department,
          specialization: Array.isArray((refreshedProfile as any).tutor?.specialization)
            ? (refreshedProfile as any).tutor.specialization
            : prev.specialization,
          hourly_rate: (refreshedProfile as any).tutor?.hourly_rate ? String((refreshedProfile as any).tutor.hourly_rate) : prev.hourly_rate,
          qualifications: (refreshedProfile as any).tutor?.qualifications || prev.qualifications,
          experience_years: (refreshedProfile as any).tutor?.experience_years ? String((refreshedProfile as any).tutor.experience_years) : prev.experience_years,
        }));

        // Update avatar preview and session
        if (refreshedProfile.avatar) {
          // Convert relative path to full URL
          const avatarUrl = refreshedProfile.avatar.startsWith('http') 
            ? refreshedProfile.avatar 
            : refreshedProfile.avatar.startsWith('/')
            ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${refreshedProfile.avatar}`
            : `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${refreshedProfile.avatar}`;
          setAvatarPreview(avatarUrl);
          
          // Update session store
          const { useAuthStore } = await import('@/lib/store/authStore');
          const currentSession = useAuthStore.getState().session;
          if (currentSession) {
            useAuthStore.setState({
              session: {
                ...currentSession,
                avatar: refreshedProfile.avatar,
              },
            });
            // Update in localStorage
            const { getStorageItem, setStorageItem, STORAGE_KEYS } = await import('@/lib/utils/storage');
            const stored = getStorageItem(STORAGE_KEYS.SESSION);
            if (stored) {
              setStorageItem(STORAGE_KEYS.SESSION, {
                ...stored,
                avatar: refreshedProfile.avatar,
              });
            }
          }
        } else {
          setAvatarPreview(null);
        }
      }

      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation don't match.",
        variant: "destructive",
      });
      return;
    }

    if (profileData.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      await commonApi.profile.changePassword({
        current_password: profileData.currentPassword,
        password: profileData.newPassword,
        password_confirmation: profileData.confirmPassword,
      });
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
      
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesUpdate = () => {
    toast({
      title: "Preferences Updated",
      description: "Your notification and display preferences have been saved.",
    });
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
          <p className="text-muted-foreground">
            Manage your account information and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Profile Picture */}
                  <div className="flex items-center gap-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage 
                        src={avatarPreview || (session?.avatar ? (
                          session.avatar.startsWith('http') 
                            ? session.avatar 
                            : session.avatar.startsWith('/')
                            ? `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}${session.avatar}`
                            : `${import.meta.env.VITE_API_BASE_URL?.replace('/api/v1', '') || 'http://localhost:8000'}/storage/${session.avatar}`
                        ) : undefined)} 
                        alt={profileData.name || session?.name} 
                      />
                      <AvatarFallback className="text-lg">
                        {(profileData.name || session?.name || '')?.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{session?.role}</Badge>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/jpeg,image/png,image/gif"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => document.getElementById('avatar-upload')?.click()}
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Change Photo
                        </Button>
                        {avatarFile && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleAvatarUpload}
                            disabled={isSaving}
                          >
                            {isSaving ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="mr-2 h-4 w-4" />
                            )}
                            Upload
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG or GIF (max. 2MB)
                      </p>
                    </div>
                  </div>

              {/* Form Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      className="pl-10"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      className="pl-10"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      className="pl-10"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      className="pl-10"
                      value={profileData.address}
                      onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Enter your address"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={profileData.date_of_birth}
                    onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
              </div>

              {/* Student-specific fields */}
              {session?.role === 'student' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="enrollment_id">Enrollment ID</Label>
                      <Input
                        id="enrollment_id"
                        value={profileData.enrollment_id}
                        readOnly
                        className="bg-muted"
                        placeholder="Auto-generated"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="grade">Grade</Label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="grade"
                          className="pl-10 bg-muted"
                          value={profileData.grade}
                          readOnly
                          placeholder="Year level"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="school">School</Label>
                      <Input
                        id="school"
                        value={profileData.school}
                        readOnly
                        className="bg-muted"
                        placeholder="School name"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-base">Emergency Contact Information</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                        <Input
                          id="emergency_contact_name"
                          value={profileData.emergency_contact_name}
                          readOnly
                          className="bg-muted"
                          placeholder="Emergency contact name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="emergency_contact_phone"
                            className="pl-10 bg-muted"
                            value={profileData.emergency_contact_phone}
                            readOnly
                            placeholder="Emergency contact phone"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Tutor-specific fields */}
              {session?.role === 'tutor' && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="department"
                          className="pl-10"
                          value={profileData.department}
                          onChange={(e) => setProfileData(prev => ({ ...prev, department: e.target.value }))}
                          placeholder="e.g., Mathematics, Computer Science"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="hourly_rate"
                          type="number"
                          step="0.01"
                          className="pl-10"
                          value={profileData.hourly_rate}
                          onChange={(e) => setProfileData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience_years">Years of Experience</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        value={profileData.experience_years}
                        onChange={(e) => setProfileData(prev => ({ ...prev, experience_years: e.target.value }))}
                        placeholder="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Input
                        id="specialization"
                        value={profileData.specialization.join(', ')}
                        onChange={(e) => {
                          const specializations = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                          setProfileData(prev => ({ ...prev, specialization: specializations }));
                        }}
                        placeholder="e.g., Algebra, Calculus, Geometry (comma-separated)"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter specializations separated by commas
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="qualifications">Qualifications</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Textarea
                        id="qualifications"
                        className="pl-10 min-h-[100px]"
                        value={profileData.qualifications}
                        onChange={(e) => setProfileData(prev => ({ ...prev, qualifications: e.target.value }))}
                        placeholder="List your qualifications, certifications, and degrees..."
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  className="min-h-[100px]"
                />
              </div>

              <Button onClick={handleProfileUpdate} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPassword ? "text" : "password"}
                    value={profileData.currentPassword}
                    onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={profileData.newPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={profileData.confirmPassword}
                  onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>

              <Button onClick={handlePasswordChange} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, emailNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, pushNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Assignment Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get reminded about upcoming assignments
                    </p>
                  </div>
                  <Switch
                    checked={preferences.assignmentReminders}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, assignmentReminders: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Grade Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Be notified when new grades are available
                    </p>
                  </div>
                  <Switch
                    checked={preferences.gradeAlerts}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, gradeAlerts: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Class Updates</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about class changes
                    </p>
                  </div>
                  <Switch
                    checked={preferences.classUpdates}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, classUpdates: checked }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>
                Customize your learning experience
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compact View</Label>
                    <p className="text-sm text-muted-foreground">
                      Show more content in less space
                    </p>
                  </div>
                  <Switch
                    checked={preferences.compactView}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, compactView: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-save</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save your work as you type
                    </p>
                  </div>
                  <Switch
                    checked={preferences.autoSave}
                    onCheckedChange={(checked) => setPreferences(prev => ({ ...prev, autoSave: checked }))}
                  />
                </div>
              </div>

              <Button onClick={handlePreferencesUpdate}>
                <Save className="mr-2 h-4 w-4" />
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}