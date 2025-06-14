
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { wsService, IonSourceParameters, ScanParameters } from '@/services/websocketService';
import { useToast } from '@/hooks/use-toast';
import { Settings, Zap } from 'lucide-react';

const MSParameterControl = () => {
  const { toast } = useToast();
  const [ionSourceParams, setIonSourceParams] = useState<IonSourceParameters>(wsService.getIonSourceParameters());
  const [scanParams, setScanParams] = useState<ScanParameters>(wsService.getScanParameters());

  const handleIonSourceUpdate = (field: keyof IonSourceParameters, value: any) => {
    const updatedParams = { ...ionSourceParams, [field]: value };
    setIonSourceParams(updatedParams);
    wsService.sendIonSourceParameters({ [field]: value });
    
    toast({
      title: "Parameter Updated",
      description: `${field} set to ${value}`,
    });
  };

  const handleScanUpdate = (field: keyof ScanParameters, value: any) => {
    const updatedParams = { ...scanParams, [field]: value };
    setScanParams(updatedParams);
    wsService.sendScanParameters({ [field]: value });
    
    toast({
      title: "Parameter Updated",
      description: `${field} set to ${value}`,
    });
  };

  const resetToDefaults = () => {
    const defaultIonSource: IonSourceParameters = {
      currentLCFlow: 0,
      ionSourceType: 'ESI',
      posIonSprayVoltage: 3500,
      negIonSprayVoltage: 2300,
      sheathGas: 5,
      auxGas: 2,
      sweepGas: 0,
      ionTransferTubeTemp: 275,
    };

    const defaultScan: ScanParameters = {
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

    setIonSourceParams(defaultIonSource);
    setScanParams(defaultScan);
    wsService.sendIonSourceParameters(defaultIonSource);
    wsService.sendScanParameters(defaultScan);

    toast({
      title: "Parameters Reset",
      description: "All parameters reset to default values",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>MS Parameter Control</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={resetToDefaults}>
              Reset to Defaults
            </Button>
          </div>

          <Tabs defaultValue="ion-source" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ion-source" className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Ion Source</span>
              </TabsTrigger>
              <TabsTrigger value="scan-params" className="flex items-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Scan Parameters</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ion-source" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lcFlow">Current LC Flow (µL/min)</Label>
                  <Input
                    id="lcFlow"
                    type="number"
                    value={ionSourceParams.currentLCFlow}
                    onChange={(e) => handleIonSourceUpdate('currentLCFlow', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="ionSourceType">Ion Source Type</Label>
                  <Select
                    value={ionSourceParams.ionSourceType}
                    onValueChange={(value) => handleIonSourceUpdate('ionSourceType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ESI">ESI</SelectItem>
                      <SelectItem value="APCI">APCI</SelectItem>
                      <SelectItem value="APPI">APPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="posVoltage">Pos Ion Spray Voltage (V)</Label>
                  <Input
                    id="posVoltage"
                    type="number"
                    value={ionSourceParams.posIonSprayVoltage}
                    onChange={(e) => handleIonSourceUpdate('posIonSprayVoltage', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="negVoltage">Neg Ion Spray Voltage (V)</Label>
                  <Input
                    id="negVoltage"
                    type="number"
                    value={ionSourceParams.negIonSprayVoltage}
                    onChange={(e) => handleIonSourceUpdate('negIonSprayVoltage', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="sheathGas">Sheath Gas (Arb)</Label>
                  <Input
                    id="sheathGas"
                    type="number"
                    value={ionSourceParams.sheathGas}
                    onChange={(e) => handleIonSourceUpdate('sheathGas', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="auxGas">Aux Gas (Arb)</Label>
                  <Input
                    id="auxGas"
                    type="number"
                    value={ionSourceParams.auxGas}
                    onChange={(e) => handleIonSourceUpdate('auxGas', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="sweepGas">Sweep Gas (Arb)</Label>
                  <Input
                    id="sweepGas"
                    type="number"
                    value={ionSourceParams.sweepGas}
                    onChange={(e) => handleIonSourceUpdate('sweepGas', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="tubeTemp">Ion Transfer Tube Temp (°C)</Label>
                  <Input
                    id="tubeTemp"
                    type="number"
                    value={ionSourceParams.ionTransferTubeTemp}
                    onChange={(e) => handleIonSourceUpdate('ionTransferTubeTemp', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scan-params" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scanType">Scan Type</Label>
                  <Select
                    value={scanParams.scanType}
                    onValueChange={(value) => handleScanUpdate('scanType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Full Scan">Full Scan</SelectItem>
                      <SelectItem value="SIM">SIM</SelectItem>
                      <SelectItem value="SRM">SRM</SelectItem>
                      <SelectItem value="DDA">DDA</SelectItem>
                      <SelectItem value="DIA">DIA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resolution">Orbitrap Resolution</Label>
                  <Input
                    id="resolution"
                    type="number"
                    value={scanParams.orbitrapResolution}
                    onChange={(e) => handleScanUpdate('orbitrapResolution', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="scanMin">Scan Range Min (m/z)</Label>
                  <Input
                    id="scanMin"
                    type="number"
                    value={scanParams.scanRangeMin}
                    onChange={(e) => handleScanUpdate('scanRangeMin', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="scanMax">Scan Range Max (m/z)</Label>
                  <Input
                    id="scanMax"
                    type="number"
                    value={scanParams.scanRangeMax}
                    onChange={(e) => handleScanUpdate('scanRangeMax', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="rfLens">RF Lens (%)</Label>
                  <Input
                    id="rfLens"
                    type="number"
                    value={scanParams.rfLens}
                    onChange={(e) => handleScanUpdate('rfLens', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="agcTarget">AGC Target</Label>
                  <Select
                    value={scanParams.agcTarget}
                    onValueChange={(value) => handleScanUpdate('agcTarget', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxInjection">Maximum Injection Time</Label>
                  <Select
                    value={scanParams.maxInjectionTime}
                    onValueChange={(value) => handleScanUpdate('maxInjectionTime', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Standard">Standard</SelectItem>
                      <SelectItem value="Custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timeMs">Time (ms)</Label>
                  <Input
                    id="timeMs"
                    type="number"
                    value={scanParams.timeMs}
                    onChange={(e) => handleScanUpdate('timeMs', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div>
                  <Label htmlFor="microscans">Microscans</Label>
                  <Input
                    id="microscans"
                    type="number"
                    value={scanParams.microscans}
                    onChange={(e) => handleScanUpdate('microscans', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="sourceFragmentation"
                    checked={scanParams.sourceFragmentation}
                    onCheckedChange={(checked) => handleScanUpdate('sourceFragmentation', checked)}
                  />
                  <Label htmlFor="sourceFragmentation">Source Fragmentation</Label>
                </div>

                <div>
                  <Label htmlFor="easyIC">Use EASY-IC™</Label>
                  <Select
                    value={scanParams.useEasyIC}
                    onValueChange={(value) => handleScanUpdate('useEasyIC', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Off">Off</SelectItem>
                      <SelectItem value="On">On</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default MSParameterControl;
