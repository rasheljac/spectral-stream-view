export interface MassSpecData {
  id: string;
  timestamp: number;
  mz: number; // mass-to-charge ratio
  intensity: number;
  scan: number;
  retentionTime: number;
  msLevel?: number; // 1 for MS1, 2 for MS2
  precursorMz?: number; // for MS2 scans
  precursorScan?: number; // reference to parent MS1 scan
}

export interface PeakData {
  mz: number;
  intensity: number;
}

export interface ScanControlStatus {
  mode: 'off' | 'standby' | 'scanning';
  isConnected: boolean;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Set<(data: MassSpecData) => void> = new Set();
  private statusListeners: Set<(status: 'connected' | 'disconnected' | 'error') => void> = new Set();
  private controlStatusListeners: Set<(status: ScanControlStatus) => void> = new Set();
  private currentControlStatus: ScanControlStatus = { mode: 'off', isConnected: false };

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
          this.currentControlStatus.isConnected = true;
          this.notifyStatusListeners('connected');
          this.notifyControlStatusListeners();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            if (message.type === 'data') {
              const data: MassSpecData = message.payload;
              this.listeners.forEach(listener => listener(data));
            } else if (message.type === 'control_status') {
              this.currentControlStatus = { ...this.currentControlStatus, ...message.payload };
              this.notifyControlStatusListeners();
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.currentControlStatus.isConnected = false;
          this.notifyStatusListeners('disconnected');
          this.notifyControlStatusListeners();
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

  onControlStatusChange(callback: (status: ScanControlStatus) => void) {
    this.controlStatusListeners.add(callback);
    // Immediately call with current status
    callback(this.currentControlStatus);
    return () => this.controlStatusListeners.delete(callback);
  }

  private notifyControlStatusListeners() {
    this.controlStatusListeners.forEach(listener => listener(this.currentControlStatus));
  }

  sendControlCommand(command: 'start_scan' | 'standby' | 'stop') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'control',
        command: command
      }));
    }
  }

  mockControlCommand(command: 'start_scan' | 'standby' | 'stop') {
    switch (command) {
      case 'start_scan':
        this.currentControlStatus.mode = 'scanning';
        break;
      case 'standby':
        this.currentControlStatus.mode = 'standby';
        break;
      case 'stop':
        this.currentControlStatus.mode = 'off';
        break;
    }
    this.notifyControlStatusListeners();
  }

  // Simulate data for demo purposes when WebSocket server is not available
  startMockData() {
    let scanNumber = 1;
    
    const generateMockData = (): MassSpecData => {
      const isMS2 = Math.random() < 0.3; // 30% chance of MS2
      const msLevel = isMS2 ? 2 : 1;
      
      return {
        id: Date.now().toString() + Math.random(),
        timestamp: Date.now(),
        mz: msLevel === 1 ? 100 + Math.random() * 900 : 50 + Math.random() * 500,
        intensity: Math.random() * 100000,
        scan: scanNumber++,
        retentionTime: Math.random() * 60,
        msLevel,
        precursorMz: isMS2 ? 200 + Math.random() * 600 : undefined,
        precursorScan: isMS2 ? Math.max(1, scanNumber - Math.floor(Math.random() * 5)) : undefined,
      };
    };

    // Set initial mock status
    this.currentControlStatus = { mode: 'scanning', isConnected: false };
    this.notifyControlStatusListeners();

    const interval = setInterval(() => {
      if (this.currentControlStatus.mode === 'scanning') {
        const mockData = generateMockData();
        this.listeners.forEach(listener => listener(mockData));
      }
    }, 100);

    return () => clearInterval(interval);
  }
}

export const wsService = new WebSocketService();
