import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Settings as SettingsIcon, Wifi, Code, Copy, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Settings = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: '',
    email: user?.email || '',
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          toast({
            title: "Error",
            description: "Failed to load profile data.",
            variant: "destructive",
          });
        } else if (profile) {
          setProfileData({
            name: profile.name,
            email: profile.email,
          });
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleProfileUpdate = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          email: profileData.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update profile.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Profile Updated",
          description: "Your profile information has been saved.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
    });
  };

  const websocketExampleCode = `// Example WebSocket server implementation (Node.js)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', function connection(ws) {
  console.log('MS Data Viewer connected');
  
  // Send control status
  ws.send(JSON.stringify({
    type: 'control_status',
    payload: { mode: 'standby', isConnected: true }
  }));
  
  // Handle control commands
  ws.on('message', function incoming(message) {
    const data = JSON.parse(message);
    if (data.type === 'control') {
      console.log('Control command:', data.command);
      // Handle start_scan, standby, stop commands
    }
  });
  
  // Send mock data (replace with your MS data)
  const sendData = () => {
    const mockData = {
      type: 'data',
      payload: {
        id: Date.now().toString(),
        timestamp: Date.now(),
        mz: 100 + Math.random() * 900,
        intensity: Math.random() * 100000,
        scan: Math.floor(Math.random() * 1000),
        retentionTime: Math.random() * 60,
        msLevel: Math.random() < 0.7 ? 1 : 2,
        precursorMz: Math.random() < 0.3 ? 200 + Math.random() * 600 : undefined
      }
    };
    ws.send(JSON.stringify(mockData));
  };
  
  // Send data every 100ms
  const interval = setInterval(sendData, 100);
  
  ws.on('close', () => {
    clearInterval(interval);
    console.log('MS Data Viewer disconnected');
  });
};`;

  const dataFormatExample = `{
  "type": "data",
  "payload": {
    "id": "unique_scan_id",
    "timestamp": 1625097600000,
    "mz": 523.2847,
    "intensity": 45623.8,
    "scan": 1234,
    "retentionTime": 12.34,
    "msLevel": 1,
    "precursorMz": 523.2847,
    "precursorScan": 1233
  }
}`;

  const controlCommandExample = `{
  "type": "control",
  "command": "start_scan" // or "standby", "stop"
}`;

  const pythonWebSocketExample = `# Python WebSocket server implementation
import asyncio
import websockets
import json
import time
import random
from typing import Dict, Any

class MSDataServer:
    def __init__(self):
        self.clients = set()
        self.is_scanning = False
        self.ion_source_params = {
            "currentLCFlow": 0,
            "ionSourceType": "ESI",
            "posIonSprayVoltage": 3500,
            "negIonSprayVoltage": 2300,
            "sheathGas": 5,
            "auxGas": 2,
            "sweepGas": 0,
            "ionTransferTubeTemp": 275
        }
        self.scan_params = {
            "scanType": "Full Scan",
            "orbitrapResolution": 90000,
            "scanRangeMin": 150,
            "scanRangeMax": 2000,
            "rfLens": 70,
            "agcTarget": "Standard",
            "maxInjectionTime": "Custom",
            "timeMs": 100,
            "microscans": 1,
            "sourceFragmentation": False,
            "useEasyIC": "Off"
        }

    async def register_client(self, websocket):
        self.clients.add(websocket)
        # Send initial status
        await websocket.send(json.dumps({
            "type": "control_status",
            "payload": {"mode": "standby", "isConnected": True}
        }))
        
    async def unregister_client(self, websocket):
        self.clients.remove(websocket)

    async def handle_message(self, websocket, message):
        try:
            data = json.loads(message)
            
            if data["type"] == "control":
                await self.handle_control_command(data["command"])
            elif data["type"] == "ion_source_params":
                self.ion_source_params.update(data["payload"])
                print(f"Ion source parameters updated: {data['payload']}")
            elif data["type"] == "scan_params":
                self.scan_params.update(data["payload"])
                print(f"Scan parameters updated: {data['payload']}")
                
        except json.JSONDecodeError:
            print("Invalid JSON received")

    async def handle_control_command(self, command: str):
        if command in ["start_scan", "start_acquisition"]:
            self.is_scanning = True
            status = {"mode": "scanning", "isConnected": True}
        elif command == "standby":
            self.is_scanning = False
            status = {"mode": "standby", "isConnected": True}
        elif command in ["stop", "stop_acquisition"]:
            self.is_scanning = False
            status = {"mode": "off", "isConnected": True}
        
        # Broadcast status to all clients
        await self.broadcast({
            "type": "control_status",
            "payload": status
        })

    async def broadcast(self, message):
        if self.clients:
            await asyncio.gather(
                *[client.send(json.dumps(message)) for client in self.clients],
                return_exceptions=True
            )

    async def generate_mock_data(self):
        scan_number = 1
        while True:
            if self.is_scanning and self.clients:
                # Generate mock MS data
                data = {
                    "type": "data",
                    "payload": {
                        "id": f"{int(time.time() * 1000)}_{random.randint(1000, 9999)}",
                        "timestamp": int(time.time() * 1000),
                        "mz": random.uniform(100, 1000),
                        "intensity": random.uniform(1000, 100000),
                        "scan": scan_number,
                        "retentionTime": random.uniform(0, 60),
                        "msLevel": 1 if random.random() < 0.7 else 2
                    }
                }
                
                if data["payload"]["msLevel"] == 2:
                    data["payload"]["precursorMz"] = random.uniform(200, 800)
                    data["payload"]["precursorScan"] = max(1, scan_number - random.randint(1, 5))
                
                await self.broadcast(data)
                scan_number += 1
            
            await asyncio.sleep(0.1)  # 10 Hz data rate

    async def handler(self, websocket, path):
        await self.register_client(websocket)
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister_client(websocket)

# Start the server
async def main():
    server = MSDataServer()
    
    # Start data generation task
    asyncio.create_task(server.generate_mock_data())
    
    # Start WebSocket server
    start_server = websockets.serve(server.handler, "localhost", 8080)
    print("MS Data Server started on ws://localhost:8080")
    
    await start_server
    await asyncio.Future()  # Run forever

if __name__ == "__main__":
    # Install required packages:
    # pip install websockets
    asyncio.run(main())`;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-600">Manage your profile and system configuration</p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6 max-w-4xl mx-auto">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="connection" className="flex items-center space-x-2">
              <Wifi className="w-4 h-4" />
              <span>Connection</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>API Documentation</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>User Profile</CardTitle>
                <CardDescription>
                  Update your personal information and account settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleProfileUpdate}>
                    Save Changes
                  </Button>
                  <Button variant="destructive" onClick={logout}>
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Connection Tab */}
          <TabsContent value="connection">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>WebSocket Connection</CardTitle>
                  <CardDescription>
                    Configure your Python mass spectrometry server to connect to this application
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Server URL</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input value="ws://localhost:8080" readOnly />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => copyToClipboard('ws://localhost:8080', 'WebSocket URL')}
                        >
                          {copiedCode === 'WebSocket URL' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <Badge variant="secondary">Ready for Connection</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Python Server Requirements</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Python WebSocket server on port 8080</li>
                      <li>• Support for real-time MS data streaming</li>
                      <li>• Handle instrument control commands</li>
                      <li>• Support ion source and scan parameter updates</li>
                      <li>• Install required packages: <code className="bg-blue-100 px-1 rounded">pip install websockets</code></li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Message Protocol</CardTitle>
                  <CardDescription>
                    Message types your Python server should handle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Control Commands</h4>
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                        <pre>{JSON.stringify({
                          type: "control",
                          command: "start_acquisition" // or start_scan, stop_acquisition, stop, standby
                        }, null, 2)}</pre>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Ion Source Parameters</h4>
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                        <pre>{JSON.stringify({
                          type: "ion_source_params",
                          payload: {
                            posIonSprayVoltage: 3500,
                            sheathGas: 5,
                            ionTransferTubeTemp: 275
                          }
                        }, null, 2)}</pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Scan Parameters</h4>
                      <div className="bg-gray-900 text-gray-100 p-3 rounded text-sm">
                        <pre>{JSON.stringify({
                          type: "scan_params",
                          payload: {
                            scanType: "Full Scan",
                            orbitrapResolution: 90000,
                            scanRangeMin: 150,
                            scanRangeMax: 2000
                          }
                        }, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Format Requirements</CardTitle>
                  <CardDescription>
                    Your MS server must send data in the following format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{dataFormatExample}</pre>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => copyToClipboard(dataFormatExample, 'Data Format')}
                  >
                    {copiedCode === 'Data Format' ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy Format
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Documentation Tab */}
          <TabsContent value="api">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Python WebSocket Server Implementation</CardTitle>
                  <CardDescription>
                    Complete Python server implementation for your mass spectrometry system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{pythonWebSocketExample}</pre>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => copyToClipboard(pythonWebSocketExample, 'Python Server Code')}
                  >
                    {copiedCode === 'Python Server Code' ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy Python Server Code
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Control Commands</CardTitle>
                  <CardDescription>
                    Handle instrument control commands from the dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                    <pre>{controlCommandExample}</pre>
                  </div>
                  <div className="mt-4 space-y-2">
                    <h4 className="font-medium">Available Commands:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• <code className="bg-gray-100 px-1 rounded">start_scan</code> - Begin data acquisition</li>
                      <li>• <code className="bg-gray-100 px-1 rounded">standby</code> - Put instrument in standby mode</li>
                      <li>• <code className="bg-gray-100 px-1 rounded">stop</code> - Stop all operations</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Fields Reference</CardTitle>
                  <CardDescription>
                    Complete reference for all supported data fields
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Field</th>
                          <th className="text-left p-2">Type</th>
                          <th className="text-left p-2">Required</th>
                          <th className="text-left p-2">Description</th>
                        </tr>
                      </thead>
                      <tbody className="text-gray-600">
                        <tr className="border-b">
                          <td className="p-2 font-mono">id</td>
                          <td className="p-2">string</td>
                          <td className="p-2">✓</td>
                          <td className="p-2">Unique identifier for the scan</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">timestamp</td>
                          <td className="p-2">number</td>
                          <td className="p-2">✓</td>
                          <td className="p-2">Unix timestamp in milliseconds</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">mz</td>
                          <td className="p-2">number</td>
                          <td className="p-2">✓</td>
                          <td className="p-2">Mass-to-charge ratio</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">intensity</td>
                          <td className="p-2">number</td>
                          <td className="p-2">✓</td>
                          <td className="p-2">Ion intensity value</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">scan</td>
                          <td className="p-2">number</td>
                          <td className="p-2">✓</td>
                          <td className="p-2">Scan number</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">retentionTime</td>
                          <td className="p-2">number</td>
                          <td className="p-2">✓</td>
                          <td className="p-2">Retention time in minutes</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">msLevel</td>
                          <td className="p-2">number</td>
                          <td className="p-2">-</td>
                          <td className="p-2">MS level (1 for MS1, 2 for MS2)</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2 font-mono">precursorMz</td>
                          <td className="p-2">number</td>
                          <td className="p-2">-</td>
                          <td className="p-2">Precursor m/z (for MS2 scans)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono">precursorScan</td>
                          <td className="p-2">number</td>
                          <td className="p-2">-</td>
                          <td className="p-2">Reference to parent MS1 scan</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Settings;
