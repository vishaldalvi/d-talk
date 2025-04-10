'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ProfileAvatar from "./ProfileAvatar";
import {
  Search, Settings, MessageSquare, Phone, Video, PlusCircle
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useAuth } from "@/app/context/AuthContext";
import Cookies from "js-cookie";
import { LogOut } from "lucide-react";

type Contact = {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away" | "busy";
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
};

interface SidebarProps {
  user: { id: string; username: string; name: string; avatar: string; status: number; } | null;
  onCreateNewChat: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onCreateNewChat }) => {
  const location = usePathname();
  const router = useRouter();
  const { contacts } = useAuth();
  const [new_contacts, setContacts] = useState<Contact[]>([]);
  const [activeTab, setActiveTab] = useState<"messages" | "calls">("messages");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (date: Date) => {
    if (!date) return "--";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    if (diff < oneDay) {
      return date.toISOString().substring(11, 16);
    } else if (diff < oneDay * 7) {
      return new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date);
    } else {
      return new Intl.DateTimeFormat("en-GB", { month: "short", day: "numeric" }).format(date);
    }
  };

  const handleLogout = () => {
    Cookies.remove("authToken");
    Cookies.remove("user");
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-full border-r border-gray-200 dark:border-gray-800 w-72 bg-sidebar">
      {/* Sidebar header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Messages</h1>
          <Button variant="ghost" size="icon">
            <Settings size={20} />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-gray-100 dark:bg-gray-800 border-0"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === "messages"
            ? "text-primary"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          onClick={() => setActiveTab("messages")}
        >
          Messages
          {activeTab === "messages" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${activeTab === "calls"
            ? "text-primary"
            : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            }`}
          onClick={() => setActiveTab("calls")}
        >
          Calls
          {activeTab === "calls" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
      </div>

      {/* Contacts list */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "messages" ? (
          <div className="py-2">
            {/* New chat button */}
            <button
              onClick={onCreateNewChat}
              className="flex items-center w-full px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary mr-3">
                <PlusCircle size={20} />
              </div>
              <span className="font-medium">New Message</span>
            </button>

            {/* Contact list */}
            {filteredContacts.length > 0 ? (
              filteredContacts.map(contact => (
                <Link
                  key={contact.id}
                  href={`/chat/${contact.id}`}
                  className={`flex items-center px-4 py-3 transition-colors ${location === `/chat/${contact.id}`
                    ? "bg-gray-100 dark:bg-gray-800/50"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800/30"
                    }`}
                >
                  <div className="relative mr-3">
                    <ProfileAvatar
                      src={contact.avatar}
                      name={contact.name}
                      status={contact.status}
                    />
                    {contact.unreadCount && contact.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 bg-primary text-white text-xs font-bold rounded-full">
                        {contact.unreadCount}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium text-sm truncate">{contact.name}</h3>
                      {contact && contact.lastMessageTime && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">
                          {contact.lastMessageTime}
                        </span>
                      )}
                    </div>
                    {contact.lastMessage && (
                      <p className={`text-xs truncate ${contact.unreadCount && contact.unreadCount > 0
                        ? "font-medium text-gray-900 dark:text-gray-100"
                        : "text-gray-500 dark:text-gray-400"
                        }`}>
                        {contact.lastMessage}
                      </p>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                No contacts found
              </div>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="flex justify-between mb-4">
              <h3 className="font-medium">Recent</h3>
              <Button variant="ghost" size="sm" className="text-primary text-xs">View all</Button>
            </div>

            {/* Recent calls - demo data */}
            <div className="space-y-3">
              {[
                { name: "Emma Wilson", time: "Today, 10:30 AM", type: "video", status: "missed" },
                { name: "Alexander Lee", time: "Yesterday, 4:15 PM", type: "audio", status: "completed" },
                { name: "Sophia Chen", time: "Jul 15, 2:00 PM", type: "video", status: "completed" },
              ].map((call, index) => (
                <div key={index} className="flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/30 transition-colors">
                  <div className="mr-3">
                    <ProfileAvatar
                      name={call.name}
                      src={filteredContacts.find(c => c.name === call.name)?.avatar}
                      size="sm"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{call.name}</h4>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      {call.type === "video" ? <Video size={12} className="mr-1" /> : <Phone size={12} className="mr-1" />}
                      <span>{call.time}</span>
                    </div>
                  </div>
                  <div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {call.type === "video" ? <Video size={16} /> : <Phone size={16} />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User profile */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ProfileAvatar name="John Doe" status="online" />
            <div className="ml-3">
              <h3 className="text-sm font-medium">{user ? user.name : "Guest"}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Available</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
