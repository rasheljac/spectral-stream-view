import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { wsService, MassSpecData, ScanControlStatus } from '@/services/websocketService';
import MassSpecChart from './MassSpecChart';
import ControlPanel from './ControlPanel';
import MS1MS2Viewer from './MS1MS2Viewer';
import { useToast } from '@/hooks/use-toast';
import { User } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [massSpecData, setMassSpecData] = useState<MassSpecData[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected');
  const [controlStatus, setControlStatus] = useState<ScanControlStatus>({ mode: 'off', isConnected: false });
  const [isUsingMockData, setIsUsingMockData] = useState(false);

  useEffect(() => {
    // Try to connect to WebSocket server
    wsService.connect().catch(() => {
      console.log('WebSocket server not available, using mock data');
      setIsUsingMockData(true);
      const cleanup = wsService.startMockData();
      
      toast({
        title: "Demo Mode",
        description: "Using simulated data - connect to your MS server for real data",
      });

      return cleanup;
    });

    // Set up data listener
    const unsubscribeData = wsService.onData((data: MassSpecData) => {
      setMassSpecData(prev => {
        const newData = [...prev, data];
        // Keep only last 2000 data points for performance
        return newData.slice(-2000);
      });
    });

    // Set up status listener
    const unsubscribeStatus = wsService.onStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        toast({
          title: "Connected",
          description: "Real-time data stream active",
        });
      } else if (status === 'error') {
        toast({
          title: "Connection Error",
          description: "Failed to connect to MS server",
          variant: "destructive",
        });
      }
    });

    // Set up control status listener
    const unsubscribeControlStatus = wsService.onControlStatusChange((status) => {
      setControlStatus(status);
    });

    return () => {
      unsubscribeData();
      unsubscribeStatus();
      unsubscribeControlStatus();
      wsService.disconnect();
    };
  }, [toast]);

  const handleLogout = async () => {
    wsService.disconnect();
    await logout();
  };

  const handleControlCommand = (command: 'start_scan' | 'standby' | 'stop') => {
    if (isUsingMockData) {
      wsService.mockControlCommand(command);
    } else {
      wsService.sendControlCommand(command);
    }
  };

  const getStatusBadge = () => {
    if (isUsingMockData) {
      return <Badge variant="secondary">DEMO MODE</Badge>;
    }
    
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="default">CONNECTED</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">DISCONNECTED</Badge>;
      case 'error':
        return <Badge variant="destructive">ERROR</Badge>;
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>;
    }
  };

  const currentStats = {
    totalScans: massSpecData.length,
    avgIntensity: massSpecData.length > 0 
      ? Math.round(massSpecData.reduce((sum, d) => sum + d.intensity, 0) / massSpecData.length)
      : 0,
    maxIntensity: massSpecData.length > 0 
      ? Math.max(...massSpecData.map(d => d.intensity))
      : 0,
    dataRate: massSpecData.length > 0 
      ? Math.round(massSpecData.length / ((Date.now() - massSpecData[0].timestamp) / 1000))
      : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MS Data Viewer</h1>
            <p className="text-sm text-gray-600">Real-time Mass Spectrometry Analysis</p>
          </div>
          <div className="flex items-center space-x-4">
            {getStatusBadge()}
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">{user?.email}</span>
            </div>
            <Button variant="outline" onClick={() => window.location.href = '/settings'}>
              Settings
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 space-y-6">
        {/* Control Panel */}
        <ControlPanel 
          controlStatus={controlStatus}
          onControlCommand={handleControlCommand}
          isUsingMockData={isUsingMockData}
        />

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {currentStats.totalScans.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Avg Intensity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {currentStats.avgIntensity.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Max Intensity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {currentStats.maxIntensity.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Data Rate (Hz)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {currentStats.dataRate}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Interface */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ms1ms2">MS1/MS2 Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MassSpecChart 
                data={massSpecData} 
                title="Mass Spectrum" 
                type="spectrum"
              />
              <MassSpecChart 
                data={massSpecData} 
                title="Total Ion Chromatogram" 
                type="chromatogram"
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <MassSpecChart 
                data={massSpecData} 
                title="Real-time Intensity Monitor" 
                type="intensity"
              />
            </div>

            {/* Connection Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connection Information</CardTitle>
                <CardDescription>
                  Mass spectrometry data streaming details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <span className="ml-2">{isUsingMockData ? 'Demo Mode (Simulated Data)' : connectionStatus}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Data Points:</span>
                    <span className="ml-2">{massSpecData.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Server URL:</span>
                    <span className="ml-2">{isUsingMockData ? 'Mock Data Generator' : 'ws://localhost:8080'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Last Update:</span>
                    <span className="ml-2">
                      {massSpecData.length > 0 
                        ? new Date(massSpecData[massSpecData.length - 1].timestamp).toLocaleTimeString()
                        : 'No data received'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ms1ms2">
            <MS1MS2Viewer data={massSpecData} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
