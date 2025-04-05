'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { alovaInstance } from "@/app/api/apiClient";
import Cookies from "js-cookie";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  contacts: Contact[];
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (username: string, name: string, password: string) => Promise<void>;
  fetchContacts: () => void;
  fetchMessages: (contact_id: string) => Promise<any[]>;
  messages: any[];
  sendMessage: (receiver_id: string, content: string) => Promise<any[]>;
}

interface LoginResponse {
  user: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    status: number;
  };
  access_token: string;
  token_type: string;
}

interface RegisterResponse {
  id: string;
  username: string;
  name: string;
  avatar: string;
  status: number;
}

interface Contact {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  status: "online" | "offline" | "away" | "busy";
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface Messages {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: Date;
  status: string;
  isSent: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = Cookies.get("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        fetchContacts();
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = (await alovaInstance.Post("/token", formData).send()) as LoginResponse;

      if (response?.access_token) {
        Cookies.set("authToken", response.access_token, { expires: 7, secure: true });
        Cookies.set("user", JSON.stringify(response.user), { expires: 7, secure: true });
        setUser(response.user);
        router.push("/chat");
        fetchContacts();
      } else {
        toast.error("Invalid login credentials or response missing token.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    router.push("/login");
  };

  const getToken = () => {
    return Cookies.get("authToken");
  };

  const register = async (username: string, name: string, password: string) => {
    setIsLoading(true);
    try {
      const response = (await alovaInstance
        .Post("/register", { username, password, name })
        .send()) as RegisterResponse;

      if (response?.id) {
        toast.success("Registration successful! Redirecting to login...");
        router.push("/login");
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const token = getToken();
      const response = await alovaInstance.Get<Contact[]>("/users/contacts", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).send();
      setContacts(response);
    } catch (error) {
      console.error("Failed to fetch contacts:", error);
    }
  };

  const fetchMessages = async (contact_id: string): Promise<any[]> => {
    try {
      const token = getToken();
      const response = await alovaInstance.Get(`/messages/${contact_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }).send() as any[];

      setMessages(response);
      return response;
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      return [];
    }
  };

  const sendMessage = async (receiver_id: string, content: string): Promise<any[]> => {
    try {
      const token = getToken();
      const response = await alovaInstance.Post(
        '/messages',
        { receiver_id, content },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ).send() as any[];

      // setMessages(response);
      return response;
    } catch (error) {
      console.error("Failed to fetch messages:", error);
      return [];
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, contacts, login, logout, register, fetchContacts, fetchMessages, messages, sendMessage }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
