
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProfileAvatar from "@/app/components/ProfileAvatar";
import ChatMessage from "@/app/components/ChatMessage";
import MessageInput from "@/app/components/MessageInput";
import VideoCall from "@/app/components/VideoCall";
import { Button } from "@/app/components/ui/button";
import { Phone, Video, ArrowLeft, MoreVertical } from "lucide-react";

// Demo data for the chat
const DEMO_CONTACTS = [
  {
    id: "1",
    name: "Emma Wilson",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    status: "online",
  },
  {
    id: "2",
    name: "Alexander Lee",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    status: "offline",
  },
  {
    id: "3",
    name: "Sophia Chen",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    status: "away",
  },
  {
    id: "4",
    name: "James Rodriguez",
    status: "online",
  },
  {
    id: "5",
    name: "Olivia Johnson",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    status: "busy",
  }
];

// Demo messages
const generateDemoMessages = (contactId: string) => {
  const isEven = parseInt(contactId) % 2 === 0;
  
  // Base set of messages
  const messages = [
    {
      id: "1",
      content: isEven 
        ? "Hey, how are you doing?" 
        : "Hi there! Do you have a minute to talk about the project?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      isSent: false,
      status: "read" as const,
    },
    {
      id: "2",
      content: isEven 
        ? "I'm good, thanks! Just working on some new designs."
        : "Sure, I'm free now. What's up?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 5), // 5 minutes later
      isSent: true,
      status: "read" as const,
    },
    {
      id: "3",
      content: isEven 
        ? "Can I see what you're working on?"
        : "I've been reviewing the mockups and I think we need to make some adjustments to the color scheme.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 10), // 10 minutes later
      isSent: false,
      status: "read" as const,
    },
    {
      id: "4",
      content: isEven 
        ? "Sure! I'll share my screen with you later today if you're free."
        : "I see. What kind of adjustments are you thinking of?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 15), // 15 minutes later
      isSent: true,
      status: "read" as const,
    },
    {
      id: "5",
      content: isEven 
        ? "Perfect, I'm available after 3pm."
        : "Something more vibrant for the call-to-action buttons. The current colors are a bit too subtle.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      isSent: false,
      status: "read" as const,
    },
    {
      id: "6",
      content: isEven 
        ? "Great, I'll send you a calendar invite."
        : "That makes sense. I'll work on some alternatives and share them with you soon.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isSent: true,
      status: "delivered" as const,
    }
  ];
  
  return messages;
};

const ChatRoom = () => {
  const { contactId } = useParams<{ contactId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<any[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inCall, setInCall] = useState<false | "audio" | "video">(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const contact = DEMO_CONTACTS.find(c => c.id === contactId);
  
  useEffect(() => {
    if (contactId) {
      // Load demo messages
      setMessages(generateDemoMessages(contactId));
    }
  }, [contactId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isSent: true,
      status: "sent" as const,
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Simulate received message and typing indicator
    setIsTyping(true);
    
    // Simulate message status updates
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id ? { ...msg, status: "delivered" as const } : msg
        )
      );
    }, 1000);
    
    // Simulate reply
    setTimeout(() => {
      setIsTyping(false);
      
      const replyMessage = {
        id: (Date.now() + 1).toString(),
        content: `Thanks for your message: "${content.slice(0, 20)}${content.length > 20 ? '...' : ''}"`,
        timestamp: new Date(),
        isSent: false,
      };
      
      setMessages(prev => [...prev, replyMessage]);
      
      // Simulate 'read' status
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id ? { ...msg, status: "read" as const } : msg
          )
        );
      }, 1500);
    }, 3000);
  };
  
  const handleStartCall = (type: "audio" | "video") => {
    setInCall(type);
  };
  
  const handleEndCall = () => {
    setInCall(false);
  };
  
  const handleBackButton = () => {
    navigate("/");
  };
  
  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-500 mb-4">Contact not found</p>
        <Button onClick={handleBackButton}>Back to Contacts</Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full relative">
      {/* Chat header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBackButton} className="mr-2 md:hidden">
            <ArrowLeft size={20} />
          </Button>
          <ProfileAvatar 
            src={contact.avatar}
            name={contact.name}
            status={contact.status as any}
          />
          <div className="ml-3">
            <h3 className="font-medium">{contact.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {contact.status === "online" ? "Online" : "Last seen recently"}
            </p>
          </div>
        </div>
        <div className="flex">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleStartCall("audio")}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <Phone size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => handleStartCall("video")}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <Video size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <MoreVertical size={20} />
          </Button>
        </div>
      </div>
      
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              content={message.content}
              timestamp={message.timestamp}
              isSent={message.isSent}
              status={message.status}
              senderName={message.isSent ? undefined : contact.name}
            />
          ))}
          
          {isTyping && (
            <div className="flex items-center mt-2 mb-4">
              <ProfileAvatar 
                src={contact.avatar}
                name={contact.name}
                size="sm"
              />
              <div className="ml-2 typing-indicator" />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input */}
      <MessageInput onSendMessage={handleSendMessage} />
      
      {/* Call overlay */}
      {inCall && (
        <VideoCall 
          isAudioOnly={inCall === "audio"}
          onEndCall={handleEndCall}
          remoteUserName={contact.name}
          remoteUserImage={contact.avatar}
        />
      )}
    </div>
  );
};

export default ChatRoom;
