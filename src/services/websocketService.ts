
export interface MassSpecData {
  id: string;
  timestamp: number;
  mz: number; // mass-to-charge ratio
  intensity: number;
  scan: number;
  retentionTime: number;
}

export interface PeakData {
  mz: number;
  intensity: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Set<(data: MassSpecData) => void> = new Set();
  private statusListeners: Set<(status: 'connected' | 'disconnected' | 'error') => void> = new Set();

  constructor(url: string = 'ws://localhost:8080') {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.notifyStatusListeners('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: MassSpecData = JSON.parse(event.data);
            this.listeners.forEach(listener => listener(data));
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.notifyStatusListeners('disconnected');
          this.handleReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.notifyStatusListeners('error');
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  onData(callback: (data: MassSpecData) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  onStatusChange(callback: (status: 'connected' | 'disconnected' | 'error') => void) {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  private notifyStatusListeners(status: 'connected' | 'disconnected' | 'error') {
    this.statusListeners.forEach(listener => listener(status));
  }

  // Simulate data for demo purposes when WebSocket server is not available
  startMockData() {
    const generateMockData = (): MassSpecData => {
      return {
        id: Date.now().toString() + Math.random(),
        timestamp: Date.now(),
        mz: 100 + Math.random() * 900, // m/z range 100-1000
        intensity: Math.random() * 100000,
        scan: Math.floor(Math.random() * 1000),
        retentionTime: Math.random() * 60, // 0-60 minutes
      };
    };

    const interval = setInterval(() => {
      const mockData = generateMockData();
      this.listeners.forEach(listener => listener(mockData));
    }, 100); // Send data every 100ms

    return () => clearInterval(interval);
  }
}

export const wsService = new WebSocketService();
