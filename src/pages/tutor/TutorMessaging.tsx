import { useState, useEffect, useRef } from 'react';
import { Send, Search, Plus, MoreHorizontal, Star, Loader2, Check, CheckCheck, Paperclip, X, File, Download, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { commonApi, Message } from '@/lib/api/common';
import { tutorApi } from '@/lib/api/tutor';
import { useAuthStore } from '@/lib/store/authStore';
import { echo, updateEchoAuth } from '@/lib/echo';
import { apiClient } from '@/lib/api/client';

interface Thread {
  thread_id: string;
  last_message: {
    id: number;
    subject: string;
    body: string;
    is_read: boolean;
    is_important: boolean;
    created_at: string;
    sender: {
      id: number;
      name: string;
      email: string;
      avatar?: string;
    };
  };
  unread_count: number;
  participant: {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    role?: string;
  };
}

interface Recipient {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'parent';
  avatar?: string;
}

export default function TutorMessaging() {
  const { toast } = useToast();
  const { session } = useAuthStore();
  const user = session ? { id: parseInt(session.id), name: session.name, email: session.email } : null;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState<Record<string, boolean>>({});
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadMessages, setThreadMessages] = useState<Record<string, Message[]>>({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [sending, setSending] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ file: File; preview?: string; name: string; size: number }>>([]);
  const channelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [newMessage, setNewMessage] = useState({
    recipient_id: '',
    subject: '',
    body: '',
    important: false,
  });

  // Load threads on mount
  useEffect(() => {
    loadThreads();
    loadRecipients();
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

  // Set up WebSocket listener when thread is selected
  useEffect(() => {
    // Force console output - these should ALWAYS show
    console.log('========================================');
    console.log('🚀🚀🚀 WEBSOCKET SETUP STARTED 🚀🚀🚀');
    console.log('========================================');
    console.log('selectedThread:', selectedThread);
    console.log('user?.id:', user?.id);
    console.log('echo exists:', !!echo);
    
    if (!selectedThread || !user?.id) {
      console.error('❌❌❌ MISSING REQUIREMENTS - WebSocket setup skipped');
      console.error('selectedThread:', selectedThread);
      console.error('user?.id:', user?.id);
      return;
    }

    console.log('✅ Requirements met, proceeding...');
    
    // Update Echo auth with current token
    try {
      updateEchoAuth();
      console.log('✅ Echo auth updated');
    } catch (error) {
      console.error('❌ Error updating Echo auth:', error);
    }
    
    console.log('echo object:', echo);
    console.log('echo.connector:', echo.connector);

    // Leave previous channel
    if (channelRef.current) {
      try {
        echo.leave(`chat.${channelRef.current}`);
      } catch (e) {
        console.error('Error leaving previous channel:', e);
      }
    }

    // Subscribe to the thread's private channel
    console.log(`🔌 Subscribing to channel: chat.${selectedThread}`);
    
    // Wait for connection before subscribing
    const subscribeToChannel = () => {
      try {
        const channel = echo.private(`chat.${selectedThread}`);
        
        // Log subscription success
        channel.subscribed(() => {
          console.log(`✅✅✅ Successfully subscribed to channel: chat.${selectedThread}`);
          console.log(`✅ Channel subscription confirmed - ready to receive events`);
          
          // Test: Check if we can see the channel in pusher
          if (echo.connector && 'pusher' in echo.connector) {
            const pusher = (echo.connector as any).pusher;
            const channels = pusher.channels?.channels || {};
            const channelName = `private-chat.${selectedThread}`;
            console.log(`✅ Active channels:`, Object.keys(channels));
            console.log(`✅ Our channel exists:`, channelName in channels);
            
            // Get the actual Pusher channel object and listen to ALL its events
            const pusherChannel = channels[channelName];
            if (pusherChannel) {
              console.log(`✅ Found Pusher channel object:`, pusherChannel);
              console.log(`✅ Channel methods:`, Object.keys(pusherChannel).filter(k => typeof pusherChannel[k] === 'function'));
              
              // Try to intercept all events by overriding the trigger method
              try {
                // Store original trigger if it exists
                const originalTrigger = (pusherChannel as any)._trigger || (pusherChannel as any).trigger;
                if (originalTrigger && typeof originalTrigger === 'function') {
                  (pusherChannel as any)._originalTrigger = originalTrigger;
                  (pusherChannel as any).trigger = function(eventName: string, data: any) {
                    console.log(`🔍🔍🔍 CHANNEL TRIGGER INTERCEPTED:`);
                    console.log(`🔍 Event: "${eventName}"`);
                    console.log(`🔍 Data:`, data);
                    return originalTrigger.call(this, eventName, data);
                  };
                  console.log(`✅ Channel trigger interceptor attached`);
                }
                
                // Also try binding to common event names
                ['message.sent', '.message.sent', 'client-message.sent'].forEach(eventName => {
                  try {
                    pusherChannel.bind(eventName, (data: any) => {
                      console.log(`🔔🔔🔔 DIRECT BIND (${eventName}):`, data);
                    });
                  } catch (e) {
                    console.warn(`⚠️ Could not bind to ${eventName}:`, e);
                  }
                });
              } catch (error) {
                console.error(`❌ Error setting up channel interceptors:`, error);
              }
            } else {
              console.warn(`⚠️ Pusher channel object not found: ${channelName}`);
              // Try again after a short delay
              setTimeout(() => {
                const retryChannel = pusher.channels?.channels?.[channelName];
                if (retryChannel) {
                  console.log(`✅ Found channel on retry:`, retryChannel);
                } else {
                  console.error(`❌ Channel still not found on retry`);
                }
              }, 500);
            }
          }
        });
        
        channel.error((error: any) => {
          console.error(`❌❌❌ Channel subscription error for chat.${selectedThread}:`, error);
          console.error(`❌ Full error details:`, JSON.stringify(error, null, 2));
        });
        
        // Also listen for subscription state changes
        if (channel.subscriptionPending) {
          console.log(`⏳ Channel subscription is pending for: chat.${selectedThread}`);
        }
        
        // Setup listener - Laravel Echo allows listening before subscription
        console.log(`👂 Setting up message listener for channel: chat.${selectedThread}`);
        console.log(`👂 Channel object:`, channel);
        console.log(`👂 Channel.listen method exists:`, typeof channel.listen === 'function');
        
        // Listen for the event - Laravel Echo uses dot prefix when broadcastAs() is used
        console.log(`👂 Listening for event: .message.sent`);
        
        // Also try direct Pusher channel binding as fallback
        let pusherChannelDirect: any = null;
        if (echo.connector && 'pusher' in echo.connector) {
          const pusher = (echo.connector as any).pusher;
          const channelName = `private-chat.${selectedThread}`;
          pusherChannelDirect = pusher.channels?.channels?.[channelName];
          
          if (pusherChannelDirect) {
            console.log(`👂 Setting up direct Pusher channel binding for: ${channelName}`);
            // Try binding directly to the event
            pusherChannelDirect.bind('client-message.sent', (data: any) => {
              console.log(`🔔🔔🔔 DIRECT PUSHER BIND (client-message.sent):`, data);
            });
            pusherChannelDirect.bind('.message.sent', (data: any) => {
              console.log(`🔔🔔🔔 DIRECT PUSHER BIND (.message.sent):`, data);
            });
            pusherChannelDirect.bind('message.sent', (data: any) => {
              console.log(`🔔🔔🔔 DIRECT PUSHER BIND (message.sent):`, data);
            });
            console.log(`✅ Direct Pusher bindings attached`);
          }
        }
        
        const listener = channel.listen('.message.sent', (data: { message: Message }) => {
          console.log('🔔🔔🔔 WebSocket event received in TutorMessaging 🔔🔔🔔');
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
          
          console.log(`📬 Message from sender ${newMessageSenderId}, current user: ${user?.id}`);
          console.log(`📬 Message thread_id: ${newMessage.thread_id}, selected thread: ${selectedThread}`);
          
          // Don't add if it's from current user (already added optimistically)
          if (newMessageSenderId === user?.id) {
            console.log('✅ Message from current user, replacing optimistic message');
            // Replace optimistic message with real one
            setThreadMessages(prev => ({
              ...prev,
              [selectedThread]: (prev[selectedThread] || []).map(msg => {
                if ('is_optimistic' in msg && (msg as any).is_optimistic) {
                  return newMessage;
                }
                // Check if message already exists
                if (msg.id === newMessage.id) {
                  return newMessage;
                }
                return msg;
              }).filter((msg, index, self) => {
                // Remove duplicates - handle both string and number IDs
                if (msg && msg.id) {
                  const msgId = typeof msg.id === 'string' ? parseInt(msg.id) : msg.id;
                  return index === self.findIndex(m => {
                    if (!m || !m.id) return false;
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
                const isFromCurrentUser = newMessageSenderId === user?.id;
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
                  loadThreads(false);
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
        
        console.log(`✅ Message listener attached for channel: chat.${selectedThread}`);
        console.log(`✅ Listener object:`, listener);
        
        // DEBUG: Try listening to multiple event name formats
        console.log(`🔍 Setting up debug listeners for multiple event name formats...`);
        
        // Try different event name formats
        const debugEventNames = [
          '.message.sent',
          'message.sent', 
          'MessageSent',
          'App\\Events\\MessageSent',
          'private-chat.thread-694c14662d2fa:message.sent',
          'private-chat.thread-694c14662d2fa:.message.sent',
        ];
        
        debugEventNames.forEach(eventName => {
          try {
            channel.listen(eventName, (data: any) => {
              console.log(`🔍🔍🔍 DEBUG EVENT RECEIVED (${eventName}):`, data);
            });
            console.log(`🔍 Debug listener attached for: ${eventName}`);
          } catch (error) {
            console.warn(`⚠️ Could not attach listener for ${eventName}:`, error);
          }
        });
        
        // Also check Pusher connection for raw messages - catch ALL events
        if (echo.connector && 'pusher' in echo.connector) {
          const pusher = (echo.connector as any).pusher;
          
          // Listen to all Pusher connection messages
          pusher.connection.bind('message', (event: any) => {
            console.log(`🔍🔍🔍 RAW PUSHER MESSAGE:`, event);
            
            // Only log non-pong messages (pong is just keepalive)
            if (event.event && event.event !== 'pusher:pong' && event.event !== 'pusher_internal:subscription_succeeded') {
              console.log(`🔍🔍🔍 IMPORTANT: Non-pong event received!`);
              console.log(`🔍 Event name: "${event.event}"`);
              console.log(`🔍 Channel: "${event.channel}"`);
              console.log(`🔍 Full event:`, JSON.stringify(event, null, 2));
            }
            
            if (event.data) {
              try {
                const parsed = JSON.parse(event.data);
                console.log(`🔍 Parsed message data:`, parsed);
                if (parsed.event) {
                  console.log(`🔍 Event name in parsed data: "${parsed.event}"`);
                  console.log(`🔍 Channel in parsed data: "${parsed.channel}"`);
                  if (parsed.event !== 'pusher:pong') {
                    console.log(`🔍🔍🔍 THIS IS A MESSAGE EVENT! Full data:`, parsed);
                  }
                }
              } catch (e) {
                // event.data might already be an object
                if (typeof event.data === 'object') {
                  console.log(`🔍 Event data (object):`, event.data);
                  if (event.data.event && event.data.event !== 'pusher:pong') {
                    console.log(`🔍🔍🔍 THIS IS A MESSAGE EVENT! Full data:`, event.data);
                  }
                } else {
                  console.log(`🔍 Could not parse message data:`, event.data);
                }
              }
            }
          });
          
          console.log(`🔍 Raw Pusher message listener attached`);
        }
        
        channelRef.current = selectedThread;
        return channel;
      } catch (error) {
        console.error('❌ Error subscribing to channel:', error);
        return null;
      }
    };
    
    // Check if Echo is connected before subscribing
    console.log('🔧 Checking Echo connection...');
    let channelInstance: any = null;
    
    if (!echo) {
      console.error('❌❌❌ Echo is not initialized!');
      return;
    }
    
    if (!echo.connector) {
      console.error('❌❌❌ Echo connector is not available!');
      console.error('💡 Echo might not be properly initialized. Check echo.ts');
      return;
    }
    
    if (!('pusher' in echo.connector)) {
      console.error('❌❌❌ Echo connector does not have pusher!');
      return;
    }
    
    const pusher = (echo.connector as any).pusher;
    const state = pusher.connection?.state;
    
    console.log(`🔌🔌🔌 Current WebSocket connection state: ${state}`);
    console.log(`🔌 Pusher connection object:`, {
      state: pusher.connection?.state,
      socket_id: pusher.connection?.socket_id,
      host: pusher.config?.wsHost,
      port: pusher.config?.wsPort,
    });
    
    if (state === 'connected') {
      console.log('✅ Echo is connected, subscribing to channel...');
      channelInstance = subscribeToChannel();
    } else {
      console.warn(`⚠️ Echo not connected (state: ${state}), waiting...`);
      let retryCount = 0;
      const maxRetries = 10;
      const checkConnection = () => {
        retryCount++;
        const currentState = pusher.connection?.state;
        console.log(`🔄 Retry ${retryCount}/${maxRetries}: Connection state: ${currentState}`);
        
        if (currentState === 'connected') {
          console.log('✅ Echo connected, subscribing to channel...');
          channelInstance = subscribeToChannel();
        } else if (currentState === 'failed' || currentState === 'disconnected') {
          console.error('❌ Echo connection failed, cannot subscribe');
          console.error('💡 Please check:');
          console.error('   1. Is Reverb server running? (php artisan reverb:start)');
          console.error('   2. Is REVERB_APP_KEY correct in .env?');
          console.error('   3. Is WebSocket port (8080) accessible?');
        } else if (retryCount < maxRetries) {
          setTimeout(checkConnection, 1000);
        } else {
          console.error('❌ Max retries reached. Connection not established.');
          // Try to subscribe anyway - sometimes it works even if state is not 'connected'
          console.log('⚠️ Attempting subscription anyway...');
          channelInstance = subscribeToChannel();
        }
      };
      checkConnection();
    }

    // Cleanup on thread change
    return () => {
      try {
        if (channelRef.current) {
          echo.leave(`chat.${channelRef.current}`);
        }
      } catch (e) {
        console.error('Error leaving channel:', e);
      }
      channelRef.current = null;
    };
  }, [selectedThread, user?.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedThread) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [threadMessages, selectedThread]);

  // Load messages when thread is selected
  useEffect(() => {
    if (selectedThread) {
      loadThreadMessages(selectedThread);
    }
  }, [selectedThread]);

  // Poll for conversation list updates as a fallback (every 60 seconds)
  // Only update if there are actual changes to prevent unnecessary re-renders and reload loops
  useEffect(() => {
    if (!user?.id) return;
    
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for conversation list updates...');
      loadThreads(false); // Silent update, no loading state
    }, 60000); // Poll every 60 seconds (less frequent to avoid reload loops)
    
    return () => clearInterval(pollInterval);
  }, [user?.id]);

  const loadThreads = async (showLoading: boolean = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await commonApi.messages.getThreads();
      console.log('📋 Threads loaded:', data.length, 'conversations');
      
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
      console.error('❌ Error loading threads:', error);
      if (showLoading) {
        toast({
          title: "Error",
          description: error.message || 'Failed to load message threads',
          variant: "destructive",
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadThreadMessages = async (threadId: string) => {
    try {
      setLoadingMessages(prev => ({ ...prev, [threadId]: true }));
      const messages = await commonApi.messages.list({ 
        per_page: 100,
        thread_id: threadId,
      });
      
      // Sort messages by created_at
      const sortedMessages = messages.sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      // Filter out any undefined/null messages before setting
      const validMessages = sortedMessages.filter(msg => msg && msg.id);
      setThreadMessages(prev => ({
        ...prev,
        [threadId]: validMessages,
      }));
      
      // Mark messages as read
      if (user?.id) {
        const unreadMessages = sortedMessages.filter(m => !m.is_read && m.recipient_id === user.id);
        for (const message of unreadMessages) {
          try {
            await commonApi.messages.markAsRead(message.id);
          } catch (error) {
            console.error('Failed to mark message as read:', error);
          }
        }
      }
      
      // Reload threads to update unread counts (silent update, no loading spinner)
      loadThreads(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to load messages',
        variant: "destructive",
      });
    } finally {
      setLoadingMessages(prev => ({ ...prev, [threadId]: false }));
    }
  };

  const loadRecipients = async () => {
    try {
      setLoadingRecipients(true);
      const data = await tutorApi.getRecipients();
      console.log('Recipients loaded:', data);
      setRecipients(data);
      if (data.length === 0) {
        toast({
          title: "No Recipients",
          description: "No students or parents found. Make sure you have students enrolled in your classes.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error('Error loading recipients:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to load recipients',
        variant: "destructive",
      });
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map(file => {
      const fileData: { file: File; preview?: string; name: string; size: number } = {
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
      
      return fileData;
    });
    
    setAttachedFiles(prev => [...prev, ...newFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
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

  const handleSendReply = async () => {
    if ((!replyText.trim() && attachedFiles.length === 0) || !selectedThread || !user?.id) return;

    // Get the thread to find the recipient
    const thread = threads.find(t => t.thread_id === selectedThread);
    if (!thread) {
      console.error('Thread not found');
      return;
    }
    
    // Get recipient ID from thread participant
    const recipientId = thread.participant.id;
    
    // Get subject from thread or use default
    const subject = thread.last_message?.subject || 'Chat';

    const tempId = `temp-${Date.now()}`;
    const tempMessage: any = {
      id: tempId,
      thread_id: selectedThread,
      sender_id: user.id,
      recipient_id: recipientId,
      subject: subject.startsWith('Re: ') 
        ? subject 
        : `Re: ${subject}`,
      body: replyText || '(File attachment)',
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_optimistic: true,
      sending: true,
      sender: {
        id: user.id,
        name: user.name || 'You',
        email: user.email || '',
      },
      attachments: attachedFiles.length > 0 ? attachedFiles.map((f, i) => ({
        id: i,
        message_id: 0,
        file_path: URL.createObjectURL(f.file),
        file_name: f.name,
        file_size: f.size,
        mime_type: f.file.type,
      })) : undefined,
    };

    // Optimistically add message
    setThreadMessages(prev => ({
      ...prev,
      [selectedThread]: [...(prev[selectedThread] || []), tempMessage],
    }));
    const textToSend = replyText;
    const filesToSend = [...attachedFiles];
    setReplyText('');
    setAttachedFiles([]);

    // Scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      setSending(true);
      const sentMessage = await commonApi.messages.create({
        recipient_id: recipientId,
        subject: subject.startsWith('Re: ') 
          ? subject 
          : `Re: ${subject}`,
        body: textToSend || '(File attachment)',
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
        setSending(false);
        return;
      }

      // Replace optimistic message with real one (WebSocket will also handle this)
      if (sentMessage && sentMessage.id) {
        setThreadMessages(prev => ({
          ...prev,
          [selectedThread]: (prev[selectedThread] || []).map(msg => {
            if ('is_optimistic' in msg && (msg as any).id === tempId) {
              return sentMessage;
            }
            return msg;
          }).filter(msg => msg && msg.id), // Final safety filter
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
        [selectedThread]: (prev[selectedThread] || []).filter(msg => {
          if ('is_optimistic' in msg) {
            return (msg as any).id !== tempId;
          }
          return true;
        }),
      }));
      // Restore text and files
      setReplyText(textToSend);
      setAttachedFiles(filesToSend);

      toast({
        title: "Error",
        description: error.message || 'Failed to send reply',
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleComposeMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject || !newMessage.body) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await commonApi.messages.create({
        recipient_id: Number(newMessage.recipient_id),
        subject: newMessage.subject,
        body: newMessage.body,
        is_important: newMessage.important,
      });

      setNewMessage({
        recipient_id: '',
        subject: '',
        body: '',
        important: false,
      });
      setIsComposeOpen(false);
      await loadThreads();

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to send message',
        variant: "destructive",
      });
    }
  };

  const filteredThreads = threads.filter(thread => {
    const searchLower = searchTerm.toLowerCase();
    return (
      thread.last_message.subject.toLowerCase().includes(searchLower) ||
      thread.participant.name.toLowerCase().includes(searchLower) ||
      thread.last_message.body.toLowerCase().includes(searchLower)
    );
  });

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const selectedThreadData = threads.find(t => t.thread_id === selectedThread);
  const currentMessages = selectedThread ? (threadMessages[selectedThread] || []) : [];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex h-full border rounded-lg overflow-hidden bg-background">
        {/* Sidebar - Conversations List */}
        <div className="w-80 border-r flex flex-col bg-muted/30">
          {/* Header */}
          <div className="p-4 border-b bg-background">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Messages</h2>
              <Dialog open={isComposeOpen} onOpenChange={(open) => {
                setIsComposeOpen(open);
                if (open && recipients.length === 0) {
                  loadRecipients();
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4" />
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
                    <Select 
                      value={newMessage.recipient_id} 
                      onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipient_id: value }))}
                      disabled={loadingRecipients}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipient" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingRecipients ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            Loading recipients...
                          </div>
                        ) : recipients.length === 0 ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No recipients available
                          </div>
                        ) : (
                          recipients.map((recipient) => (
                            <SelectItem key={recipient.id} value={recipient.id.toString()}>
                              {recipient.name} ({recipient.role === 'student' ? 'Student' : 'Parent'})
                            </SelectItem>
                          ))
                        )}
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
                    <Checkbox
                      id="important"
                      checked={newMessage.important}
                      onCheckedChange={(checked) => setNewMessage(prev => ({ ...prev, important: checked as boolean }))}
                    />
                    <Label htmlFor="important" className="text-sm font-normal cursor-pointer">
                      Mark as important
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleComposeMessage}>Send Message</Button>
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
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {searchTerm ? 'No threads found matching your search' : 'No message threads yet'}
            </div>
          ) : (
            filteredThreads.map((thread) => {
              const isSelected = selectedThread === thread.thread_id;
              const participantName = thread.participant.name;
              const initials = getInitials(participantName);
              
              return (
                <div
                  key={thread.thread_id}
                  className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors border-l-2 ${
                    isSelected ? 'border-l-primary bg-muted' : 'border-l-transparent'
                  }`}
                  onClick={() => {
                    console.log('🖱️ Thread clicked:', thread.thread_id);
                    console.log('🖱️ Setting selectedThread to:', thread.thread_id);
                    setSelectedThread(thread.thread_id);
                    console.log('🖱️ Calling loadThreadMessages for:', thread.thread_id);
                    loadThreadMessages(thread.thread_id);
                  }}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={thread.participant.avatar} alt={participantName} />
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
            })
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
                  <AvatarImage src={selectedThreadData.participant.avatar} alt={selectedThreadData.participant.name} />
                  <AvatarFallback>
                    {getInitials(selectedThreadData.participant.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedThreadData.participant.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selectedThreadData.participant.role || 'User'}
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
              ) : currentMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentMessages
                    .filter((message) => message && message.id) // Filter out undefined/null messages
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map((message, index) => {
                    const sender = message.sender || { name: 'Unknown', id: 0 };
                    const initials = getInitials(sender.name);
                    const isFromMe = user?.id !== null && message.sender_id === user?.id;
                    const hasAttachments = message.attachments && message.attachments.length > 0;
                    const isOptimistic = 'is_optimistic' in message && (message as any).is_optimistic;
                    const isSending = 'sending' in message && (message as any).sending;
                    
                    return (
                      <div
                        key={message.id || `msg-${index}-${message.created_at}`}
                        className={`flex gap-3 ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        {!isFromMe && (
                          <Avatar className="h-8 w-8 mt-1">
                            <AvatarImage src={message.sender?.avatar} alt={sender.name} />
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
                              {message.attachments.map((attachment: any, attIndex: number) => (
                                <div key={attachment.id || `att-${attIndex}`} className="relative group">
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
                              {formatTimestamp(message.created_at)}
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
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  rows={1}
                  className="flex-1 min-h-[44px] max-h-32 resize-none"
                />
                <Button 
                  type="button"
                  onClick={handleSendReply} 
                  disabled={(!replyText.trim() && attachedFiles.length === 0) || loadingMessages[selectedThread] || sending || !selectedThread}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
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
