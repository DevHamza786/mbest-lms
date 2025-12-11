import { Users, GraduationCap, BookOpen, DollarSign, TrendingUp, Calendar, MessageSquare, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import DashboardAlerts from '@/components/admin/DashboardAlerts';

export default function AdminDashboard() {
  const stats = [
    {
      title: 'Total Students',
      value: '1,247',
      change: '+12%',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Tutors',
      value: '43',
      change: '+3%',
      icon: GraduationCap,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Classes',
      value: '89',
      change: '+8%',
      icon: BookOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Monthly Revenue',
      value: '$127,850',
      change: '+18%',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: 'enrollment',
      message: 'Emma Thompson enrolled in Advanced Web Development',
      time: '2 hours ago',
      status: 'success',
    },
    {
      id: 2,
      type: 'payment',
      message: 'Payment received from Robert Thompson ($2,450)',
      time: '4 hours ago',
      status: 'success',
    },
    {
      id: 3,
      type: 'issue',
      message: 'Server maintenance scheduled for tonight',
      time: '6 hours ago',
      status: 'warning',
    },
    {
      id: 4,
      type: 'tutor',
      message: 'Dr. Michael Rodriguez updated course materials',
      time: '8 hours ago',
      status: 'info',
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
        <div className="flex gap-2">
          <Button variant="outline">Generate Report</Button>
          <Button>Quick Actions</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
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
        })}
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
              {recentActivities.map((activity) => (
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
              ))}
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
                <span>83%</span>
              </div>
              <Progress value={83} className="h-2" />
              <p className="text-xs text-muted-foreground">
                104 of 125 target enrollments this month
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
                  <Badge variant="default">Excellent</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Database Performance</span>
                  <Badge variant="default">Good</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Backup Status</span>
                  <Badge variant="secondary">Scheduled</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            System Alerts
          </CardTitle>
          <CardDescription>
            Important notifications requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
              <div className="h-2 w-2 rounded-full bg-yellow-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">Scheduled Maintenance</p>
                <p className="text-xs text-muted-foreground">
                  System maintenance tonight at 2:00 AM EST
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="h-2 w-2 rounded-full bg-blue-500" />
              <div className="flex-1">
                <p className="text-sm font-medium">New Feature Available</p>
                <p className="text-xs text-muted-foreground">
                  Enhanced messaging system is now live
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}