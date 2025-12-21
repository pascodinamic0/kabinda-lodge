/**
 * Cloud API Client
 * Handles communication with the cloud API
 */
import * as https from 'https';
import * as http from 'http';

export class CloudApiClient {
  private baseUrl: string;
  private agentToken: string | undefined = undefined;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  setAgentToken(token: string | undefined) {
    this.agentToken = token;
  }

  private async request(endpoint: string, options: any = {}): Promise<any> {
    try {
      console.log(`[CloudAPI] Making request: ${options.method || 'GET'} ${this.baseUrl}${endpoint}`);
      
      const url = new URL(`${this.baseUrl}${endpoint}`);
      const isHttps = url.protocol === 'https:';
      const httpModule = isHttps ? https : http;

      const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.agentToken) {
        headers['Authorization'] = `Bearer ${this.agentToken}`;
      }

      return new Promise((resolve, reject) => {
        const requestOptions: any = {
          hostname: url.hostname,
          port: url.port || (isHttps ? 443 : 80),
          path: url.pathname + url.search,
          method: options.method || 'GET',
          headers,
        };

        // For HTTPS, reject unauthorized (self-signed certs)
        if (isHttps) {
          requestOptions.rejectUnauthorized = false;
        }

        console.log(`[CloudAPI] Request options:`, { hostname: requestOptions.hostname, port: requestOptions.port, method: requestOptions.method, path: requestOptions.path });

        const req = httpModule.request(requestOptions, (res) => {
          let data = '';

          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            console.log(`[CloudAPI] Response status: ${res.statusCode}`);
            console.log(`[CloudAPI] Response data:`, data.substring(0, 200));
            
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch {
                resolve(data);
              }
            } else {
              try {
                const error = JSON.parse(data);
                reject(new Error(error.error || `HTTP ${res.statusCode}`));
              } catch {
                reject(new Error(`HTTP ${res.statusCode}: ${data}`));
              }
            }
          });
        });

        req.on('error', (err) => {
          console.error(`[CloudAPI] Request error:`, err.message);
          reject(err);
        });

        if (options.body) {
          console.log(`[CloudAPI] Request body:`, options.body.substring(0, 200));
          req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }

        req.end();
      });
    } catch (error: any) {
      console.error(`[CloudAPI] Request exception:`, error.message);
      throw error;
    }
  }

  async confirmPairing(pairingToken: string, agentName: string) {
    try {
      console.log(`[CloudAPI] Confirming pairing for agent: ${agentName}`);
      console.log(`[CloudAPI] Base URL: ${this.baseUrl}`);
      console.log(`[CloudAPI] Token: ${pairingToken.substring(0, 8)}...`);
      
      const body = {
        pairingToken,
        agentName,
        fingerprint: `desktop-${Date.now()}`,
        deviceInfo: {
          platform: process.platform,
          arch: process.arch,
          version: process.versions.electron,
        },
      };
      
      console.log(`[CloudAPI] Sending body:`, body);
      const result = await this.request('/api/pairing/confirm', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      
      console.log(`[CloudAPI] Confirmation response:`, result);
      return result;
    } catch (error: any) {
      console.error(`[CloudAPI] Pairing error:`, error.message, error);
      throw error;
    }
  }

  async getPendingCardIssues(agentId: string) {
    const result = await this.request(`/api/card-issues?agent=${agentId}&status=pending`);
    return result.cardIssues || [];
  }

  async updateCardIssueStatus(
    cardIssueId: string,
    status: string,
    metadata?: any
  ) {
    return this.request(`/api/card-issues/${cardIssueId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, metadata }),
    });
  }

  async updateAgentStatus(agentId: string, status: any) {
    // This would be a custom endpoint or we use the log endpoint
    return this.request(`/api/agents/${agentId}/log`, {
      method: 'POST',
      body: JSON.stringify({
        type: 'status_update',
        data: status,
      }),
    });
  }

  async logDeviceEvent(agentId: string, event: any) {
    return this.request(`/api/agents/${agentId}/log`, {
      method: 'POST',
      body: JSON.stringify(event),
    });
  }
}

