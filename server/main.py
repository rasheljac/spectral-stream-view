
import asyncio
import websockets
import json
import random
import time
from typing import Dict, Any

class MSWebSocketServer:
    def __init__(self):
        self.clients = set()
        self.scan_status = {"mode": "off", "isConnected": False}
        self.ion_source_params = {
            "currentLCFlow": 0,
            "ionSourceType": "ESI",
            "posIonSprayVoltage": 3500,
            "negIonSprayVoltage": 2300,
            "sheathGas": 5,
            "auxGas": 2,
            "sweepGas": 0,
            "ionTransferTubeTemp": 275,
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
            "useEasyIC": "Off",
        }
        self.scan_number = 1
        self.is_running = False

    async def register(self, websocket):
        self.clients.add(websocket)
        self.scan_status["isConnected"] = True
        await self.send_status_update(websocket)
        print(f"Client connected. Total clients: {len(self.clients)}")

    async def unregister(self, websocket):
        self.clients.discard(websocket)
        if not self.clients:
            self.scan_status["isConnected"] = False
        print(f"Client disconnected. Total clients: {len(self.clients)}")

    async def send_status_update(self, websocket):
        message = {
            "type": "control_status",
            "payload": self.scan_status
        }
        await websocket.send(json.dumps(message))

    async def broadcast_data(self, data):
        if self.clients:
            message = json.dumps(data)
            await asyncio.gather(
                *[client.send(message) for client in self.clients],
                return_exceptions=True
            )

    def generate_mock_data(self):
        is_ms2 = random.random() < 0.3
        ms_level = 2 if is_ms2 else 1
        
        return {
            "type": "data",
            "payload": {
                "id": str(time.time()) + str(random.random()),
                "timestamp": int(time.time() * 1000),
                "mz": random.uniform(100, 900) if ms_level == 1 else random.uniform(50, 500),
                "intensity": random.uniform(1000, 100000),
                "scan": self.scan_number,
                "retentionTime": random.uniform(0, 60),
                "msLevel": ms_level,
                "precursorMz": random.uniform(200, 600) if is_ms2 else None,
                "precursorScan": max(1, self.scan_number - random.randint(1, 5)) if is_ms2 else None,
            }
        }

    async def data_generator(self):
        while True:
            if self.scan_status["mode"] == "scanning" and self.clients:
                data = self.generate_mock_data()
                await self.broadcast_data(data)
                self.scan_number += 1
            await asyncio.sleep(0.1)  # 10Hz data rate

    async def handle_message(self, websocket, message):
        try:
            data = json.loads(message)
            
            if data.get("type") == "control":
                command = data.get("command")
                if command in ["start_scan", "start_acquisition"]:
                    self.scan_status["mode"] = "scanning"
                elif command == "standby":
                    self.scan_status["mode"] = "standby"
                elif command in ["stop", "stop_acquisition"]:
                    self.scan_status["mode"] = "off"
                
                await self.broadcast_data({
                    "type": "control_status",
                    "payload": self.scan_status
                })
                
            elif data.get("type") == "ion_source_params":
                self.ion_source_params.update(data.get("payload", {}))
                await self.broadcast_data({
                    "type": "ion_source_params",
                    "payload": self.ion_source_params
                })
                
            elif data.get("type") == "scan_params":
                self.scan_params.update(data.get("payload", {}))
                await self.broadcast_data({
                    "type": "scan_params",
                    "payload": self.scan_params
                })
                
        except json.JSONDecodeError:
            print("Invalid JSON received")

    async def handle_client(self, websocket, path):
        await self.register(websocket)
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            await self.unregister(websocket)

    async def start_server(self):
        # Start data generator
        asyncio.create_task(self.data_generator())
        
        # Start WebSocket server
        server = await websockets.serve(
            self.handle_client,
            "0.0.0.0",
            8080
        )
        print("MS WebSocket Server running on ws://0.0.0.0:8080")
        await server.wait_closed()

if __name__ == "__main__":
    server = MSWebSocketServer()
    asyncio.run(server.start_server())
