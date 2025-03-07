
import { toast } from "sonner";

const API_URL = "http://localhost:8000";

// Types
export interface User {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  status: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
  centrifugo_token: string;
  centrifugo_ws_url: string;
}

// API Service
class ApiService {
  private token: string | null = null;
  
  constructor() {
    // Load token from localStorage if available
    this.token = localStorage.getItem("token");
  }
  
  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (includeAuth && this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    
    return headers;
  }
  
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.detail || `Error: ${response.status}`;
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    return response.json() as Promise<T>;
  }
  
  // Auth methods
  async login(username: string, password: string): Promise<LoginResponse> {
    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);
    
    const response = await fetch(`${API_URL}/token`, {
      method: "POST",
      body: formData,
    });
    
    const data = await this.handleResponse<LoginResponse>(response);
    
    // Save token
    this.token = data.access_token;
    localStorage.setItem("token", data.access_token);
    
    return data;
  }
  
  async register(userData: { 
    username: string; 
    password: string; 
    name: string; 
    avatar?: string; 
  }): Promise<User> {
    const response = await fetch(`${API_URL}/register`, {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify(userData),
    });
    
    return this.handleResponse<User>(response);
  }
  
  async logout(): Promise<void> {
    // Update status to offline
    await this.updateStatus("offline").catch(console.error);
    
    // Clear token
    this.token = null;
    localStorage.removeItem("token");
  }
  
  // User methods
  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<User>(response);
  }
  
  async getUsers(): Promise<User[]> {
    const response = await fetch(`${API_URL}/users`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<User[]>(response);
  }
  
  async updateStatus(status: string): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/users/status`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    
    return this.handleResponse<{ status: string }>(response);
  }
  
  // Message methods
  async getMessages(contactId: string): Promise<Message[]> {
    const response = await fetch(`${API_URL}/messages/${contactId}`, {
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<Message[]>(response);
  }
  
  async sendMessage(receiverId: string, content: string): Promise<Message> {
    const response = await fetch(`${API_URL}/messages`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify({
        receiver_id: receiverId,
        content,
      }),
    });
    
    return this.handleResponse<Message>(response);
  }
  
  async updateMessageStatus(messageId: string, status: string): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/messages/${messageId}/status?status=${status}`, {
      method: "POST",
      headers: this.getHeaders(),
    });
    
    return this.handleResponse<{ status: string }>(response);
  }
  
  // Call methods
  async sendCallSignal(signalData: {
    call_id: string;
    caller_id: string;
    callee_id: string;
    call_type: "audio" | "video";
    signal_type: string;
    payload: any;
  }): Promise<{ status: string }> {
    const response = await fetch(`${API_URL}/call/signal`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(signalData),
    });
    
    return this.handleResponse<{ status: string }>(response);
  }
}

export const apiService = new ApiService();
