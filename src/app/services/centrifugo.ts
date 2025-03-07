
import { Centrifuge } from 'centrifuge';
import { apiService } from './api';
import { toast } from "sonner";

interface CentrifugoConfig {
  token: string;
  url: string;
  userId: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: any) => void;
  onCallSignal?: (signal: any) => void;
  onUserStatusChange?: (data: { user_id: string; status: string }) => void;
}

class CentrifugoService {
  private centrifuge: any = null;
  private userChannel: any | null = null;
  private allUsersChannel: any | null = null;

  connect({
    token,
    url,
    userId,
    onConnect,
    onDisconnect,
    onMessage,
    onCallSignal,
    onUserStatusChange
  }: CentrifugoConfig): void {
    // Disconnect existing connection if any
    this.disconnect();

    // Create new connection using the correct instantiation method
    this.centrifuge = new (Centrifuge as any)(url);

    // Set connection token
    this.centrifuge.setToken(token);

    // Setup event handlers
    this.centrifuge.on('connect', (ctx: any) => {
      console.log('Connected to Centrifugo', ctx);

      // Update user status to online
      apiService.updateStatus('online').catch(console.error);

      if (onConnect) {
        onConnect();
      }
    });

    this.centrifuge.on('disconnect', (ctx: any) => {
      console.log('Disconnected from Centrifugo', ctx);

      if (onDisconnect) {
        onDisconnect();
      }
    });

    // Subscribe to user's personal channel
    this.userChannel = this.centrifuge.subscribe(`user:${userId}`, (message: any) => {
      console.log('Received message:', message);

      const { data, type } = message.data;

      switch (type) {
        case 'message_received':
        case 'message_sent':
          if (onMessage) {
            onMessage(data);
          }
          break;

        case 'message_status_updated':
          // Handle status update
          console.log('Message status updated:', data);
          break;

        case 'call_signal':
          if (onCallSignal) {
            onCallSignal(data);
          }
          break;

        default:
          console.log('Unknown message type:', type);
      }
    });

    // Subscribe to all users channel for status updates
    this.allUsersChannel = this.centrifuge.subscribe('user:all', (message: any) => {
      console.log('Received all users channel message:', message);

      const { data, type } = message.data;

      if (type === 'user_status_changed' && onUserStatusChange) {
        onUserStatusChange(data);
      }
    });

    // Connect to Centrifugo
    this.centrifuge.connect();
  }

  disconnect(): void {
    if (this.centrifuge) {
      // Update status to offline before disconnecting
      apiService.updateStatus('offline').catch(console.error);

      if (this.userChannel) {
        this.userChannel.unsubscribe();
        this.userChannel = null;
      }

      if (this.allUsersChannel) {
        this.allUsersChannel.unsubscribe();
        this.allUsersChannel = null;
      }

      this.centrifuge.disconnect();
      this.centrifuge = null;
    }
  }

  isConnected(): boolean {
    return this.centrifuge !== null && this.centrifuge.isConnected();
  }
}

export const centrifugoService = new CentrifugoService();
