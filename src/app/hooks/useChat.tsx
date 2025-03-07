import { useState, useEffect, useCallback } from 'react';
import { apiService, Message, User } from '@/app/services/api';
import { centrifugoService } from '@/app/services/centrifugo';
import { useAuth } from './useAuth';
import { toast } from "sonner";

export const useChat = (contactId: string | undefined) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [contact, setContact] = useState<User | null>(null);
  const [contacts, setContacts] = useState<User[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  
  // Load messages
  const loadMessages = useCallback(async () => {
    if (!contactId || !user) return;
    
    setIsLoading(true);
    
    try {
      const fetchedMessages = await apiService.getMessages(contactId);
      setMessages(fetchedMessages);
      
      // Mark messages as read
      fetchedMessages.forEach(msg => {
        if (msg.sender_id === contactId && msg.status !== 'read') {
          apiService.updateMessageStatus(msg.id, 'read').catch(console.error);
        }
      });
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [contactId, user]);
  
  // Load contacts
  const loadContacts = useCallback(async () => {
    if (!user) return;
    
    try {
      const fetchedContacts = await apiService.getUsers();
      setContacts(fetchedContacts);
      
      // Set current contact if contactId is provided
      if (contactId) {
        const currentContact = fetchedContacts.find(c => c.id === contactId);
        setContact(currentContact || null);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      toast.error('Failed to load contacts');
    }
  }, [contactId, user]);
  
  // Send a message
  const sendMessage = useCallback(async (content: string) => {
    if (!contactId || !user) return null;
    
    try {
      const newMessage = await apiService.sendMessage(contactId, content);
      setMessages(prev => [...prev, newMessage]);
      return newMessage;
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      return null;
    }
  }, [contactId, user]);
  
  // Handle incoming messages
  const handleMessageReceived = useCallback((message: Message) => {
    setMessages(prev => {
      // Check if message already exists
      const exists = prev.some(m => m.id === message.id);
      if (exists) return prev;
      
      return [...prev, message];
    });
    
    // Mark as delivered if from the current contact
    if (message.sender_id === contactId) {
      apiService.updateMessageStatus(message.id, 'read').catch(console.error);
    } else if (message.sender_id !== user?.id) {
      apiService.updateMessageStatus(message.id, 'delivered').catch(console.error);
    }
  }, [contactId, user]);
  
  // Handle user status changes
  const handleUserStatusChange = useCallback((data: { user_id: string; status: string }) => {
    setContacts(prev => 
      prev.map(contact => 
        contact.id === data.user_id 
          ? { ...contact, status: data.status } 
          : contact
      )
    );
    
    if (contact && contact.id === data.user_id) {
      setContact({ ...contact, status: data.status });
    }
  }, [contact]);
  
  // Initialize Centrifugo
  useEffect(() => {
    if (!user) return;
    
    // Setup Centrifugo with message handlers
    centrifugoService.connect({
      token: localStorage.getItem('centrifugo_token') || '',
      url: localStorage.getItem('centrifugo_ws_url') || '',
      userId: user.id,
      onMessage: handleMessageReceived,
      onUserStatusChange: handleUserStatusChange
    });
    
    return () => {
      // No need to disconnect on unmount, as we want to keep receiving messages
    };
  }, [user, handleMessageReceived, handleUserStatusChange]);
  
  // Load data when contact changes
  useEffect(() => {
    if (user) {
      loadContacts();
      if (contactId) {
        loadMessages();
      }
    }
  }, [user, contactId, loadContacts, loadMessages]);
  
  return {
    messages,
    contacts,
    contact,
    isLoading,
    isTyping,
    sendMessage,
    loadMessages,
    loadContacts
  };
};
