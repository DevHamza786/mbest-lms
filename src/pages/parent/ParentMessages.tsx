import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Plus, 
  AlertCircle,
  Clock,
  User,
  Paperclip
} from 'lucide-react';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useParentContext, useParentStore } from '@/lib/store/parentStore';
import { parentService } from '@/lib/mocks/parent';
import { useToast } from '@/hooks/use-toast';
import type { ParentMessage } from '@/lib/store/parentStore';

export default function ParentMessages() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newMessageRecipient, setNewMessageRecipient] = useState('');
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const { toast } = useToast();
  
  const {
    activeChild,
    messages,
    isLoading,
  } = useParentContext();

  const {
    setMessages,
    setLoading,
    markMessageAsRead,
  } = useParentStore();

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const messagesData = await parentService.getMessages();
        setMessages(messagesData);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, [setMessages, setLoading]);

  // Group messages by thread
  const messageThreads = messages?.reduce((threads, message) => {
    const threadId = message.threadId;
    if (!threads[threadId]) {
      threads[threadId] = [];
    }
    threads[threadId].push(message);
    return threads;
  }, {} as Record<string, ParentMessage[]>) || {};

  // Get thread preview (latest message)
  const getThreadPreview = (threadId: string) => {
    const threadMessages = messageThreads[threadId] || [];
    return threadMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  // Filter threads based on search
  const filteredThreadIds = Object.keys(messageThreads).filter(threadId => {
    const preview = getThreadPreview(threadId);
    return preview.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
           preview.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
           preview.content.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const handleThreadClick = (threadId: string) => {
    setSelectedThread(threadId);
    // Mark messages in thread as read
    const threadMessages = messageThreads[threadId] || [];
    threadMessages.forEach(message => {
      if (!message.isRead) {
        markMessageAsRead(message.id);
      }
    });
  };

  const handleSendMessage = () => {
    if (!newMessageRecipient || !newMessageSubject || !newMessageContent) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Message Sent",
      description: `Your message has been sent to ${newMessageRecipient}.`,
    });

    // Reset form
    setNewMessageRecipient('');
    setNewMessageSubject('');
    setNewMessageContent('');
    setNewMessageOpen(false);
  };

  const getUnreadCount = (threadId: string) => {
    const threadMessages = messageThreads[threadId] || [];
    return threadMessages.filter(msg => !msg.isRead).length;
  };

  // Mock tutors/admin for recipient selection
  const availableRecipients = [
    'Mr. Smith (Mathematics)',
    'Dr. Johnson (Physics)',
    'Ms. Davis (English)',
    'Dr. Wilson (Chemistry)',
    'Mr. Brown (History)',
    'Ms. Garcia (Computer Science)',
    'Admin Office',
    'Academic Coordinator'
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground">
            Communicate with tutors and administrators
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ChildSwitcher />
          <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Message
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Compose New Message</DialogTitle>
                <DialogDescription>
                  Send a message to your child's tutors or administrators
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">To</label>
                  <Select value={newMessageRecipient} onValueChange={setNewMessageRecipient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recipient" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRecipients.map(recipient => (
                        <SelectItem key={recipient} value={recipient}>
                          {recipient}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    placeholder="Enter subject"
                    value={newMessageSubject}
                    onChange={(e) => setNewMessageSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    placeholder="Type your message here..."
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewMessageOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversations
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : filteredThreadIds.length > 0 ? (
              <div className="space-y-1">
                {filteredThreadIds.map(threadId => {
                  const preview = getThreadPreview(threadId);
                  const unreadCount = getUnreadCount(threadId);
                  const isSelected = selectedThread === threadId;
                  
                  return (
                    <div
                      key={threadId}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-2 ${
                        isSelected ? 'border-l-primary bg-muted/50' : 'border-l-transparent'
                      }`}
                      onClick={() => handleThreadClick(threadId)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {preview.from.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className={`text-sm font-medium truncate ${!preview.isRead ? 'font-semibold' : ''}`}>
                              {preview.from}
                            </p>
                            <div className="flex items-center gap-1">
                              {unreadCount > 0 && (
                                <Badge variant="destructive" className="text-xs px-1.5 py-0">
                                  {unreadCount}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {formatTime(preview.timestamp)}
                              </span>
                            </div>
                          </div>
                          <p className={`text-sm truncate ${!preview.isRead ? 'font-medium' : 'text-muted-foreground'}`}>
                            {preview.subject}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-1">
                            {preview.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Messages</h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm ? 'No messages match your search.' : 'No messages yet.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className="lg:col-span-2">
          {selectedThread ? (
            <>
              <CardHeader>
                <CardTitle>{getThreadPreview(selectedThread).subject}</CardTitle>
                <CardDescription>
                  Conversation with {getThreadPreview(selectedThread).from}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-96 overflow-y-auto space-y-4">
                  {messageThreads[selectedThread]
                    ?.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .map((message) => (
                      <div key={message.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {message.from.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{message.from}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(message.timestamp).toLocaleString()}
                          </span>
                          {!message.isRead && (
                            <Badge variant="secondary" className="text-xs">New</Badge>
                          )}
                        </div>
                        <div className="ml-8 p-3 bg-muted rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Paperclip className="h-3 w-3" />
                                {message.attachments.length} attachment{message.attachments.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                
                <Separator />
                
                {/* Reply Section */}
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your reply..."
                    rows={3}
                  />
                  <div className="flex justify-between items-center">
                    <Button variant="outline" size="sm">
                      <Paperclip className="mr-2 h-4 w-4" />
                      Attach File
                    </Button>
                    <Button size="sm">
                      <Send className="mr-2 h-4 w-4" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-96">
              <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a Conversation</h3>
              <p className="text-muted-foreground text-center">
                Choose a conversation from the list to view messages
              </p>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Restrictions Notice */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Communication Guidelines
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                You can only message your child's tutors and school administrators. 
                All messages are monitored for safety and educational purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
