import React, { useState, useEffect, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MassSpecData } from '@/services/websocketService';

interface MassSpecChartProps {
  data: MassSpecData[];
  title: string;
  type: 'spectrum' | 'chromatogram' | 'intensity';
}

const MassSpecChart = ({ data, title, type }: MassSpecChartProps) => {
  const [displayData, setDisplayData] = useState<any[]>([]);
  const [isRealTime, setIsRealTime] = useState(true);
  const [top5, setTop5] = useState<{ mz: number; intensity: number }[]>([]);

  // For spectrum: track last full scan (msLevel 1)
  const latestFullScanRef = useRef<MassSpecData[] | null>(null);
  const [latestFullScan, setLatestFullScan] = useState<MassSpecData[] | null>(null);
  const lastScanNumberRef = useRef<number | null>(null);

  useEffect(() => {
    if (type === 'spectrum') {
      // Filter to only msLevel 1 (full scan)
      const fullScans = data.filter((point) => point.msLevel === 1);
      if (fullScans.length === 0) {
        setDisplayData([]);
        setTop5([]);
        setLatestFullScan(null);
        lastScanNumberRef.current = null;
        return;
      }

      // Find scan number of the latest full scan
      const latestScanNumber = fullScans[fullScans.length - 1].scan;
      // Gather all points in latest scan:
      const latestScanPoints = fullScans.filter(
        (point) => point.scan === latestScanNumber
      );

      // Update only if real time or on mount/first render, or if manual resume
      if (isRealTime) {
        // Store to ref and state for pause/resume
        latestFullScanRef.current = latestScanPoints;
        setLatestFullScan(latestScanPoints);

        // Prepare charting data (aggregate same m/z by sum intensity)
        const spectrumData: { mz: number; intensity: number }[] = latestScanPoints.map(
          (point) => ({
            mz: Math.round(point.mz * 10) / 10,
            intensity: point.intensity,
          })
        );

        // Compute top 5 sticks by intensity for labeling
        const top = [...spectrumData]
          .sort((a, b) => b.intensity - a.intensity)
          .slice(0, 5);

        setTop5(top);
        setDisplayData(spectrumData);
        lastScanNumberRef.current = latestScanNumber;
      } else if (latestFullScanRef.current) {
        // Keep showing last full scan when paused
        setLatestFullScan(latestFullScanRef.current);

        const spectrumData: { mz: number; intensity: number }[] = latestFullScanRef.current.map(
          (point) => ({
            mz: Math.round(point.mz * 10) / 10,
            intensity: point.intensity,
          })
        );
        const top = [...spectrumData]
          .sort((a, b) => b.intensity - a.intensity)
          .slice(0, 5);

        setTop5(top);
        setDisplayData(spectrumData);
      }
    } else if (type === 'chromatogram') {
      // Time vs intensity for chromatogram
      // Show all chromatogram points (combine ms1 and ms2)
      if (isRealTime) {
        const chronData = data.slice(-500).map(point => ({
          time: point.retentionTime,
          intensity: point.intensity,
          timestamp: point.timestamp,
        }));
        setDisplayData(chronData);
      }
      // When paused, freeze last displayed points
      else if (displayData.length === 0 && data.length > 0) {
        const chronData = data.slice(-500).map(point => ({
          time: point.retentionTime,
          intensity: point.intensity,
          timestamp: point.timestamp,
        }));
        setDisplayData(chronData);
      }
    } else {
      // Intensity over time
      if (isRealTime) {
        const intensityData = data.slice(-200).map((point, index) => ({
          index,
          intensity: point.intensity,
          timestamp: point.timestamp,
        }));
        setDisplayData(intensityData);
      } else if (displayData.length === 0 && data.length > 0) {
        const intensityData = data.slice(-200).map((point, index) => ({
          index,
          intensity: point.intensity,
          timestamp: point.timestamp,
        }));
        setDisplayData(intensityData);
      }
    }
    // eslint-disable-next-line
  }, [data, type, isRealTime]);

  // Custom label renderer for top 5 masses above their sticks
  const renderBarLabels = (props: any) => {
    const { x, y, width, value, mz, intensity } = props;
    const isTop = top5.some(item =>
      Math.abs(item.mz - mz) < 0.01 &&
      Math.abs(item.intensity - intensity) < 1e-6
    );

    if (!isTop) return null;

    return (
      <g>
        <text
          x={x + width / 2}
          y={y - 8}
          textAnchor="middle"
          fontSize={12}
          fontWeight="bold"
          fill="#334155"
        >
          {mz}
        </text>
      </g>
    );
  };

  const renderChart = () => {
    if (type === 'spectrum') {
      return (
        <BarChart data={displayData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="mz"
            stroke="#64748b"
            type="number"
            domain={['auto', 'auto']}
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
            formatter={(value: any, name: string) => [
              typeof value === 'number' ? value.toLocaleString() : value,
              name === 'intensity' ? 'Intensity' : name
            ]}
          />
          <Bar
            dataKey="intensity"
            fill="#3b82f6"
            barSize={2}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="mz"
              content={renderBarLabels}
              position="top"
            />
          </Bar>
        </BarChart>
      );
    }

    return (
      <LineChart data={displayData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey={type === 'chromatogram' ? 'time' : 'index'}
          stroke="#64748b"
          fontSize={12}
          label={{
            value: type === 'chromatogram' ? 'Retention Time (min)' : 'Scan Number',
            position: 'insideBottom',
            offset: -5
          }}
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
        <Line
          type="monotone"
          dataKey="intensity"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <CardDescription>
            {type === 'spectrum' && 'Mass spectrum - m/z vs intensity'}
            {type === 'chromatogram' && 'Total ion chromatogram - time vs intensity'}
            {type === 'intensity' && 'Real-time intensity monitoring'}
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isRealTime ? 'default' : 'secondary'}>
            {isRealTime ? 'LIVE' : 'PAUSED'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRealTime(!isRealTime)}
          >
            {isRealTime ? 'Pause' : 'Resume'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex justify-between text-sm text-muted-foreground">
          <span>Data points: {displayData.length}</span>
          <span>Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default MassSpecChart;
