/**
 * Preload script for Electron
 * Exposes safe APIs to the renderer process
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Pairing
  getPairingStatus: () => ipcRenderer.invoke('get-pairing-status'),
  pairAgent: (token: string, name: string) => ipcRenderer.invoke('pair-agent', token, name),

  // Queue
  getQueueStatus: () => ipcRenderer.invoke('get-queue-status'),
  replayQueue: () => ipcRenderer.invoke('replay-queue'),

  // Device
  getDeviceStatus: () => ipcRenderer.invoke('get-device-status'),
});




