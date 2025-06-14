
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Settings as SettingsIcon, Wifi, Code, Copy, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleProfileUpdate = () => {
    // Simulate profile update
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved.",
    });
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
});`;

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
                    Configure your mass spectrometry server to connect to this application
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
                    <h4 className="font-medium text-blue-900 mb-2">Connection Requirements</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• WebSocket server running on port 8080</li>
                      <li>• Send data in JSON format (see API Documentation)</li>
                      <li>• Support control commands for scan management</li>
                      <li>• Implement proper error handling and reconnection</li>
                    </ul>
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
                  <CardTitle>WebSocket Server Implementation</CardTitle>
                  <CardDescription>
                    Example implementation for your mass spectrometry server
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-x-auto">
                    <pre>{websocketExampleCode}</pre>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => copyToClipboard(websocketExampleCode, 'Server Code')}
                  >
                    {copiedCode === 'Server Code' ? <CheckCircle className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                    Copy Server Code
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
