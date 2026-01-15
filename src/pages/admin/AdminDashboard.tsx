import { useEffect, useState } from 'react';
import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, Calendar, MessageSquare, AlertCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import DashboardAlerts from '@/components/admin/DashboardAlerts';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    total_students?: number;
    total_tutors?: number;
    total_classes?: number;
    monthly_revenue?: number;
    recent_activities?: any[];
    enrollment_progress?: {
      current: number;
      target: number;
      percentage: number;
    };
    system_status?: {
      server_health: string;
      database_performance: string;
      backup_status: string;
    };
  }>({
    total_students: 0,
    total_tutors: 0,
    total_classes: 0,
    monthly_revenue: 0,
    recent_activities: [],
    enrollment_progress: { current: 0, target: 125, percentage: 0 },
    system_status: { server_health: 'Excellent', database_performance: 'Good', backup_status: 'Scheduled' },
  });

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setIsLoading(true);
        const data = await adminApi.getDashboard();
        
        // Ensure all values are numbers, handling both string and number types
        // monthly_revenue comes as string "2525.00" from API
        setStats({
          total_students: data?.total_students != null ? Number(data.total_students) : 0,
          total_tutors: data?.total_tutors != null ? Number(data.total_tutors) : 0,
          total_classes: data?.total_classes != null ? Number(data.total_classes) : 0,
          monthly_revenue: data?.monthly_revenue != null ? parseFloat(String(data.monthly_revenue)) : 0,
          recent_activities: data?.recent_activities || [],
          enrollment_progress: data?.enrollment_progress || { current: 0, target: 125, percentage: 0 },
          system_status: data?.system_status || { server_health: 'Excellent', database_performance: 'Good', backup_status: 'Scheduled' },
        });
      } catch (error) {
        console.error('Failed to load dashboard:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
        // Keep default values on error
        setStats({
          total_students: 0,
          total_tutors: 0,
          total_classes: 0,
          monthly_revenue: 0,
          recent_activities: [],
          enrollment_progress: { current: 0, target: 125, percentage: 0 },
          system_status: { server_health: 'Excellent', database_performance: 'Good', backup_status: 'Scheduled' },
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [toast]);

  const statsCards = [
    {
      title: 'Total Students',
      value: (stats.total_students ?? 0).toLocaleString(),
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Tutors',
      value: (stats.total_tutors ?? 0).toString(),
      change: '+3%',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Classes',
      value: (stats.total_classes ?? 0).toString(),
      change: '+8%',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Monthly Revenue',
      value: `$${(stats.monthly_revenue ?? 0).toLocaleString()}`,
      change: '+18%',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];


  const quickActions = [
    { label: 'Add New Student', href: '/admin/users?tab=students&action=new' },
    { label: 'Create Class', href: '/admin/classes?action=new' },
    { label: 'View Reports', href: '/admin/analytics' },
    { label: 'Manage Billing', href: '/admin/billing' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening at MBEST today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                </CardTitle>
                <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))
        ) : (
          statsCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                  {stat.change} from last month
                </div>
              </CardContent>
            </Card>
          );
        }))}
      </div>

      {/* Dashboard Alerts */}
      <DashboardAlerts />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Activity */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest system activities and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-muted animate-pulse" />
                    <div className="flex-1 space-y-1">
                      <div className="h-4 w-64 bg-muted animate-pulse rounded" />
                      <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                    </div>
                    <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                  </div>
                ))
              ) : stats.recent_activities && stats.recent_activities.length > 0 ? (
                stats.recent_activities.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4">
                  <div className={`h-2 w-2 rounded-full ${
                    activity.status === 'success' ? 'bg-green-500' :
                    activity.status === 'warning' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                  <Badge variant={
                    activity.status === 'success' ? 'default' :
                    activity.status === 'warning' ? 'destructive' :
                    'secondary'
                  }>
                    {activity.status}
                  </Badge>
                </div>
              ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activities
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats & Actions */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>
              Key metrics and quick actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enrollment Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Monthly Enrollment Target</span>
                <span>{isLoading ? '...' : `${stats.enrollment_progress?.percentage || 0}%`}</span>
              </div>
              <Progress value={isLoading ? 0 : (stats.enrollment_progress?.percentage || 0)} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {isLoading ? 'Loading...' : `${stats.enrollment_progress?.current || 0} of ${stats.enrollment_progress?.target || 125} target enrollments this month`}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Quick Actions</h4>
              <div className="grid grid-cols-1 gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* System Status */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">System Status</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Server Health</span>
                  <Badge variant="default">
                    {isLoading ? '...' : (stats.system_status?.server_health || 'Excellent')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Database Performance</span>
                  <Badge variant="default">
                    {isLoading ? '...' : (stats.system_status?.database_performance || 'Good')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Backup Status</span>
                  <Badge variant="secondary">
                    {isLoading ? '...' : (stats.system_status?.backup_status || 'Scheduled')}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}