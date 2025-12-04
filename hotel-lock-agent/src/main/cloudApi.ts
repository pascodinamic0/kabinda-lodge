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

      const req = httpModule.request(requestOptions, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
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

      req.on('error', reject);

      if (options.body) {
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }

      req.end();
    });
  }

  async confirmPairing(pairingToken: string, agentName: string) {
    return this.request('/api/pairing/confirm', {
      method: 'POST',
      body: JSON.stringify({
        pairingToken,
        agentName,
        deviceInfo: {
          platform: process.platform,
          arch: process.arch,
          version: process.versions.electron,
        },
      }),
    });
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

