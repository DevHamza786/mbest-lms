import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  AlertTriangle, 
  FileText, 
  Calendar, 
  UserX, 
  DollarSign, 
  Clock,
  ShieldAlert,
  ClipboardList,
  ChevronRight
} from "lucide-react";

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'session' | 'compliance' | 'billing' | 'attendance' | 'profile';
  title: string;
  description: string;
  count: number;
  action: string;
  actionUrl: string;
  icon: typeof AlertTriangle;
}

export default function DashboardAlerts() {
  const alerts: AlertItem[] = [
    {
      id: '1',
      type: 'critical',
      category: 'session',
      title: 'Unbilled Sessions',
      description: 'Sessions have been completed but not yet invoiced',
      count: 12,
      action: 'Review Sessions',
      actionUrl: '/admin/billing?filter=unbilled',
      icon: DollarSign,
    },
    {
      id: '2',
      type: 'critical',
      category: 'compliance',
      title: 'Expiring Compliance Documents',
      description: 'Teacher certifications expiring within 30 days',
      count: 3,
      action: 'View Documents',
      actionUrl: '/admin/users?tab=tutors&filter=expiring',
      icon: ShieldAlert,
    },
    {
      id: '3',
      type: 'warning',
      category: 'session',
      title: 'Missing Lesson Notes',
      description: 'Completed sessions without lesson notes',
      count: 8,
      action: 'Review Sessions',
      actionUrl: '/admin/classes?filter=missing-notes',
      icon: FileText,
    },
    {
      id: '4',
      type: 'warning',
      category: 'session',
      title: 'Conflicting Bookings',
      description: 'Teachers scheduled for multiple sessions at the same time',
      count: 2,
      action: 'Resolve Conflicts',
      actionUrl: '/admin/calendar?filter=conflicts',
      icon: Calendar,
    },
    {
      id: '5',
      type: 'info',
      category: 'billing',
      title: 'Overdue Invoices',
      description: 'Student invoices past due date',
      count: 5,
      action: 'View Invoices',
      actionUrl: '/admin/billing?filter=overdue',
      icon: Clock,
    },
    {
      id: '6',
      type: 'info',
      category: 'profile',
      title: 'Incomplete Profiles',
      description: 'Student or teacher profiles with missing information',
      count: 7,
      action: 'Review Profiles',
      actionUrl: '/admin/users?filter=incomplete',
      icon: UserX,
    },
    {
      id: '7',
      type: 'warning',
      category: 'attendance',
      title: 'Pending Timesheet Approvals',
      description: 'Tutor timesheets awaiting approval',
      count: 15,
      action: 'Review Timesheets',
      actionUrl: '/admin/hours?filter=pending',
      icon: ClipboardList,
    },
  ];

  const getAlertVariant = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
    }
  };

  const getAlertStyles = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return 'border-destructive/50 bg-destructive/5';
      case 'warning':
        return 'border-warning/50 bg-warning/5';
      case 'info':
        return 'border-primary/50 bg-primary/5';
    }
  };

  const criticalAlerts = alerts.filter(a => a.type === 'critical');
  const warningAlerts = alerts.filter(a => a.type === 'warning');
  const infoAlerts = alerts.filter(a => a.type === 'info');

  const totalIssues = alerts.reduce((sum, alert) => sum + alert.count, 0);

  return (
    <div className="space-y-6">
      <Card className="border-destructive/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                System Alerts
              </CardTitle>
              <CardDescription>
                {totalIssues} issues requiring attention across {alerts.length} categories
              </CardDescription>
            </div>
            <Badge variant="destructive" className="text-lg px-3 py-1">
              {totalIssues}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Critical Alerts */}
          {criticalAlerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Critical Issues
              </h3>
              {criticalAlerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <Alert key={alert.id} className={getAlertStyles(alert.type)}>
                    <Icon className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{alert.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {alert.count} {alert.count === 1 ? 'item' : 'items'}
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = alert.actionUrl}
                        >
                          {alert.action}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          )}

          {/* Warning Alerts */}
          {warningAlerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-warning flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Warnings
              </h3>
              {warningAlerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <Alert key={alert.id} className={getAlertStyles(alert.type)}>
                    <Icon className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{alert.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {alert.count} {alert.count === 1 ? 'item' : 'items'}
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = alert.actionUrl}
                        >
                          {alert.action}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          )}

          {/* Info Alerts */}
          {infoAlerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Information
              </h3>
              {infoAlerts.map((alert) => {
                const Icon = alert.icon;
                return (
                  <Alert key={alert.id} className={getAlertStyles(alert.type)}>
                    <Icon className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{alert.title}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {alert.count} {alert.count === 1 ? 'item' : 'items'}
                            </Badge>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.location.href = alert.actionUrl}
                        >
                          {alert.action}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
