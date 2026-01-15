import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { commonApi, Message } from '@/lib/api/common';
import { studentApi } from '@/lib/api/student';
import { apiClient } from '@/lib/api/client';
import { echo, updateEchoAuth } from '@/lib/echo';

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
  class_name?: string;
}

interface FilePreview {
  file: File;
  preview?: string;
  name: string;
  size: number;
}

interface OptimisticMessage extends Omit<Message, 'id' | 'created_at'> {
  id: string; // Temporary ID
  created_at: string;
  is_optimistic?: boolean;
  sending?: boolean;
}

const StudentMessaging = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [threads, setThreads] = useState<ThreadData[]>([]);
  const [threadMessages, setThreadMessages] = useState<Record<string, (Message | OptimisticMessage)[]>>({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [newMessageRecipient, setNewMessageRecipient] = useState('');
  const [newMessageContent, setNewMessageContent] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FilePreview[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [readMessages, setReadMessages] = useState<Set<number>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const channelRef = useRef<any>(null);
  const { toast } = useToast();
  
  // Fetch current user and threads on mount
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
    } finally {
      setInitialLoading(false);
    }
  };

  // Set up WebSocket listener when thread is selected
  useEffect(() => {
    if (!selectedThread || !currentUserId) return;

    // Check if token is available
    const token = localStorage.getItem('lms.session');
    if (!token) {
      console.warn('⚠️ No auth token found. Cannot subscribe to WebSocket channel.');
      return;
    }

    // Update Echo auth with current token
    updateEchoAuth();

    // Leave previous channel
    if (channelRef.current) {
      try {
        echo.leave(`chat.${channelRef.current}`);
      } catch (e) {
        console.error('Error leaving previous channel:', e);
      }
    }

    // Wait for connection to be ready before subscribing
    let isMounted = true;
    
    const subscribeToChannel = async () => {
      // Wait a bit for connection if needed
      if (echo.connector && 'pusher' in echo.connector) {
        const pusher = (echo.connector as any).pusher;
        const state = pusher.connection?.state;
        
        console.log(`🔌 [Student] Current WebSocket connection state: ${state}`);
        console.log(`🔌 [Student] Pusher connection object:`, {
          state: pusher.connection?.state,
          socket_id: pusher.connection?.socket_id,
          host: pusher.config?.wsHost,
          port: pusher.config?.wsPort,
        });
        
        if (state !== 'connected') {
          // Wait for connection
          await new Promise<void>((resolve) => {
            if (state === 'connected') {
              resolve();
              return;
            }
            
            const checkConnection = () => {
              if (!isMounted) {
                resolve();
                return;
              }
              
              const currentState = pusher.connection?.state;
              if (currentState === 'connected') {
                resolve();
              } else if (currentState === 'failed' || currentState === 'disconnected') {
                console.warn('⚠️ Connection not ready, will retry subscription');
                setTimeout(() => resolve(), 1000);
              } else {
                setTimeout(checkConnection, 200);
              }
            };
            
            if (state === 'connecting' || state === 'unavailable') {
              checkConnection();
            } else {
              pusher.connect();
              setTimeout(() => resolve(), 1000);
            }
          });
        }
      }

      if (!isMounted) return;

      // Subscribe to the thread's private channel
      try {
        const channel = echo.private(`chat.${selectedThread}`);
        
        // Log subscription events
        channel.subscribed(() => {
          console.log(`✅ Successfully subscribed to channel: chat.${selectedThread}`);
        });
        
        channel.error((error: any) => {
          console.error(`❌ Channel subscription error for chat.${selectedThread}:`, error);
        });

        // Listen for new messages
        // Laravel Echo uses dot prefix when broadcastAs() is used
        console.log(`👂 [Student] Listening for messages on channel: chat.${selectedThread}`);
        console.log(`👂 [Student] Channel object:`, channel);
        console.log(`👂 [Student] Channel.listen method exists:`, typeof channel.listen === 'function');
        
        const listener = channel.listen('.message.sent', (data: { message: Message }) => {
          if (!isMounted) return;
          
          console.log('🔔🔔🔔 [Student] WebSocket event received (.message.sent) 🔔🔔🔔');
          console.log('🔔 [Student] Event data:', data);
          console.log('🔔 Full event data:', JSON.stringify(data, null, 2));
          const newMessage = data.message;
          
          if (!newMessage || !newMessage.id) {
            console.error('❌ Invalid message received:', newMessage);
            return;
          }
          
          // Handle ID type conversion
          const newMessageSenderId = typeof newMessage.sender_id === 'string' 
            ? parseInt(newMessage.sender_id) 
            : newMessage.sender_id;
          
          console.log(`📬 Message from sender ${newMessageSenderId}, current user: ${currentUserId}`);
          console.log(`📬 Message thread_id: ${newMessage.thread_id}, selected thread: ${selectedThread}`);
          
          // Don't add if it's from current user (already added optimistically)
          if (newMessageSenderId === currentUserId) {
            console.log('✅ Message from current user, replacing optimistic message');
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
                // Remove duplicates - handle both string and number IDs
                if (msg && 'id' in msg) {
                  const msgId = typeof msg.id === 'string' ? parseInt(msg.id) : msg.id;
                  return index === self.findIndex(m => {
                    if (!m || !('id' in m)) return false;
                    const mId = typeof m.id === 'string' ? parseInt(m.id) : m.id;
                    return mId === msgId;
                  });
                }
                return true;
              }).filter(msg => msg && msg.id), // Final safety filter
            }));
          } else {
            // Add new message from other user
            const messageThreadId = newMessage.thread_id;
            console.log(`📨 Received new message via WebSocket for thread: ${messageThreadId}, current thread: ${selectedThread}`);
            
            if (!messageThreadId) {
              console.error('❌ Message missing thread_id:', newMessage);
              return;
            }
            
            console.log(`📨 Processing message for thread: ${messageThreadId}`);
            setThreadMessages(prev => {
              const existing = (prev[messageThreadId] || []).filter(msg => msg && msg.id); // Filter undefined
              console.log(`📨 Existing messages in thread ${messageThreadId}:`, existing.length);
              
              // Check if message already exists (handle both string and number IDs)
              const exists = existing.some(msg => {
                const msgId = typeof msg.id === 'string' ? parseInt(msg.id) : msg.id;
                const newMsgId = typeof newMessage.id === 'string' ? parseInt(newMessage.id) : newMessage.id;
                return msgId === newMsgId;
              });
              
              if (exists) {
                console.log('⚠️ Message already exists, skipping:', newMessage.id);
                return prev;
              }
              
              console.log(`📨 Adding new message to thread: ${messageThreadId}, message ID: ${newMessage.id}`);
              const updated = {
                ...prev,
                [messageThreadId]: [...existing, newMessage],
              };
              console.log(`📨 Updated thread messages count: ${updated[messageThreadId].length}`);
              return updated;
            });
            
            // Update conversation list locally when receiving a message
            // This avoids unnecessary API calls and prevents reload loops
            console.log('🔄 Updating conversation list locally after receiving message');
            setThreads(prevThreads => {
              if (!messageThreadId) return prevThreads;
              
              const threadIndex = prevThreads.findIndex(t => t.thread_id === messageThreadId);
              if (threadIndex >= 0) {
                // Update existing thread - use functional update to get latest state
                const updatedThreads = [...prevThreads];
                const thread = updatedThreads[threadIndex];
                
                // Update last message and unread count
                const isFromCurrentUser = newMessageSenderId === currentUserId;
                const isChatOpen = thread.thread_id === selectedThread;
                
                // Only increment unread count if message is from another user AND chat is not open
                const newUnreadCount = isFromCurrentUser 
                  ? thread.unread_count 
                  : (isChatOpen ? thread.unread_count : Math.max(0, thread.unread_count + 1));
                
                updatedThreads[threadIndex] = {
                  ...thread,
                  last_message: {
                    ...thread.last_message,
                    id: newMessage.id,
                    body: newMessage.body,
                    created_at: newMessage.created_at,
                    is_read: isFromCurrentUser ? true : (isChatOpen ? true : false),
                    sender: newMessage.sender || thread.last_message.sender,
                  },
                  unread_count: newUnreadCount,
                };
                
                // Move updated thread to top
                const [movedThread] = updatedThreads.splice(threadIndex, 1);
                return [movedThread, ...updatedThreads];
              } else {
                // New thread - need to fetch from server (silently, no loading state)
                setTimeout(() => {
                  fetchThreads();
                }, 500);
                return prevThreads;
              }
            });
          }

          // Auto-scroll to bottom only if this message is for the currently selected thread
          if (newMessage.thread_id === selectedThread) {
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }
        });

        console.log(`✅ [Student] Message listener attached for channel: chat.${selectedThread}`);
        console.log(`✅ [Student] Listener object:`, listener);
        console.log(`🧪 [Student] Testing listener setup - if you see this, listener was created`);

        channelRef.current = selectedThread;
        console.log(`✅ [Student] Subscribed to channel: chat.${selectedThread}`);
      } catch (error) {
        console.error('Error subscribing to channel:', error);
      }
    };

    subscribeToChannel();

    // Cleanup on thread change
    return () => {
      isMounted = false;
      try {
        if (channelRef.current) {
          echo.leave(`chat.${channelRef.current}`);
        }
      } catch (e) {
        console.error('Error leaving channel:', e);
      }
      channelRef.current = null;
    };
  }, [selectedThread, currentUserId]);

  // Load messages when thread is selected
  useEffect(() => {
    if (selectedThread && !threadMessages[selectedThread]) {
      console.log(`📥 Loading messages for thread: ${selectedThread}`);
      fetchThreadMessages(selectedThread);
    }
  }, [selectedThread]);

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

  // Poll for conversation list updates as a fallback (every 60 seconds)
  // Only update if there are actual changes to prevent unnecessary re-renders and reload loops
  useEffect(() => {
    if (!currentUserId) return;
    
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for conversation list updates...');
      fetchThreads();
    }, 60000); // Poll every 60 seconds (less frequent to avoid reload loops)
    
    return () => clearInterval(pollInterval);
  }, [currentUserId]);

  const fetchCurrentUser = async () => {
    // First try to get from session (faster, no API call)
    try {
      const session = localStorage.getItem('lms.session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.user && parsed.user.id) {
          const userId = typeof parsed.user.id === 'string' ? parseInt(parsed.user.id) : parsed.user.id;
          setCurrentUserId(userId);
          updateEchoAuth();
          return; // Early return if we got it from session
        }
        // Try alternative session structure
        if (parsed.id) {
          const userId = typeof parsed.id === 'string' ? parseInt(parsed.id) : parsed.id;
          setCurrentUserId(userId);
          updateEchoAuth();
          return;
        }
      }
    } catch (e) {
      console.error('Failed to parse session:', e);
    }

    // Fallback to API call
    try {
      const profile = await commonApi.profile.get();
      if (profile && profile.id) {
        setCurrentUserId(profile.id);
        updateEchoAuth();
      } else {
        console.warn('Profile data is invalid, using session fallback');
      }
    } catch (error) {
      console.warn('Failed to fetch current user from API, using session:', error);
      // Final fallback - try session again
      try {
        const session = localStorage.getItem('lms.session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed.user && parsed.user.id) {
            const userId = typeof parsed.user.id === 'string' ? parseInt(parsed.user.id) : parsed.user.id;
            setCurrentUserId(userId);
            updateEchoAuth();
          } else if (parsed.id) {
            const userId = typeof parsed.id === 'string' ? parseInt(parsed.id) : parsed.id;
            setCurrentUserId(userId);
            updateEchoAuth();
          }
        }
      } catch (e) {
        console.error('Failed to get user from session:', e);
      }
    }
  };


  const fetchThreads = async () => {
    try {
      const data = await commonApi.messages.getThreads();
      console.log('📋 Fetched threads:', data.length, 'conversations');
      
      // Sort by last message date (most recent first) - backend should do this, but ensure it here too
      const sortedData = [...data].sort((a, b) => {
        const timeA = new Date(a.last_message?.created_at || 0).getTime();
        const timeB = new Date(b.last_message?.created_at || 0).getTime();
        return timeB - timeA; // Descending order (newest first)
      });
      
      // Update threads - use functional update to prevent infinite loops
      setThreads(prevThreads => {
        // Simple comparison - check if length or first thread changed
        if (prevThreads.length === sortedData.length) {
          // Check if the first thread's last message changed (most likely to change)
          const prevFirst = prevThreads[0];
          const newFirst = sortedData[0];
          if (prevFirst && newFirst && 
              prevFirst.thread_id === newFirst.thread_id &&
              prevFirst.last_message?.id === newFirst.last_message?.id &&
              prevFirst.unread_count === newFirst.unread_count) {
            // No significant changes, return previous to prevent re-render
            return prevThreads;
          }
        }
        console.log('📋 Threads updated');
        return sortedData;
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch threads:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load conversations",
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
               typeof msg.id === 'number' &&
               !readMessages.has(msg.id) &&
               !('is_optimistic' in msg)
      );
      
      if (unreadMessages.length === 0) return;

      // Mark all unread messages as read
      const markPromises = unreadMessages.map(msg => {
        if (typeof msg.id === 'number') {
          return commonApi.messages.markAsRead(msg.id).catch(err => {
            console.error('Failed to mark message as read:', err);
          });
        }
        return Promise.resolve();
      });

      await Promise.all(markPromises);
      
      // Update local state
      unreadMessages.forEach(msg => {
        if (typeof msg.id === 'number') {
          setReadMessages(prev => new Set(prev).add(msg.id as number));
        }
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
      const classes = await studentApi.getClasses();
      const tutorMap = new Map<number, Recipient>();
      
      classes.forEach(cls => {
        if (cls.tutor?.user) {
          const tutorId = cls.tutor.user.id;
          if (!tutorMap.has(tutorId)) {
            tutorMap.set(tutorId, {
              id: tutorId,
              name: cls.tutor.user.name,
              email: cls.tutor.user.email,
              role: 'tutor',
              class_name: cls.name,
            });
          }
        }
      });
      
      setRecipients(Array.from(tutorMap.values()));
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
    // Fetch messages for this thread
    fetchThreadMessages(threadId);
  };

  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});

  const fetchThreadMessages = async (threadId: string) => {
    try {
      setLoadingMessages(prev => ({ ...prev, [threadId]: true }));
      const messages = await commonApi.messages.list({ thread_id: threadId });
      setThreadMessages(prev => ({
        ...prev,
        [threadId]: messages,
      }));
    } catch (error: any) {
      console.error('Failed to fetch messages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(prev => ({ ...prev, [threadId]: false }));
    }
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
      subject: 'Chat',
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
    setNewMessageContent('');
    setAttachedFiles([]);
    setNewMessageOpen(false);

    try {
      const sentMessage = await commonApi.messages.create({
        recipient_id: recipientId,
        subject: 'Chat',
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
    if (!thread || !currentUserId || !thread.last_message) return;

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
      }).catch((error) => {
        console.error('Error creating message:', error);
        throw error;
      });

      // Check if sentMessage is valid
      if (!sentMessage || !sentMessage.id) {
        console.error('Invalid message response:', sentMessage);
        // Don't throw error here - let WebSocket handle the message update
        // The message was likely sent successfully but response format is different
        return;
      }

      // Replace optimistic message with real one
      if (sentMessage && sentMessage.id) {
        setThreadMessages(prev => ({
          ...prev,
          [selectedThread]: (prev[selectedThread] || []).map(m => 
            m.id === tempId ? { ...sentMessage, is_optimistic: false } : m
          ),
        }));

        // Update thread list locally
        setThreads(prevThreads => {
          const threadIndex = prevThreads.findIndex(t => t.thread_id === selectedThread);
          if (threadIndex >= 0 && sentMessage) {
            const updatedThreads = [...prevThreads];
            updatedThreads[threadIndex] = {
              ...updatedThreads[threadIndex],
              last_message: {
                ...updatedThreads[threadIndex].last_message,
                id: sentMessage.id,
                body: sentMessage.body,
                created_at: sentMessage.created_at,
                is_read: true,
                sender: sentMessage.sender || updatedThreads[threadIndex].last_message.sender,
              },
            };
            // Move to top
            const [movedThread] = updatedThreads.splice(threadIndex, 1);
            return [movedThread, ...updatedThreads];
          }
          return prevThreads;
        });
      }
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
      const fileUrl = `${baseURL.replace('/api/v1', '')}/storage/${attachment.file_path}`;
      
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
                      Send a message to your tutor
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
                                {recipient.name} {recipient.class_name ? `(${recipient.class_name})` : ''}
                        </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No recipients available</SelectItem>
                          )}
                    </SelectContent>
                  </Select>
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
                {loadingMessages[selectedThread] ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : currentMessages.length > 0 ? (
                  <div className="space-y-4">
                    {currentMessages
                      .filter((message) => message && message.id) // Filter out undefined/null messages
                      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                      .map((message, index) => {
                        const sender = message.sender || { name: 'Unknown', id: 0 };
                        const initials = sender.name.split(' ').map(n => n[0]).join('').toUpperCase();
                        const isFromMe = currentUserId !== null && message.sender_id === currentUserId;
                        const hasAttachments = message.attachments && message.attachments.length > 0;
                        const isOptimistic = 'is_optimistic' in message && message.is_optimistic;
                        const isSending = 'sending' in message && message.sending;
                        
                        return (
                          <div
                            key={message.id || `msg-${index}-${message.created_at}`}
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
                                    {message.attachments?.map((attachment: any, attIndex: number) => (
                                      <div key={attachment.id || `att-${attIndex}-${attachment.file_name || attIndex}`} className="relative group">
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
                                  <span className="text-xs" title={message.is_read ? "Read" : "Sent"}>
                                    {message.is_read ? (
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <Check className="h-3 w-3 text-muted-foreground" />
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
};

export default StudentMessaging;
