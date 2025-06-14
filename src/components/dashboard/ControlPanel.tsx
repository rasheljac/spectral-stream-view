
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Square } from 'lucide-react';
import { ScanControlStatus } from '@/services/websocketService';

interface ControlPanelProps {
  controlStatus: ScanControlStatus;
  onControlCommand: (command: 'start_scan' | 'standby' | 'stop') => void;
  isUsingMockData: boolean;
}

const ControlPanel = ({ controlStatus, onControlCommand, isUsingMockData }: ControlPanelProps) => {
  const getStatusBadge = () => {
    if (!controlStatus.isConnected && !isUsingMockData) {
      return <Badge variant="destructive">DISCONNECTED</Badge>;
    }
    
    switch (controlStatus.mode) {
      case 'scanning':
        return <Badge variant="default">SCANNING</Badge>;
      case 'standby':
        return <Badge variant="secondary">STANDBY</Badge>;
      case 'off':
        return <Badge variant="destructive">OFF</Badge>;
      default:
        return <Badge variant="secondary">UNKNOWN</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Instrument Control</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex space-x-2">
          <Button
            onClick={() => onControlCommand('start_scan')}
            disabled={controlStatus.mode === 'scanning'}
            className="flex items-center space-x-2"
          >
            <Play className="w-4 h-4" />
            <span>Start Scan</span>
          </Button>
          
          <Button
            variant="secondary"
            onClick={() => onControlCommand('standby')}
            disabled={controlStatus.mode === 'standby'}
            className="flex items-center space-x-2"
          >
            <Pause className="w-4 h-4" />
            <span>Standby</span>
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => onControlCommand('stop')}
            disabled={controlStatus.mode === 'off'}
            className="flex items-center space-x-2"
          >
            <Square className="w-4 h-4" />
            <span>Stop</span>
          </Button>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          <p>Status: {controlStatus.mode.toUpperCase()}</p>
          <p>Connection: {controlStatus.isConnected || isUsingMockData ? 'Connected' : 'Disconnected'}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ControlPanel;
