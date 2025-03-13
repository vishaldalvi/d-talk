'use client';

import React, { useEffect, useState } from "react";
import Sidebar from "@/app/components/Sidebar";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface User {
  id: string;
  username: string;
  name: string;
  avatar: string;
  status: number;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = Cookies.get("authToken");
      const storedUser = Cookies.get("user");

      if (!authToken || !storedUser) {
        router.replace("/login");
      } else {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing user from cookies:", error);
          Cookies.remove("user");
          router.replace("/login");
        }
      }
    };

    checkAuth();
  }, []);

  const handleCreateNewChat = () => {
    router.push("/chat/1");
  };

  return (
    <div className="flex h-screen">
      <Sidebar onCreateNewChat={handleCreateNewChat} user={user} />
      <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-6 max-w-md">
          <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-8 h-8"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome to D-Talks</h1>
          <h5 className="text-lg mb-2">Talk Freely, Connect Deeply.</h5>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Select a conversation from the sidebar or start a new chat
          </p>
          <button
            onClick={handleCreateNewChat}
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Start New Conversation
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
