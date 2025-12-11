import { useState } from 'react';
import { Search, Bell, Send, Users, MessageSquare, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

export default function AdminNotifications() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [newNotification, setNewNotification] = useState({
    title: '',
    message: '',
    recipients: 'all',
    type: 'info',
    urgent: false
  });

  const notifications = [
    {
      id: '1',
      title: 'System Maintenance Scheduled',
      message: 'The platform will undergo maintenance tonight from 2:00 AM to 4:00 AM EST.',
      type: 'warning',
      recipients: 'all',
      sent: '2024-02-20T10:00:00Z',
      status: 'sent',
      readCount: 145,
      totalRecipients: 290
    },
    {
      id: '2',
      title: 'New Course Available',
      message: 'Introduction to Machine Learning is now available for enrollment.',
      type: 'info',
      recipients: 'students',
      sent: '2024-02-19T14:30:00Z',
      status: 'sent',
      readCount: 87,
      totalRecipients: 245
    },
    {
      id: '3',
      title: 'Payment Reminder',
      message: 'Your monthly subscription payment is due in 3 days.',
      type: 'warning',
      recipients: 'parents',
      sent: '2024-02-18T09:15:00Z',
      status: 'sent',
      readCount: 34,
      totalRecipients: 45
    },
    {
      id: '4',
      title: 'Grade Reports Ready',
      message: 'Monthly grade reports are now available in your dashboard.',
      type: 'success',
      recipients: 'students_parents',
      sent: '2024-02-17T16:45:00Z',
      status: 'sent',
      readCount: 178,
      totalRecipients: 290
    }
  ];

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'error': return 'destructive';
      default: return 'outline';
    }
  };

  const handleSendNotification = () => {
    toast({
      title: "Notification Sent",
      description: `Your notification "${newNotification.title}" has been sent successfully.`,
    });
    
    setNewNotification({
      title: '',
      message: '',
      recipients: 'all',
      type: 'info',
      urgent: false
    });
  };

  const stats = [
    {
      label: 'Total Sent',
      value: '1,247',
      icon: Send,
      color: 'text-blue-600'
    },
    {
      label: 'Read Rate',
      value: '78%',
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      label: 'Active Recipients',
      value: '290',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      label: 'Pending',
      value: '3',
      icon: Clock,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notification Center</h1>
          <p className="text-muted-foreground">
            Send announcements and manage communications across the platform
          </p>
        </div>
        <Bell className="h-8 w-8 text-muted-foreground" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Send New Notification</CardTitle>
              <CardDescription>
                Create and send notifications to users across the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Notification Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter notification title..."
                      value={newNotification.title}
                      onChange={(e) => setNewNotification(prev => ({
                        ...prev,
                        title: e.target.value
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recipients">Recipients</Label>
                    <Select 
                      value={newNotification.recipients} 
                      onValueChange={(value) => setNewNotification(prev => ({
                        ...prev,
                        recipients: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="students">Students Only</SelectItem>
                        <SelectItem value="tutors">Tutors Only</SelectItem>
                        <SelectItem value="parents">Parents Only</SelectItem>
                        <SelectItem value="students_parents">Students & Parents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">Notification Type</Label>
                    <Select 
                      value={newNotification.type} 
                      onValueChange={(value) => setNewNotification(prev => ({
                        ...prev,
                        type: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Information</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="warning">Warning</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="urgent"
                      checked={newNotification.urgent}
                      onCheckedChange={(checked) => setNewNotification(prev => ({
                        ...prev,
                        urgent: checked as boolean
                      }))}
                    />
                    <Label htmlFor="urgent">Mark as urgent</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Enter your notification message..."
                      className="min-h-[150px]"
                      value={newNotification.message}
                      onChange={(e) => setNewNotification(prev => ({
                        ...prev,
                        message: e.target.value
                      }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-start gap-3">
                        {getTypeIcon(newNotification.type)}
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {newNotification.title || 'Notification Title'}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {newNotification.message || 'Your notification message will appear here...'}
                          </p>
                          {newNotification.urgent && (
                            <Badge variant="destructive" className="mt-2">Urgent</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Save as Draft</Button>
                <Button 
                  onClick={handleSendNotification}
                  disabled={!newNotification.title || !newNotification.message}
                >
                  <Send className="mr-2 h-4 w-4" />
                  Send Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {getTypeIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{notification.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        <Badge variant={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <span>
                          Sent: {new Date(notification.sent).toLocaleString()}
                        </span>
                        <span>
                          Recipients: {notification.recipients}
                        </span>
                        <span>
                          Read: {notification.readCount}/{notification.totalRecipients} 
                          ({Math.round((notification.readCount / notification.totalRecipients) * 100)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure notification preferences and delivery settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Checkbox defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send urgent notifications via SMS
                    </p>
                  </div>
                  <Checkbox />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send browser push notifications
                    </p>
                  </div>
                  <Checkbox defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Auto-Archive</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically archive read notifications after 30 days
                    </p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
              </div>

              <Button>Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}