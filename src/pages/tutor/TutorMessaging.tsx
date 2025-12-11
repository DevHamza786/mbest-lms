import { useState } from 'react';
import { Send, Search, Plus, MoreHorizontal, Reply, Archive, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  important: boolean;
}

export default function TutorMessaging() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const [newMessage, setNewMessage] = useState({
    recipient: '',
    subject: '',
    body: '',
    important: false,
  });

  // Mock messages data
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      threadId: 'thread-1',
      senderId: 'student-1',
      senderName: 'Emma Thompson',
      senderRole: 'student',
      recipientId: 'tutor-1',
      recipientName: 'Dr. Michael Rodriguez',
      subject: 'Question about React Hooks Assignment',
      body: 'Hi Dr. Rodriguez, I\'m having trouble understanding the useEffect hook in the current assignment. Could you provide some guidance on how to properly clean up side effects?',
      timestamp: '2024-01-20T10:30:00Z',
      read: false,
      important: false
    },
    {
      id: '2',
      threadId: 'thread-2',
      senderId: 'student-2',
      senderName: 'James Rodriguez',
      senderRole: 'student',
      recipientId: 'tutor-1',
      recipientName: 'Dr. Michael Rodriguez',
      subject: 'Grade Inquiry - Data Structures Exam',
      body: 'Hello Professor, I wanted to discuss my recent exam grade. I believe there might have been an error in the grading of question 3. Could we schedule a meeting to review it?',
      timestamp: '2024-01-19T15:45:00Z',
      read: true,
      important: true
    },
    {
      id: '3',
      threadId: 'thread-3',
      senderId: 'parent-1',
      senderName: 'Robert Thompson',
      senderRole: 'parent',
      recipientId: 'tutor-1',
      recipientName: 'Dr. Michael Rodriguez',
      subject: 'Emma\'s Progress Update Request',
      body: 'Dear Dr. Rodriguez, I hope this message finds you well. I wanted to check in on Emma\'s progress in your Advanced Web Development course. Are there any areas where she might need additional support?',
      timestamp: '2024-01-18T09:20:00Z',
      read: true,
      important: false
    }
  ]);

  // Group messages by thread
  const threads = messages.reduce((acc, message) => {
    if (!acc[message.threadId]) {
      acc[message.threadId] = [];
    }
    acc[message.threadId].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  const threadList = Object.entries(threads).map(([threadId, threadMessages]) => {
    const latestMessage = threadMessages.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
    const unreadCount = threadMessages.filter(m => !m.read).length;
    
    return {
      threadId,
      latestMessage,
      messageCount: threadMessages.length,
      unreadCount
    };
  }).sort((a, b) => 
    new Date(b.latestMessage.timestamp).getTime() - new Date(a.latestMessage.timestamp).getTime()
  );

  const selectedThreadMessages = selectedThread ? threads[selectedThread] : [];

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedThread) return;

    const originalMessage = selectedThreadMessages[0];
    const newReply: Message = {
      id: Date.now().toString(),
      threadId: selectedThread,
      senderId: 'tutor-1',
      senderName: 'Dr. Michael Rodriguez',
      senderRole: 'tutor',
      recipientId: originalMessage.senderId,
      recipientName: originalMessage.senderName,
      subject: `Re: ${originalMessage.subject}`,
      body: replyText,
      timestamp: new Date().toISOString(),
      read: true,
      important: false
    };

    setMessages(prev => [...prev, newReply]);
    setReplyText('');

    toast({
      title: "Message Sent",
      description: "Your reply has been sent successfully.",
    });
  };

  const handleComposeMessage = () => {
    if (!newMessage.recipient || !newMessage.subject || !newMessage.body) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      threadId: `thread-${Date.now()}`,
      senderId: 'tutor-1',
      senderName: 'Dr. Michael Rodriguez',
      senderRole: 'tutor',
      recipientId: 'student-1', // This would be determined by the recipient selection
      recipientName: newMessage.recipient,
      subject: newMessage.subject,
      body: newMessage.body,
      timestamp: new Date().toISOString(),
      read: true,
      important: newMessage.important
    };

    setMessages(prev => [...prev, message]);
    setNewMessage({
      recipient: '',
      subject: '',
      body: '',
      important: false,
    });
    setIsComposeOpen(false);

    toast({
      title: "Message Sent",
      description: "Your message has been sent successfully.",
    });
  };

  const handleMarkAsRead = (threadId: string) => {
    setMessages(prev => prev.map(message => 
      message.threadId === threadId ? { ...message, read: true } : message
    ));
  };

  const filteredThreads = threadList.filter(thread =>
    thread.latestMessage.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.latestMessage.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    thread.latestMessage.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays <= 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="flex-1 flex h-[calc(100vh-8rem)]">
      {/* Sidebar - Message List */}
      <div className="w-1/3 border-r bg-muted/20">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="font-semibold">Messages</h2>
            <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Compose
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>Compose Message</DialogTitle>
                  <DialogDescription>
                    Send a message to a student or parent
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient</Label>
                    <Select value={newMessage.recipient} onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipient: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Emma Thompson">Emma Thompson (Student)</SelectItem>
                        <SelectItem value="James Rodriguez">James Rodriguez (Student)</SelectItem>
                        <SelectItem value="Robert Thompson">Robert Thompson (Parent)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={newMessage.subject}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                      placeholder="Message subject"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body">Message</Label>
                    <Textarea
                      id="body"
                      value={newMessage.body}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, body: e.target.value }))}
                      placeholder="Type your message here..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="important"
                      checked={newMessage.important}
                      onChange={(e) => setNewMessage(prev => ({ ...prev, important: e.target.checked }))}
                    />
                    <Label htmlFor="important" className="text-sm">Mark as important</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleComposeMessage}>Send Message</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="overflow-auto h-full">
          {filteredThreads.map((thread) => (
            <div
              key={thread.threadId}
              className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                selectedThread === thread.threadId ? 'bg-muted' : ''
              }`}
              onClick={() => {
                setSelectedThread(thread.threadId);
                handleMarkAsRead(thread.threadId);
              }}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src="" alt={thread.latestMessage.senderName} />
                  <AvatarFallback>
                    {thread.latestMessage.senderName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${!thread.latestMessage.read ? 'font-semibold' : ''}`}>
                      {thread.latestMessage.senderName}
                    </p>
                    <div className="flex items-center gap-1">
                      {thread.latestMessage.important && (
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(thread.latestMessage.timestamp)}
                      </span>
                    </div>
                  </div>
                  <p className={`text-sm truncate ${!thread.latestMessage.read ? 'font-medium' : 'text-muted-foreground'}`}>
                    {thread.latestMessage.subject}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-1">
                    {thread.latestMessage.body}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {thread.latestMessage.senderRole}
                    </Badge>
                    {thread.unreadCount > 0 && (
                      <Badge variant="default" className="text-xs">
                        {thread.unreadCount} new
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content - Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedThread ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{selectedThreadMessages[0]?.subject}</h3>
                  <p className="text-sm text-muted-foreground">
                    with {selectedThreadMessages[0]?.senderName}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Star className="mr-2 h-4 w-4" />
                      Mark Important
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="mr-2 h-4 w-4" />
                      Archive Thread
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {selectedThreadMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.senderId === 'tutor-1' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.senderId !== 'tutor-1' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={message.senderName} />
                      <AvatarFallback className="text-xs">
                        {message.senderName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`max-w-[70%] ${message.senderId === 'tutor-1' ? 'order-first' : ''}`}>
                    <div className={`rounded-lg p-3 ${
                      message.senderId === 'tutor-1' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.body}</p>
                    </div>
                    <p className={`text-xs text-muted-foreground mt-1 ${
                      message.senderId === 'tutor-1' ? 'text-right' : ''
                    }`}>
                      {message.senderName} • {formatTimestamp(message.timestamp)}
                    </p>
                  </div>

                  {message.senderId === 'tutor-1' && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" alt={message.senderName} />
                      <AvatarFallback className="text-xs">DR</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 min-h-[80px]"
                />
                <Button onClick={handleSendReply} disabled={!replyText.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
              <p className="text-muted-foreground">
                Choose a message thread to start reading and replying
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}