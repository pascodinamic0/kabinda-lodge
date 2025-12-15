// @ts-nocheck
/**
 * Electron Main Process
 * Entry point for the Hotel Lock Agent
 */
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import { startServer } from './server';
import { PairingService } from './pairing';
// Use mock implementations if native modules aren't available
let QueueManager: any;
let CardEncoder: any;

try {
  // Try to use real implementations
  const queueModule = require('./queue');
  const encoderModule = require('./encoder');
  QueueManager = queueModule.QueueManager;
  CardEncoder = encoderModule.CardEncoder;
} catch (error) {
  // Fall back to mock implementations
  console.warn('⚠️ Native modules not available, using mock implementations');
  const queueMock = require('./queue-mock');
  const encoderMock = require('./encoder-mock');
  QueueManager = queueMock.QueueManager;
  CardEncoder = encoderMock.CardEncoder;
}

import { CloudApiClient } from './cloudApi';

// Keep a global reference of the window object
let mainWindow: BrowserWindow | null = null;
let server: any = null;
let pairingService: PairingService;
let queueManager: any;
let cloudApi: CloudApiClient;
let cardEncoder: any;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    autoHideMenuBar: !isDev,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize services
async function initializeServices() {
  try {
    // Initialize queue manager
    queueManager = new QueueManager();
    await queueManager.initialize();

    // Initialize cloud API client
    const cloudApiUrl = process.env.CLOUD_API_URL || 'http://localhost:3000';
    cloudApi = new CloudApiClient(cloudApiUrl);

    // Initialize card encoder
    cardEncoder = new CardEncoder();

    // Initialize pairing service
    pairingService = new PairingService(cloudApi, queueManager);

    // Start HTTPS server
    server = await startServer({
      pairingService,
      queueManager,
      cloudApi,
      cardEncoder,
    });

    console.log('✅ Services initialized');
    console.log(`✅ HTTPS server running on https://localhost:${server.port}`);

    // Start polling for card issues if agent is paired
    if (pairingService.isPaired()) {
      startCardIssuePolling();
    }
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    dialog.showErrorBox('Initialization Error', `Failed to start agent: ${error}`);
  }
}

// Poll cloud for pending card issues
function startCardIssuePolling() {
  setInterval(async () => {
    if (!pairingService.isPaired()) return;

    try {
      const agentId = pairingService.getAgentId();
      if (!agentId) return;

      // Get pending card issues for this agent
      const cardIssues = await cloudApi.getPendingCardIssues(agentId);

      for (const issue of cardIssues) {
        // Process card issue
        await processCardIssue(issue);
      }
    } catch (error) {
      console.error('Error polling card issues:', error);
    }
  }, 5000); // Poll every 5 seconds
}

// Process a card issue
async function processCardIssue(issue: any) {
  try {
    // Update status to processing
    await cloudApi.updateCardIssueStatus(issue.id, 'processing');

    // Encode the card
    const result = await cardEncoder.encodeCard(issue.card_payload);

    if (result.success) {
      // Update status to done
      await cloudApi.updateCardIssueStatus(issue.id, 'done', {
        cardUID: result.cardUID,
        encodedAt: new Date().toISOString(),
      });

      // Log success
      await cloudApi.logDeviceEvent(pairingService.getAgentId()!, {
        type: 'card_encoded',
        cardIssueId: issue.id,
        success: true,
      });
    } else {
      // Update status to failed
      await cloudApi.updateCardIssueStatus(issue.id, 'failed', {
        error: result.error,
      });

      // Log failure
      await cloudApi.logDeviceEvent(pairingService.getAgentId()!, {
        type: 'card_encode_failed',
        cardIssueId: issue.id,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Error processing card issue:', error);

    // If offline, queue the job
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      await queueManager.addJob({
        type: 'card_issue',
        data: issue,
        retries: 0,
      });
    }

    // Update status to failed
    await cloudApi.updateCardIssueStatus(issue.id, 'failed', {
      error: error.message,
    });
  }
}

// IPC Handlers
ipcMain.handle('get-pairing-status', () => {
  return {
    isPaired: pairingService.isPaired(),
    agentId: pairingService.getAgentId(),
    agentName: pairingService.getAgentName(),
  };
});

ipcMain.handle('pair-agent', async (event, pairingToken: string, agentName: string) => {
  try {
    const result = await pairingService.pair(pairingToken, agentName);
    if (result.success) {
      startCardIssuePolling();
    }
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-queue-status', async () => {
  return await queueManager.getStatus();
});

ipcMain.handle('replay-queue', async () => {
  return await queueManager.replayQueue(cloudApi, cardEncoder);
});

ipcMain.handle('get-device-status', async () => {
  return await cardEncoder.getStatus();
});

// App lifecycle
app.whenReady().then(async () => {
  await initializeServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  if (server) {
    server.close();
  }
  if (queueManager) {
    await queueManager.close();
  }
});

