'use client';

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from 'next/navigation';
import ProfileAvatar from "@/app/components/ProfileAvatar";
import ChatMessage from "@/app/components/ChatMessage";
import MessageInput from "@/app/components/MessageInput";
import VideoCall from "@/app/components/VideoCall";
import { Button } from "@/app/components/ui/button";
import { Phone, Video, ArrowLeft, MoreVertical } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import Loading from "@/app/loading";
import { Centrifuge } from "centrifuge";
import { centToken } from "@/app/api/apiClient";

const ChatRoom = () => {
  const router = useRouter();
  const params = useParams();
  const { fetchContacts, contacts, fetchMessages, sendMessage } = useAuth();
  const [contactId, setContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inCall, setInCall] = useState<false | "audio" | "video">(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const centrifugeRef = useRef<Centrifuge | null>(null);

  const contact = contacts.find(c => c.id === contactId || '');

  useEffect(() => {
    setLoading(true);
    fetchContacts();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (params.contactId) {
      setContactId(params.contactId as string);
    }
  }, [params.contactId]);

  useEffect(() => {
    if (contactId) {
      setLoading(true);
      fetchMessages(contactId).then(fetchedMessages => {
        setMessages(fetchedMessages);
        setLoading(false);
      });

      const centrifuge = new Centrifuge("ws://localhost:9000/connection/websocket", {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJzaHViaGFtLnBvIiwiZXhwIjoxNzQzOTE4NzA2LjExMzg1OH0.S8MS2u1Pv9xAkC2kyuqdxcOpZVwlsAqa34g7BrUqGCY"
      });
      centrifugeRef.current = centrifuge;

      centrifuge.on("connected", () => {
        console.log("Connected to Centrifugo WebSocket");
      });

      const subscription = centrifuge.newSubscription(`user-${contactId}`);

      subscription.on("publication", (ctx) => {
        console.log("New message received:", ctx.data.data);
        console.log("messages", messages);
        setMessages((prev) => [...prev, ctx.data.data]);
        console.log("11.messages", messages);
      });

      subscription.subscribe();
      centrifuge.connect();

      return () => {
        subscription.unsubscribe();
        centrifuge.disconnect();
      };
    } else {
      setMessages([]);
      setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      timestamp: new Date(),
      isSent: true,
      status: "sent" as const,
    };

    if (contactId) {
      setLoading(true);
      sendMessage(contactId, content).finally(() => setLoading(false));
    }
    // setMessages(prev => [...prev, newMessage]);
  };

  const handleStartCall = (type: "audio" | "video") => {
    setInCall(type);
  };

  const handleEndCall = () => {
    setInCall(false);
  };

  const handleBackButton = () => {
    router.push("/");
  };

  if (loading) {
    return <Loading />;
  }

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-500 mb-4">Contact not found</p>
        <Button onClick={handleBackButton}>Back to Contacts</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="fixed top-0 left-0 w-full z-10 bg-white dark:bg-gray-900 shadow-md p-4 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={handleBackButton} className="mr-2">
            <ArrowLeft size={20} />
          </Button>
          <ProfileAvatar src={contact.avatar} name={contact.name} status={contact.status as any} />
          <div className="ml-3">
            <h3 className="font-medium">{contact.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {contact.status === "online" ? "Online" : "Last seen recently"}
            </p>
          </div>
        </div>
        <div className="flex">
          <Button variant="ghost" size="icon" onClick={() => handleStartCall("audio")}>
            <Phone size={20} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => handleStartCall("video")}>
            <Video size={20} />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical size={20} />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto mt-16 mb-16 p-4 bg-gray-50 dark:bg-gray-900 scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        <div className="max-w-3xl mx-auto">
          {messages.map((message) => (
            <ChatMessage key={message.id} content={message.content} timestamp={message.timestamp} isSent={message.isSent} status={message.status} senderName={message.isSent ? undefined : contact.name} />
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 left-0 w-full z-10 bg-white dark:bg-gray-900 shadow-md">
        <MessageInput onSendMessage={handleSendMessage} />
      </div>
      {inCall && <VideoCall isAudioOnly={inCall === "audio"} onEndCall={handleEndCall} remoteUserName={contact.name} remoteUserImage={contact.avatar} />}
    </div>
  );
};

export default ChatRoom;
