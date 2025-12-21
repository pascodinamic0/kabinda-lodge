// @ts-nocheck
/**
 * Pairing Service
 * Handles pairing with cloud API using pairing tokens
 */
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { CloudApiClient } from './cloudApi';
import type { QueueManager } from './queue';

interface PairingResult {
  success: boolean;
  agentId?: string;
  error?: string;
}

export class PairingService {
  private agentId: string | undefined = undefined;
  private agentName: string | undefined = undefined;
  private agentToken: string | undefined = undefined;
  private configPath: string;

  constructor(
    private cloudApi: CloudApiClient,
    private queueManager: QueueManager
  ) {
    this.configPath = path.join(app.getPath('userData'), 'agent-config.json');
    this.loadConfig();
  }

  private loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        this.agentId = config.agentId || undefined;
        this.agentName = config.agentName || undefined;
        this.agentToken = config.agentToken || undefined;
      }
    } catch (error) {
      console.error('Error loading agent config:', error);
    }
  }

  private saveConfig() {
    try {
      const config = {
        agentId: this.agentId,
        agentName: this.agentName,
        agentToken: this.agentToken,
        pairedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Error saving agent config:', error);
    }
  }

  async pair(pairingToken: string, agentName: string): Promise<PairingResult> {
    try {
      console.log(`Attempting to pair agent: ${agentName} with token: ${pairingToken}`);
      
      const result = await this.cloudApi.confirmPairing(pairingToken, agentName);
      console.log('Pairing API response:', result);

      // Handle both formats: direct object or nested result
      const data = result.agentId ? result : (result.result || result);

      if (data.agentId && data.agentToken) {
        this.agentId = data.agentId;
        this.agentName = agentName;
        this.agentToken = data.agentToken;
        this.saveConfig();

        // Set agent token for future API calls
        if (data.agentToken) {
          this.cloudApi.setAgentToken(data.agentToken);
        }

        // Start heartbeat
        this.startHeartbeat();

        return { success: true, agentId: this.agentId };
      } else {
        console.error('Pairing failed: Invalid response format', data);
        return { success: false, error: data.error || 'Pairing failed - Invalid response' };
      }
    } catch (error: any) {
      console.error('Pairing error:', error);
      return { success: false, error: error.message || 'Unknown pairing error' };
    }
  }

  isPaired(): boolean {
    return !!this.agentId && !!this.agentToken;
  }

  getAgentId(): string | undefined {
    return this.agentId;
  }

  getAgentName(): string | undefined {
    return this.agentName;
  }

  getAgentToken(): string | undefined {
    return this.agentToken;
  }

  private startHeartbeat() {
    setInterval(async () => {
      if (!this.isPaired()) return;

      try {
        const agentId = this.agentId;
        if (agentId) {
          await this.cloudApi.updateAgentStatus(agentId, {
            lastSeen: new Date().toISOString(),
            status: 'online',
            queueLength: await this.queueManager.getQueueLength(),
          });
        }
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, 30000); // Every 30 seconds
  }
}

