import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, BookOpen, DollarSign, Activity, Loader2, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { adminApi } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function AdminAnalytics() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [tempDateFrom, setTempDateFrom] = useState<Date>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  });
  const [tempDateTo, setTempDateTo] = useState<Date>(new Date());
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [analytics, setAnalytics] = useState<{
    overview?: {
      total_students?: number;
      total_tutors?: number;
      total_classes?: number;
      total_invoices?: number;
    };
    revenue?: {
      total_revenue?: string | number;
      pending_revenue?: string | number;
      overdue_revenue?: string | number;
    };
    sessions?: {
      total_sessions?: number;
      completed_sessions?: number;
      cancelled_sessions?: number;
    };
    assignments?: {
      total_assignments?: number;
      published_assignments?: number;
    };
    enrollment_trends?: Array<{ month: string; students: number; revenue: number }>;
    course_distribution?: Array<{ name: string; value: number; color: string }>;
    revenue_trends?: Array<{ month: string; revenue: number }>;
    top_courses?: Array<{ name: string; students: number; rate: number }>;
    performance_metrics?: Array<{ metric: string; value: number; target: number }>;
  }>({});

  const loadAnalytics = async (fromDate: Date, toDate: Date) => {
    try {
      setIsLoading(true);
      
      const params = {
        date_from: fromDate.toISOString().split('T')[0],
        date_to: toDate.toISOString().split('T')[0],
      };
      
      const data = await adminApi.getAnalytics(params);
      setAnalytics(data || {});
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Load analytics on initial mount
    loadAnalytics(dateFrom, dateTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Sync temporary dates with applied dates when popover opens
  useEffect(() => {
    if (isPopoverOpen) {
      setTempDateFrom(dateFrom);
      setTempDateTo(dateTo);
    }
  }, [isPopoverOpen, dateFrom, dateTo]);

  const handleApplyFilter = () => {
    // Validate dates
    if (!tempDateFrom || !tempDateTo) {
      toast({
        title: 'Error',
        description: 'Please select both From Date and To Date',
        variant: 'destructive',
      });
      return;
    }
    
    if (tempDateFrom > tempDateTo) {
      toast({
        title: 'Error',
        description: 'From Date cannot be after To Date',
        variant: 'destructive',
      });
      return;
    }
    
    // Apply the filter
    setDateFrom(new Date(tempDateFrom));
    setDateTo(new Date(tempDateTo));
    loadAnalytics(new Date(tempDateFrom), new Date(tempDateTo));
    setIsPopoverOpen(false);
  };

  // Calculate completion rate from sessions
  const completionRate = analytics.sessions?.total_sessions 
    ? Math.round((analytics.sessions.completed_sessions || 0) / analytics.sessions.total_sessions * 100)
    : 0;

  // Calculate platform usage (published assignments / total assignments)
  const platformUsage = analytics.assignments?.total_assignments
    ? Math.round((analytics.assignments.published_assignments || 0) / analytics.assignments.total_assignments * 100)
    : 0;

  // Use API data for charts
  const enrollmentData = analytics.enrollment_trends || [];
  const courseData = analytics.course_distribution || [];
  const revenueData = analytics.revenue_trends || [];
  const topCourses = analytics.top_courses || [];

  // Performance metrics from API
  const performanceMetrics = analytics.performance_metrics || [
    { 
      metric: 'Class Completion Rate', 
      value: completionRate, 
      target: 85 
    },
    { 
      metric: 'Session Completion', 
      value: completionRate, 
      target: 80 
    },
    { 
      metric: 'Assignment Publishing', 
      value: platformUsage, 
      target: 90 
    },
    { 
      metric: 'Resource Usage', 
      value: 0, 
      target: 80 
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into platform performance and growth
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {dateFrom && dateTo ? (
                  <>
                    {format(dateFrom, 'MMM dd, yyyy')} - {format(dateTo, 'MMM dd, yyyy')}
                  </>
                ) : (
                  <span>Pick a date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">From Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={tempDateFrom}
                    onSelect={(date) => {
                      if (date) {
                        setTempDateFrom(date);
                      }
                    }}
                    disabled={(date) => {
                      // Disable dates after tempDateTo
                      return tempDateTo && date > tempDateTo;
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">To Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={tempDateTo}
                    onSelect={(date) => {
                      if (date) {
                        setTempDateTo(date);
                      }
                    }}
                    disabled={(date) => {
                      // Disable dates before tempDateFrom
                      return tempDateFrom && date < tempDateFrom;
                    }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      const today = new Date();
                      const thirtyDaysAgo = new Date();
                      thirtyDaysAgo.setDate(today.getDate() - 30);
                      setTempDateFrom(thirtyDaysAgo);
                      setTempDateTo(today);
                      // Apply immediately for quick action
                      setDateFrom(thirtyDaysAgo);
                      setDateTo(today);
                      loadAnalytics(thirtyDaysAgo, today);
                      setIsPopoverOpen(false);
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Last 30 Days
                  </Button>
                  <Button 
                    onClick={handleApplyFilter}
                    className="flex-1"
                  >
                    Apply Filter
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="enrollment">Enrollment</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ${typeof analytics.revenue?.total_revenue === 'string' 
                        ? parseFloat(analytics.revenue.total_revenue).toLocaleString() 
                        : (analytics.revenue?.total_revenue || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Pending: ${typeof analytics.revenue?.pending_revenue === 'string' 
                        ? parseFloat(analytics.revenue.pending_revenue).toLocaleString() 
                        : (analytics.revenue?.pending_revenue || 0).toLocaleString()}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {(analytics.overview?.total_students || 0).toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total students in system
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Course Completion</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{completionRate}%</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.sessions?.completed_sessions || 0} of {analytics.sessions?.total_sessions || 0} sessions completed
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Platform Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <div className="h-8 w-32 bg-muted animate-pulse rounded" />
                    <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{platformUsage}%</div>
                    <p className="text-xs text-muted-foreground">
                      {analytics.assignments?.published_assignments || 0} of {analytics.assignments?.total_assignments || 0} assignments published
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Enrollment Trends</CardTitle>
                <CardDescription>Monthly student enrollment over time</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={enrollmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="students" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Distribution</CardTitle>
                <CardDescription>Distribution of students across course categories</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={courseData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {courseData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="enrollment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Enrollment Analytics</CardTitle>
              <CardDescription>Detailed enrollment patterns and trends</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={enrollmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="students" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Monthly revenue trends and projections</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators and targets</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-2 w-full bg-muted animate-pulse rounded" />
                        <div className="h-3 w-40 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  performanceMetrics.map((metric) => (
                    <div key={metric.metric} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{metric.metric}</span>
                        <span className="font-medium">{metric.value}%</span>
                      </div>
                      <Progress value={metric.value} className="h-2" />
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <span>Target: {metric.target}%</span>
                      {metric.value >= metric.target ? (
                        <Badge variant="default">On Track</Badge>
                      ) : (
                        <Badge variant="secondary">Below Target</Badge>
                      )}
                    </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performing Courses</CardTitle>
                <CardDescription>Courses with highest completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                          <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                        </div>
                        <div className="h-6 w-12 bg-muted animate-pulse rounded" />
                      </div>
                    ))}
                  </div>
                ) : topCourses.length > 0 ? (
                  <div className="space-y-4">
                    {topCourses.map((course) => (
                      <div key={course.name} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{course.name}</p>
                          <p className="text-sm text-muted-foreground">{course.students} students</p>
                        </div>
                        <Badge variant="default">{course.rate}%</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No course performance data available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
