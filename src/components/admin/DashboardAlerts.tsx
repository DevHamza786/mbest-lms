import { useEffect, useState } from "react";
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
  ChevronRight,
  Loader2
} from "lucide-react";
import { adminApi } from "@/lib/api";

interface AlertItem {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'session' | 'compliance' | 'billing' | 'attendance' | 'profile';
  title: string;
  description: string;
  count: number;
  action: string;
  action_url: string;
  icon?: typeof AlertTriangle;
}

const iconMap: Record<string, typeof AlertTriangle> = {
  'session': Calendar,
  'billing': DollarSign,
  'attendance': Clock,
  'profile': UserX,
  'compliance': ShieldAlert,
  'default': FileText,
};

export default function DashboardAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setIsLoading(true);
        const data = await adminApi.getDashboard();
        const systemAlerts = data?.system_alerts || [];
        
        // Map alerts and add icons
        const mappedAlerts = systemAlerts.map((alert: any) => ({
          ...alert,
          icon: iconMap[alert.category] || iconMap['default'],
        }));
        
        setAlerts(mappedAlerts);
      } catch (error) {
        console.error('Failed to load alerts:', error);
        setAlerts([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadAlerts();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card className="border-destructive/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-destructive" />
                  System Alerts
                </CardTitle>
                <CardDescription>Loading alerts...</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (alerts.length === 0) {
    return null; // Don't show the alerts card if there are no alerts
  }

  const getAlertVariant = (type: AlertItem['type']) => {
    switch (type) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'info':
        return 'default';
      default:
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
                          onClick={() => window.location.href = alert.action_url}
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
                          onClick={() => window.location.href = alert.action_url}
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
                          onClick={() => window.location.href = alert.action_url}
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
