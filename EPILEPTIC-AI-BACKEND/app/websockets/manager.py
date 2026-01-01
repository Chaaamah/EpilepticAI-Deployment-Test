from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import asyncio
from datetime import datetime

class ConnectionManager:
    """Manage WebSocket connections"""
    
    def __init__(self):
        # patient_id -> List[WebSocket]
        self.active_connections: Dict[int, List[WebSocket]] = {}
        # doctor_id -> List[WebSocket]
        self.doctor_connections: Dict[int, List[WebSocket]] = {}
        # WebSocket -> user_info
        self.connection_info: Dict[WebSocket, Dict] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int, user_type: str = "patient"):
        """Accept WebSocket connection"""
        await websocket.accept()
        
        if user_type == "patient":
            if user_id not in self.active_connections:
                self.active_connections[user_id] = []
            self.active_connections[user_id].append(websocket)
        elif user_type == "doctor":
            if user_id not in self.doctor_connections:
                self.doctor_connections[user_id] = []
            self.doctor_connections[user_id].append(websocket)
        
        self.connection_info[websocket] = {
            "user_id": user_id,
            "user_type": user_type,
            "connected_at": datetime.utcnow().isoformat()
        }
        
        print(f"WebSocket connected: {user_type} {user_id}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        info = self.connection_info.get(websocket)
        if info:
            user_id = info["user_id"]
            user_type = info["user_type"]
            
            if user_type == "patient" and user_id in self.active_connections:
                self.active_connections[user_id].remove(websocket)
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
            elif user_type == "doctor" and user_id in self.doctor_connections:
                self.doctor_connections[user_id].remove(websocket)
                if not self.doctor_connections[user_id]:
                    del self.doctor_connections[user_id]
            
            del self.connection_info[websocket]
            
            print(f"WebSocket disconnected: {user_type} {user_id}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific WebSocket"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending message: {e}")
            self.disconnect(websocket)
    
    async def send_to_patient(self, patient_id: int, message: dict):
        """Send message to all connections of a patient"""
        if patient_id in self.active_connections:
            disconnected = []
            for websocket in self.active_connections[patient_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    print(f"Error sending to patient {patient_id}: {e}")
                    disconnected.append(websocket)
            
            # Clean up disconnected sockets
            for websocket in disconnected:
                self.disconnect(websocket)
    
    async def send_to_doctor(self, doctor_id: int, message: dict):
        """Send message to all connections of a doctor"""
        if doctor_id in self.doctor_connections:
            disconnected = []
            for websocket in self.doctor_connections[doctor_id]:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    print(f"Error sending to doctor {doctor_id}: {e}")
                    disconnected.append(websocket)
            
            # Clean up disconnected sockets
            for websocket in disconnected:
                self.disconnect(websocket)
    
    async def broadcast_to_patients(self, message: dict, patient_ids: List[int] = None):
        """Broadcast message to multiple patients"""
        if patient_ids:
            target_ids = patient_ids
        else:
            target_ids = list(self.active_connections.keys())
        
        for patient_id in target_ids:
            await self.send_to_patient(patient_id, message)
    
    async def broadcast_to_doctors(self, message: dict, doctor_ids: List[int] = None):
        """Broadcast message to multiple doctors"""
        if doctor_ids:
            target_ids = doctor_ids
        else:
            target_ids = list(self.doctor_connections.keys())
        
        for doctor_id in target_ids:
            await self.send_to_doctor(doctor_id, message)
    
    def get_connected_patients(self) -> List[int]:
        """Get list of connected patient IDs"""
        return list(self.active_connections.keys())
    
    def get_connected_doctors(self) -> List[int]:
        """Get list of connected doctor IDs"""
        return list(self.doctor_connections.keys())
    
    def get_patient_connection_count(self, patient_id: int) -> int:
        """Get number of connections for a patient"""
        if patient_id in self.active_connections:
            return len(self.active_connections[patient_id])
        return 0
    
    def get_doctor_connection_count(self, doctor_id: int) -> int:
        """Get number of connections for a doctor"""
        if doctor_id in self.doctor_connections:
            return len(self.doctor_connections[doctor_id])
        return 0

# Global connection manager instance
manager = ConnectionManager()