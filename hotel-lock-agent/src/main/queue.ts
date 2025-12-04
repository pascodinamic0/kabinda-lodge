/**
 * Queue Manager
 * SQLite-based queue for offline job processing
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Database = require('better-sqlite3');
import * as path from 'path';
import { app } from 'electron';
import type { CloudApiClient } from './cloudApi';
import type { CardEncoder } from './encoder';

interface QueueJob {
  id: number;
  type: string;
  data: any;
  retries: number;
  createdAt: string;
  lastAttempt?: string;
}

export class QueueManager {
  private db: any = null;
  private dbPath: string;

  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'queue.db');
  }

  async initialize() {
    this.db = new Database(this.dbPath);
    
    // Create jobs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        retries INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        lastAttempt TEXT
      )
    `);

    console.log('✅ Queue manager initialized');
  }

  async addJob(job: { type: string; data: any; retries?: number }) {
    if (!this.db) throw new Error('Queue not initialized');

    const stmt = this.db.prepare(`
      INSERT INTO jobs (type, data, retries, createdAt)
      VALUES (?, ?, ?, ?)
    `);

    stmt.run(
      job.type,
      JSON.stringify(job.data),
      job.retries || 0,
      new Date().toISOString()
    );
  }

  async getJobs(): Promise<QueueJob[]> {
    if (!this.db) throw new Error('Queue not initialized');

    const stmt = this.db.prepare('SELECT * FROM jobs ORDER BY createdAt ASC');
    const rows = stmt.all() as any[];

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      data: JSON.parse(row.data),
      retries: row.retries,
      createdAt: row.createdAt,
      lastAttempt: row.lastAttempt,
    }));
  }

  async removeJob(jobId: number) {
    if (!this.db) throw new Error('Queue not initialized');

    const stmt = this.db.prepare('DELETE FROM jobs WHERE id = ?');
    stmt.run(jobId);
  }

  async incrementRetries(jobId: number) {
    if (!this.db) throw new Error('Queue not initialized');

    const stmt = this.db.prepare(`
      UPDATE jobs 
      SET retries = retries + 1, lastAttempt = ?
      WHERE id = ?
    `);
    stmt.run(new Date().toISOString(), jobId);
  }

  async getQueueLength(): Promise<number> {
    if (!this.db) return 0;

    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM jobs');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  async getStatus() {
    const jobs = await this.getJobs();
    return {
      length: jobs.length,
      jobs: jobs.slice(0, 10), // Return first 10 jobs
    };
  }

  async replayQueue(cloudApi: CloudApiClient, cardEncoder: CardEncoder) {
    const jobs = await this.getJobs();
    let successCount = 0;
    let failCount = 0;

    for (const job of jobs) {
      try {
        if (job.type === 'card_issue') {
          console.log(`Replaying job ${job.id}:`, job.data.id);
          
          // 1. Update status to processing
          try {
            await cloudApi.updateCardIssueStatus(job.data.id, 'processing');
          } catch (e) {
            console.warn('Failed to update status to processing, continuing anyway', e);
          }

          // 2. Encode card
          const result = await cardEncoder.encodeCard(job.data.card_payload);

          if (result.success) {
            // 3. Update status to done
            await cloudApi.updateCardIssueStatus(job.data.id, 'done', {
              cardUID: result.cardUID,
              encodedAt: new Date().toISOString(),
            });

            // 4. Log success
            // We need agentId, but it's not passed here. 
            // Ideally we'd get it from PairingService or store it in the job.
            // For now, we'll skip the device log or try to get it if we can refactor.
            // The critical part is the card issue status.
            
            await this.removeJob(job.id);
            successCount++;
          } else {
            // Failed to encode
            console.error(`Failed to encode card for job ${job.id}:`, result.error);
            throw new Error(result.error || 'Encoding failed');
          }
        } else {
          // Unknown job type, remove it
          console.warn(`Unknown job type ${job.type}, removing`);
          await this.removeJob(job.id);
        }
      } catch (error: any) {
        console.error(`Error replaying job ${job.id}:`, error);
        await this.incrementRetries(job.id);
        
        // Remove if too many retries
        if (job.retries >= 5) {
          console.error(`Job ${job.id} failed too many times, removing`);
          await this.removeJob(job.id);
          
          // Try to update status to failed in cloud if possible
          if (job.type === 'card_issue') {
             try {
               await cloudApi.updateCardIssueStatus(job.data.id, 'failed', {
                 error: error.message || 'Max retries exceeded'
               });
             } catch (e) { /* ignore */ }
          }
        }
        failCount++;
      }
    }

    return {
      success: successCount,
      failed: failCount,
      total: jobs.length,
    };
  }

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

