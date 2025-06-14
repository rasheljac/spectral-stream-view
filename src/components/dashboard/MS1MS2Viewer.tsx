
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MassSpecData } from '@/services/websocketService';

interface MS1MS2ViewerProps {
  data: MassSpecData[];
}

interface ScanPair {
  ms1Scan: MassSpecData[];
  ms2Scan: MassSpecData[];
  ms1ScanNumber: number;
  ms2ScanNumber: number;
  precursorMz: number;
}

const MS1MS2Viewer = ({ data }: MS1MS2ViewerProps) => {
  const [scanPairs, setScanPairs] = useState<ScanPair[]>([]);
  const [selectedPairIndex, setSelectedPairIndex] = useState<number>(0);

  useEffect(() => {
    // Group data by scan number and MS level
    const scanMap = new Map<number, { ms1: MassSpecData[], ms2: MassSpecData[] }>();
    
    data.forEach(point => {
      const scanNum = point.scan;
      if (!scanMap.has(scanNum)) {
        scanMap.set(scanNum, { ms1: [], ms2: [] });
      }
      
      const scanData = scanMap.get(scanNum)!;
      if (point.msLevel === 1) {
        scanData.ms1.push(point);
      } else if (point.msLevel === 2) {
        scanData.ms2.push(point);
      }
    });

    // Create pairs where both MS1 and MS2 data exist
    const pairs: ScanPair[] = [];
    scanMap.forEach((scanData, scanNumber) => {
      if (scanData.ms1.length > 0 && scanData.ms2.length > 0) {
        const ms2Sample = scanData.ms2[0];
        pairs.push({
          ms1Scan: scanData.ms1,
          ms2Scan: scanData.ms2,
          ms1ScanNumber: scanNumber,
          ms2ScanNumber: scanNumber,
          precursorMz: ms2Sample.precursorMz || 0
        });
      }
    });

    setScanPairs(pairs.slice(-20)); // Keep last 20 pairs
    if (pairs.length > 0 && selectedPairIndex >= pairs.length) {
      setSelectedPairIndex(pairs.length - 1);
    }
  }, [data, selectedPairIndex]);

  const selectedPair = scanPairs[selectedPairIndex];

  const prepareChartData = (scanData: MassSpecData[]) => {
    return scanData.map(point => ({
      mz: Math.round(point.mz * 10) / 10,
      intensity: point.intensity,
    }));
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>MS1/MS2 Scan Viewer</CardTitle>
          <CardDescription>
            Compare MS1 precursor scans with their corresponding MS2 fragmentation patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select 
              value={selectedPairIndex.toString()} 
              onValueChange={(value) => setSelectedPairIndex(parseInt(value))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a scan pair" />
              </SelectTrigger>
              <SelectContent>
                {scanPairs.map((pair, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    Scan {pair.ms1ScanNumber} - Precursor m/z: {pair.precursorMz.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPair && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* MS1 Scan */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">MS1 Scan #{selectedPair.ms1ScanNumber}</CardTitle>
                  <CardDescription>Precursor ion scan</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={prepareChartData(selectedPair.ms1Scan)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="mz" 
                          stroke="#64748b"
                          fontSize={12}
                          label={{ value: 'm/z', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          stroke="#64748b"
                          fontSize={12}
                          label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                          formatter={(value: any) => [
                            typeof value === 'number' ? value.toLocaleString() : value,
                            'Intensity'
                          ]}
                        />
                        <Scatter dataKey="intensity" fill="#3b82f6" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Data points: {selectedPair.ms1Scan.length}</p>
                    <p>Precursor m/z: {selectedPair.precursorMz.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* MS2 Scan */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">MS2 Scan #{selectedPair.ms2ScanNumber}</CardTitle>
                  <CardDescription>Fragmentation pattern</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart data={prepareChartData(selectedPair.ms2Scan)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="mz" 
                          stroke="#64748b"
                          fontSize={12}
                          label={{ value: 'm/z', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          stroke="#64748b"
                          fontSize={12}
                          label={{ value: 'Intensity', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#ffffff', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                          formatter={(value: any) => [
                            typeof value === 'number' ? value.toLocaleString() : value,
                            'Intensity'
                          ]}
                        />
                        <Scatter dataKey="intensity" fill="#ef4444" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Data points: {selectedPair.ms2Scan.length}</p>
                    <p>Fragmentation of: {selectedPair.precursorMz.toFixed(2)} m/z</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {scanPairs.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p>No MS1/MS2 scan pairs available</p>
              <p className="text-sm">Waiting for data with both MS1 and MS2 scans...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MS1MS2Viewer;
