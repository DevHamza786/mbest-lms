import { useEffect, useState, useRef, useCallback } from 'react';
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Plus, 
  AlertCircle,
  Paperclip,
  Loader2,
  X,
  File,
  Check,
  CheckCheck,
  Download,
  Image as ImageIcon
} from 'lucide-react';
import { ChildSwitcher } from '@/components/parent/ChildSwitcher';
import { useToast } from '@/hooks/use-toast';
import { commonApi, Message } from '@/lib/api/common';
import { echo, updateEchoAuth, reconnectEcho } from '@/lib/echo';
import { apiClient } from '@/lib/api/client';

interface ThreadData {
  thread_id: string;
  last_message: {
    id: number;
    subject: string;
    body: string;
    is_read: boolean;
    created_at: string;
    sender: {
      id: number;
      name: string;
      email: string;
    };
  };
  unread_count: number;
  participant: {
    id: number;
    name: string;
    email: string;
    role?: string;
  };
}

interface Recipient {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface FilePreview {
  file: File;
  preview?: string;
  name: string;
  size: number;
}

interface OptimisticMessage extends Omit<Message, 'id' | 'created_at'> {
  id: string;
  created_at: string;
  is_optimistic?: boolean;
  sending?: boolean;
}

export default function ParentMessages() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadData[]>([]);
  const [threadMessages, setThreadMessages] = useState<Record<string, (Message | OptimisticMessage)[]>>({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newMessageRecipient, setNewMessageRecipient] = useState('');
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FilePreview[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [readMessages, setReadMessages] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Initialize chat
  useEffect(() => {
    initializeChat();
    return () => {
      // Cleanup: leave channel on unmount
      if (channelRef.current) {
        try {
          echo.leave(`chat.${channelRef.current}`);
        } catch (e) {
          console.error('Error leaving channel:', e);
        }
        channelRef.current = null;
      }
    };
  }, []);

  const initializeChat = async () => {
    try {
      await Promise.all([
        fetchCurrentUser(),
        fetchThreads(),
        fetchRecipients(),
      ]);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      toast({
        title: "Error",
        description: "Failed to initialize messaging. Please refresh the page.",
        variant: "destructive",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  // Set up WebSocket listener when thread is selected
  useEffect(() => {
    if (!selectedThread || !currentUserId) return;

    // Update Echo auth with current token
    updateEchoAuth();

      // Leave previous channel
      if (channelRef.current) {
        echo.leave(`private-chat.${channelRef.current}`);
        echo.leave(`chat.${channelRef.current}`);
      }

    // Subscribe to the thread's private channel
    const channel = echo.private(`chat.${selectedThread}`);

    // Listen for new messages
    channel.listen('.message.sent', (data: { message: Message }) => {
      const newMessage = data.message;
      
      // Don't add if it's from current user (already added optimistically)
      if (newMessage.sender_id === currentUserId) {
        // Replace optimistic message with real one
        setThreadMessages(prev => ({
          ...prev,
          [selectedThread]: (prev[selectedThread] || []).map(msg => {
            if ('is_optimistic' in msg && msg.is_optimistic) {
              return newMessage;
            }
            // Check if message already exists
            if ('id' in msg && msg.id === newMessage.id) {
              return newMessage;
            }
            return msg;
          }).filter((msg, index, self) => {
            // Remove duplicates
            if ('id' in msg) {
              return index === self.findIndex(m => 'id' in m && m.id === msg.id);
            }
            return true;
          }),
        }));
      } else {
        // Add new message from other user
        setThreadMessages(prev => {
          const existing = prev[selectedThread] || [];
          // Check if message already exists
          const exists = existing.some(msg => 'id' in msg && msg.id === newMessage.id);
          if (exists) return prev;
          
          return {
            ...prev,
            [selectedThread]: [...existing, newMessage],
          };
        });
      }

      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

      // Update threads list
      fetchThreads();
    });

    channelRef.current = selectedThread;

    // Cleanup on thread change
    return () => {
      echo.leave(`chat.${selectedThread}`);
      channelRef.current = null;
    };
  }, [selectedThread, currentUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedThread) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [threadMessages, selectedThread]);

  // Mark messages as read when thread is viewed
  useEffect(() => {
    if (selectedThread && currentUserId) {
      const timer = setTimeout(() => {
        markThreadAsRead(selectedThread);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedThread, currentUserId, threadMessages]);

  const fetchCurrentUser = async () => {
    try {
      const profile = await commonApi.profile.get();
      setCurrentUserId(profile.id);
      // Update Echo auth with new token
      updateEchoAuth();
    } catch (error) {
      console.error('Failed to fetch current user:', error);
    }
  };

  const fetchThreads = async () => {
    try {
      const data = await commonApi.messages.getThreads();
      setThreads(data);
      if (data.length > 0 && !selectedThread) {
        setSelectedThread(data[0].thread_id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load conversations",
        variant: "destructive",
      });
    }
  };

  const fetchThreadMessages = async (threadId: string) => {
    try {
      const messages = await commonApi.messages.list({ thread_id: threadId });
      setThreadMessages(prev => ({
        ...prev,
        [threadId]: messages,
      }));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive",
      });
    }
  };

  const markThreadAsRead = async (threadId: string) => {
    if (!currentUserId) return;
    
    try {
      const messages = threadMessages[threadId] || [];
      const unreadMessages = messages.filter(
        msg => !msg.is_read && 
               msg.recipient_id === currentUserId &&
               !readMessages.has(msg.id) &&
               !('is_optimistic' in msg)
      );
      
      if (unreadMessages.length === 0) return;

      // Mark all unread messages as read
      const markPromises = unreadMessages.map(msg => 
        commonApi.messages.markAsRead(msg.id).catch(err => {
          console.error('Failed to mark message as read:', err);
        })
      );

      await Promise.all(markPromises);
      
      // Update local state
      unreadMessages.forEach(msg => {
        setReadMessages(prev => new Set(prev).add(msg.id));
      });

      // Update message read status
      setThreadMessages(prev => ({
        ...prev,
        [threadId]: (prev[threadId] || []).map(msg => 
          unreadMessages.some(um => um.id === msg.id)
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        ),
      }));

      // Refresh threads to update unread counts
      await fetchThreads();
    } catch (error) {
      console.error('Failed to mark thread as read:', error);
    }
  };

  const fetchRecipients = async () => {
    try {
      // For parents, we can get recipients from their children's classes
      // This is a placeholder - adjust based on your API structure
      // You might need to create a specific endpoint for parent recipients
      const data = await commonApi.messages.getThreads();
      const recipientMap = new Map<number, Recipient>();
      
      data.forEach(thread => {
        if (thread.participant && !recipientMap.has(thread.participant.id)) {
          recipientMap.set(thread.participant.id, {
            id: thread.participant.id,
            name: thread.participant.name,
            email: thread.participant.email,
            role: thread.participant.role || 'tutor',
          });
        }
      });
      
      setRecipients(Array.from(recipientMap.values()));
    } catch (error: any) {
      console.error('Failed to fetch recipients:', error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    
    if (diffInHours < 1) {
      const minutes = Math.floor(diffInMs / (1000 * 60));
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleThreadClick = (threadId: string) => {
    setSelectedThread(threadId);
    fetchThreadMessages(threadId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles: FilePreview[] = files.map(file => {
      const preview: FilePreview = {
        file,
        name: file.name,
        size: file.size,
      };
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedFiles(prev => prev.map(f => 
            f.file === file ? { ...f, preview: reader.result as string } : f
          ));
        };
        reader.readAsDataURL(file);
      }
      
      return preview;
    });
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async () => {
    if (!newMessageRecipient || (!newMessageContent.trim() && attachedFiles.length === 0)) {
      toast({
        title: "Missing Information",
        description: "Please enter a message or attach a file.",
        variant: "destructive",
      });
      return;
    }

    const recipientId = parseInt(newMessageRecipient);
    const files = attachedFiles.map(f => f.file);
    const tempId = `temp-${Date.now()}`;
    const tempMessage: OptimisticMessage = {
      id: tempId,
      thread_id: `thread-${Date.now()}`,
      sender_id: currentUserId!,
      recipient_id: recipientId,
      subject: newMessageSubject || 'Chat',
      body: newMessageContent || '(File attachment)',
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_optimistic: true,
      sending: true,
      sender: {
        id: currentUserId!,
        name: 'You',
        email: '',
      },
      attachments: files.length > 0 ? files.map((f, i) => ({
        id: i,
        message_id: 0,
        file_path: URL.createObjectURL(f),
        file_name: f.name,
        file_size: f.size,
        mime_type: f.type,
      })) : undefined,
    };

    // Optimistically add message
    const newThreadId = tempMessage.thread_id;
    setThreadMessages(prev => ({
      ...prev,
      [newThreadId]: [tempMessage],
    }));

    // Reset form immediately
    setNewMessageRecipient('');
    setNewMessageSubject('');
    setNewMessageContent('');
    setAttachedFiles([]);
    setNewMessageOpen(false);

    try {
      const sentMessage = await commonApi.messages.create({
        recipient_id: recipientId,
        subject: newMessageSubject || 'Chat',
        body: newMessageContent || '(File attachment)',
        attachments: files.length > 0 ? files : undefined,
      });

      // Replace optimistic message with real one
      setThreadMessages(prev => ({
        ...prev,
        [sentMessage.thread_id]: prev[sentMessage.thread_id]
          ? prev[sentMessage.thread_id].map(m => 
              m.id === tempId ? { ...sentMessage, is_optimistic: false } : m
            )
          : [sentMessage],
      }));

      // Update threads
      await fetchThreads();
      
      // Select the new thread
      setSelectedThread(sentMessage.thread_id);
    } catch (error: any) {
      // Remove optimistic message on error
      setThreadMessages(prev => {
        const updated = { ...prev };
        if (updated[newThreadId]) {
          updated[newThreadId] = updated[newThreadId].filter(m => m.id !== tempId);
          if (updated[newThreadId].length === 0) {
            delete updated[newThreadId];
          }
        }
        return updated;
      });

      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleSendChatMessage = async () => {
    if (!selectedThread || (!messageContent.trim() && attachedFiles.length === 0)) {
      return;
    }

    const thread = threads.find(t => t.thread_id === selectedThread);
    if (!thread || !currentUserId) return;

    const files = attachedFiles.map(f => f.file);
    const tempId = `temp-${Date.now()}`;
    const tempMessage: OptimisticMessage = {
      id: tempId,
      thread_id: selectedThread,
      sender_id: currentUserId,
      recipient_id: thread.participant.id,
      subject: thread.last_message.subject,
      body: messageContent || '(File attachment)',
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_optimistic: true,
      sending: true,
      sender: {
        id: currentUserId,
        name: 'You',
        email: '',
      },
      attachments: files.length > 0 ? files.map((f, i) => ({
        id: i,
        message_id: 0,
        file_path: URL.createObjectURL(f),
        file_name: f.name,
        file_size: f.size,
        mime_type: f.type,
      })) : undefined,
    };

    // Optimistically add message - show immediately
    setThreadMessages(prev => ({
      ...prev,
      [selectedThread]: [...(prev[selectedThread] || []), tempMessage],
    }));

    // Clear input immediately
    const contentToSend = messageContent;
    const filesToSend = [...attachedFiles];
    setMessageContent('');
    setAttachedFiles([]);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const sentMessage = await commonApi.messages.create({
        recipient_id: thread.participant.id,
        subject: thread.last_message.subject,
        body: contentToSend || '(File attachment)',
        thread_id: selectedThread,
        attachments: filesToSend.length > 0 ? filesToSend.map(f => f.file) : undefined,
      });

      // Replace optimistic message with real one (WebSocket will also handle this)
      setThreadMessages(prev => ({
        ...prev,
        [selectedThread]: (prev[selectedThread] || []).map(m => 
          m.id === tempId ? { ...sentMessage, is_optimistic: false } : m
        ),
      }));

      // Update threads silently
      fetchThreads();
    } catch (error: any) {
      // Remove optimistic message on error
      setThreadMessages(prev => ({
        ...prev,
        [selectedThread]: (prev[selectedThread] || []).filter(m => m.id !== tempId),
      }));

      // Restore input
      setMessageContent(contentToSend);
      setAttachedFiles(filesToSend);

      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const downloadAttachment = async (attachment: any) => {
    try {
      const baseURL = apiClient.getBaseURL();
      const token = apiClient.getToken();
      
      // Handle blob URLs (optimistic attachments)
      if (attachment.file_path.startsWith('blob:')) {
        const response = await fetch(attachment.file_path);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.file_name || attachment.name || 'attachment';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }
      
      const fileUrl = `${baseURL.replace('/api/v1', '')}/storage/${attachment.file_path}`;
      const response = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name || attachment.name || 'attachment';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const filteredThreads = threads.filter(thread => {
    const searchLower = searchTerm.toLowerCase();
    return (
      thread.participant.name.toLowerCase().includes(searchLower) ||
      thread.last_message.body.toLowerCase().includes(searchLower)
    );
  });

  const selectedThreadData = threads.find(t => t.thread_id === selectedThread);
  const currentMessages = selectedThread ? (threadMessages[selectedThread] || []) : [];

  if (initialLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex h-full border rounded-lg overflow-hidden bg-background">
        {/* Sidebar - Conversations List */}
        <div className="w-80 border-r flex flex-col bg-muted/30">
      {/* Header */}
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Messages</h2>
              <div className="flex items-center gap-2">
          <ChildSwitcher />
          <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
            <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                      <DialogTitle>New Message</DialogTitle>
                <DialogDescription>
                        Send a message to tutors or administrators
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
                            {recipients.length > 0 ? (
                              recipients.map(recipient => (
                                <SelectItem key={recipient.id} value={recipient.id.toString()}>
                                  {recipient.name} ({recipient.role})
                        </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="none" disabled>No recipients available</SelectItem>
                            )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                          placeholder="Enter subject (optional)"
                    value={newMessageSubject}
                    onChange={(e) => setNewMessageSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                          placeholder="Type your message..."
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                          rows={4}
                  />
                </div>
                      {attachedFiles.length > 0 && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Attachments</label>
                          <div className="space-y-2">
                            {attachedFiles.map((file, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                                {file.preview ? (
                                  <img src={file.preview} alt={file.name} className="w-12 h-12 object-cover rounded" />
                                ) : (
                                  <File className="h-8 w-8" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{file.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1"
                        >
                          <Paperclip className="mr-2 h-4 w-4" />
                          Attach File
                        </Button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                      />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewMessageOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="mr-2 h-4 w-4" />
                        Send
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
              </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredThreads.length > 0 ? (
              <div>
                {filteredThreads.map(thread => {
                  const isSelected = selectedThread === thread.thread_id;
                  const participantName = thread.participant.name;
                  const initials = participantName.split(' ').map(n => n[0]).join('').toUpperCase();
                  
                  return (
                    <div
                      key={thread.thread_id}
                      className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-2 ${
                        isSelected ? 'border-l-primary bg-muted' : 'border-l-transparent'
                      }`}
                      onClick={() => handleThreadClick(thread.thread_id)}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="text-sm font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className={`text-sm font-medium truncate ${thread.unread_count > 0 ? 'font-semibold' : ''}`}>
                              {participantName}
                            </p>
                            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                              {formatTime(thread.last_message.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={`text-sm truncate ${thread.unread_count > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                              {thread.last_message.body}
                            </p>
                            {thread.unread_count > 0 && (
                              <Badge variant="destructive" className="ml-2 text-xs px-1.5 py-0 min-w-[20px] text-center">
                                {thread.unread_count}
                                </Badge>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 px-4">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Conversations</h3>
                <p className="text-muted-foreground text-sm">
                  {searchTerm ? 'No conversations match your search.' : 'Start a new conversation to get started.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
          {selectedThread && selectedThreadData ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-background">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {selectedThreadData.participant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold">{selectedThreadData.participant.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {selectedThreadData.participant.role || 'Tutor'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-muted/20">
                {currentMessages.length > 0 ? (
                  <div className="space-y-4">
                    {currentMessages
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((message) => {
                        const sender = message.sender || { name: 'Unknown', id: 0 };
                        const initials = sender.name.split(' ').map(n => n[0]).join('').toUpperCase();
                        const isFromMe = currentUserId !== null && message.sender_id === currentUserId;
                        const hasAttachments = message.attachments && message.attachments.length > 0;
                        const isOptimistic = 'is_optimistic' in message && message.is_optimistic;
                        const isSending = 'sending' in message && message.sending;
                        
                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}
                          >
                            {!isFromMe && (
                              <Avatar className="h-8 w-8 mt-1">
                            <AvatarFallback className="text-xs">
                                  {initials}
                            </AvatarFallback>
                          </Avatar>
                            )}
                            <div className={`flex flex-col max-w-[70%] ${isFromMe ? 'items-end' : 'items-start'}`}>
                              {!isFromMe && (
                                <span className="text-xs text-muted-foreground mb-1 px-2">
                                  {sender.name}
                          </span>
                              )}
                              <div
                                className={`rounded-2xl px-4 py-2 ${
                                  isFromMe
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-background border'
                                } ${isOptimistic ? 'opacity-70' : ''}`}
                              >
                                {isSending && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    <span className="text-xs opacity-70">Sending...</span>
                                  </div>
                                )}
                                {hasAttachments && (
                                  <div className="space-y-2 mb-2">
                                    {message.attachments?.map((attachment: any) => (
                                      <div key={attachment.id} className="relative group">
                                        {attachment.mime_type?.startsWith('image/') ? (
                                          <img
                                            src={attachment.file_path.startsWith('blob:') 
                                              ? attachment.file_path 
                                              : `${apiClient.getBaseURL().replace('/api/v1', '')}/storage/${attachment.file_path}`}
                                            alt={attachment.file_name || attachment.name || 'Image'}
                                            className="max-w-xs rounded-lg cursor-pointer"
                                            onClick={() => {
                                              if (!attachment.file_path.startsWith('blob:')) {
                                                window.open(`${apiClient.getBaseURL().replace('/api/v1', '')}/storage/${attachment.file_path}`, '_blank');
                                              }
                                            }}
                                          />
                                        ) : (
                                          <div
                                            className="flex items-center gap-2 p-3 bg-muted rounded-lg cursor-pointer hover:bg-muted/80"
                                            onClick={() => downloadAttachment(attachment)}
                                          >
                                            <File className="h-5 w-5" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-sm font-medium truncate">
                                                {attachment.file_name || attachment.name || 'Attachment'}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(1)} KB` : ''}
                                              </p>
                                            </div>
                                            <Download className="h-4 w-4" />
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                                {message.body && message.body !== '(File attachment)' && (
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.body}
                                  </p>
                          )}
                        </div>
                              <div className={`flex items-center gap-1 mt-1 px-2 ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                <span className="text-xs text-muted-foreground">
                                  {formatMessageTime(message.created_at)}
                                </span>
                                {isFromMe && !isOptimistic && (
                                  <span className="text-xs">
                                    {message.is_read ? (
                                      <CheckCheck className="h-3 w-3 text-blue-500" title="Read" />
                                    ) : (
                                      <Check className="h-3 w-3 text-muted-foreground" title="Sent" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                              </div>
                            </div>
                          )}
                        </div>

              {/* Message Input Area */}
              <div className="p-4 border-t bg-background">
                {attachedFiles.length > 0 && (
                  <div className="mb-3 flex gap-2 flex-wrap">
                    {attachedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        {file.preview ? (
                          <div className="relative">
                            <img src={file.preview} alt={file.name} className="w-20 h-20 object-cover rounded-lg" />
                            <Button
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <div className="relative flex items-center gap-2 p-2 bg-muted rounded-lg">
                            <File className="h-5 w-5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate">{file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => removeFile(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                )}
                <div className="flex items-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Textarea
                    placeholder="Type a message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendChatMessage();
                      }
                    }}
                    rows={1}
                    className="min-h-[44px] max-h-32 resize-none"
                  />
                  <Button
                    onClick={handleSendChatMessage}
                    disabled={!messageContent.trim() && attachedFiles.length === 0}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a Conversation</h3>
                <p className="text-muted-foreground">
                  Choose a conversation from the list to start chatting
              </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
