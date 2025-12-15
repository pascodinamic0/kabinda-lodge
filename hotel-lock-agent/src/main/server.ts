// @ts-nocheck
/**
 * HTTPS Server
 * Exposes local API for web app communication
 */
import express from 'express';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const cors = require('cors');
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import * as selfsigned from 'selfsigned';
import type { PairingService } from './pairing';
import type { QueueManager } from './queue';
import type { CloudApiClient } from './cloudApi';
import type { CardEncoder } from './encoder';

interface ServerConfig {
  pairingService: PairingService;
  queueManager: QueueManager;
  cloudApi: CloudApiClient;
  cardEncoder: CardEncoder;
}

export async function startServer(config: ServerConfig): Promise<{ server: https.Server; port: number }> {
  const app = express();
  const port = parseInt(process.env.LOCAL_PORT || '8443');

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Pair with cloud
  app.post('/pair', async (req, res) => {
    try {
      const { pairingToken, agentName } = req.body;
      if (!pairingToken || !agentName) {
        return res.status(400).json({ error: 'pairingToken and agentName are required' });
      }

      const result = await config.pairingService.pair(pairingToken, agentName);
      if (result.success) {
        res.json({ success: true, agentId: result.agentId });
      } else {
        res.status(400).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get agent status
  app.get('/status', async (req, res) => {
    try {
      const pairingStatus = {
        isPaired: config.pairingService.isPaired(),
        agentId: config.pairingService.getAgentId(),
        agentName: config.pairingService.getAgentName(),
      };

      const deviceStatus = await config.cardEncoder.getStatus();
      const queueStatus = await config.queueManager.getStatus();

      res.json({
        pairing: pairingStatus,
        device: deviceStatus,
        queue: queueStatus,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Encode card (called by web app)
  app.post('/encode-card', async (req, res) => {
    try {
      const { cardIssueId, cardPayload, hotelId, roomId } = req.body;

      if (!cardIssueId || !cardPayload) {
        return res.status(400).json({ error: 'cardIssueId and cardPayload are required' });
      }

      // Encode the card
      const result = await config.cardEncoder.encodeCard(cardPayload);

      if (result.success) {
        // Update cloud API
        await config.cloudApi.updateCardIssueStatus(cardIssueId, 'done', {
          cardUID: result.cardUID,
          encodedAt: new Date().toISOString(),
        });

        res.json({ success: true, cardUID: result.cardUID });
      } else {
        // Update cloud API with error
        await config.cloudApi.updateCardIssueStatus(cardIssueId, 'failed', {
          error: result.error,
        });

        res.status(500).json({ success: false, error: result.error });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get queue status
  app.get('/queue', async (req, res) => {
    try {
      const status = await config.queueManager.getStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Replay queued jobs
  app.post('/queue/replay', async (req, res) => {
    try {
      const result = await config.queueManager.replayQueue(config.cloudApi, config.cardEncoder);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate self-signed certificate if needed
  const { app: electronApp } = require('electron');
  const certPath = path.join(electronApp.getPath('userData'), 'cert.pem');
  const keyPath = path.join(electronApp.getPath('userData'), 'key.pem');

  let cert: Buffer;
  let key: Buffer;

  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    cert = fs.readFileSync(certPath);
    key = fs.readFileSync(keyPath);
  } else {
    const attrs = [{ name: 'commonName', value: 'localhost' }];
    const pems = selfsigned.generate(attrs, {
      keySize: 2048,
      days: 365,
      algorithm: 'sha256',
    });
    fs.writeFileSync(certPath, pems.cert);
    fs.writeFileSync(keyPath, pems.private);
    cert = Buffer.from(pems.cert);
    key = Buffer.from(pems.private);
  }

  // Create HTTPS server
  const server = https.createServer({ cert, key }, app);

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`✅ HTTPS server running on https://localhost:${port}`);
      resolve({ server, port });
    });
  });
}

