
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

export interface IonSourceParameters {
  currentLCFlow: number; // µL/min
  ionSourceType: 'ESI' | 'APCI' | 'APPI';
  posIonSprayVoltage: number; // V
  negIonSprayVoltage: number; // V
  sheathGas: number; // Arb
  auxGas: number; // Arb
  sweepGas: number; // Arb
  ionTransferTubeTemp: number; // °C
}

export interface ScanParameters {
  scanType: 'Full Scan' | 'SIM' | 'SRM' | 'DDA' | 'DIA';
  orbitrapResolution: number;
  scanRangeMin: number; // m/z
  scanRangeMax: number; // m/z
  rfLens: number; // %
  agcTarget: 'Standard' | 'Custom';
  maxInjectionTime: 'Standard' | 'Custom';
  timeMs: number; // ms
  microscans: number;
  sourceFragmentation: boolean;
  useEasyIC: 'Off' | 'On';
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
  private currentIonSourceParams: IonSourceParameters = {
    currentLCFlow: 0,
    ionSourceType: 'ESI',
    posIonSprayVoltage: 3500,
    negIonSprayVoltage: 2300,
    sheathGas: 5,
    auxGas: 2,
    sweepGas: 0,
    ionTransferTubeTemp: 275,
  };
  private currentScanParams: ScanParameters = {
    scanType: 'Full Scan',
    orbitrapResolution: 90000,
    scanRangeMin: 150,
    scanRangeMax: 2000,
    rfLens: 70,
    agcTarget: 'Standard',
    maxInjectionTime: 'Custom',
    timeMs: 100,
    microscans: 1,
    sourceFragmentation: false,
    useEasyIC: 'Off',
  };

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
            } else if (message.type === 'ion_source_params') {
              this.currentIonSourceParams = { ...this.currentIonSourceParams, ...message.payload };
            } else if (message.type === 'scan_params') {
              this.currentScanParams = { ...this.currentScanParams, ...message.payload };
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
    callback(this.currentControlStatus);
    return () => this.controlStatusListeners.delete(callback);
  }

  private notifyControlStatusListeners() {
    this.controlStatusListeners.forEach(listener => listener(this.currentControlStatus));
  }

  sendControlCommand(command: 'start_scan' | 'standby' | 'stop' | 'start_acquisition' | 'stop_acquisition') {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'control',
        command: command
      }));
    }
  }

  sendIonSourceParameters(params: Partial<IonSourceParameters>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'ion_source_params',
        payload: params
      }));
    }
    // Update local state for mock mode
    this.currentIonSourceParams = { ...this.currentIonSourceParams, ...params };
  }

  sendScanParameters(params: Partial<ScanParameters>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'scan_params',
        payload: params
      }));
    }
    // Update local state for mock mode
    this.currentScanParams = { ...this.currentScanParams, ...params };
  }

  getIonSourceParameters(): IonSourceParameters {
    return { ...this.currentIonSourceParams };
  }

  getScanParameters(): ScanParameters {
    return { ...this.currentScanParams };
  }

  mockControlCommand(command: 'start_scan' | 'standby' | 'stop' | 'start_acquisition' | 'stop_acquisition') {
    switch (command) {
      case 'start_scan':
      case 'start_acquisition':
        this.currentControlStatus.mode = 'scanning';
        break;
      case 'standby':
        this.currentControlStatus.mode = 'standby';
        break;
      case 'stop':
      case 'stop_acquisition':
        this.currentControlStatus.mode = 'off';
        break;
    }
    this.notifyControlStatusListeners();
  }

  startMockData() {
    let scanNumber = 1;
    
    const generateMockData = (): MassSpecData => {
      const isMS2 = Math.random() < 0.3;
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
