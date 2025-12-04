/**
 * Mock Queue Manager (for testing without SQLite)
 * Uses JSON file instead of SQLite
 */
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import type { CloudApiClient } from './cloudApi';

interface QueueJob {
  id: number;
  type: string;
  data: any;
  retries: number;
  createdAt: string;
  lastAttempt?: string;
}

export class QueueManager {
  private queuePath: string;
  private jobs: QueueJob[] = [];
  private nextId: number = 1;

  constructor() {
    this.queuePath = path.join(app.getPath('userData'), 'queue.json');
  }

  async initialize() {
    try {
      if (fs.existsSync(this.queuePath)) {
        const data = fs.readFileSync(this.queuePath, 'utf-8');
        this.jobs = JSON.parse(data);
        if (this.jobs.length > 0) {
          this.nextId = Math.max(...this.jobs.map(j => j.id)) + 1;
        }
      }
      console.log('✅ Queue manager initialized (JSON file)');
    } catch (error) {
      console.error('Error initializing queue:', error);
      this.jobs = [];
    }
  }

  private save() {
    try {
      fs.writeFileSync(this.queuePath, JSON.stringify(this.jobs, null, 2));
    } catch (error) {
      console.error('Error saving queue:', error);
    }
  }

  async addJob(job: { type: string; data: any; retries?: number }) {
    const newJob: QueueJob = {
      id: this.nextId++,
      type: job.type,
      data: job.data,
      retries: job.retries || 0,
      createdAt: new Date().toISOString(),
    };
    this.jobs.push(newJob);
    this.save();
  }

  async getJobs(): Promise<QueueJob[]> {
    return [...this.jobs];
  }

  async removeJob(jobId: number) {
    this.jobs = this.jobs.filter(j => j.id !== jobId);
    this.save();
  }

  async incrementRetries(jobId: number) {
    const job = this.jobs.find(j => j.id === jobId);
    if (job) {
      job.retries++;
      job.lastAttempt = new Date().toISOString();
      this.save();
    }
  }

  async getQueueLength(): Promise<number> {
    return this.jobs.length;
  }

  async getStatus() {
    return {
      length: this.jobs.length,
      jobs: this.jobs.slice(0, 10),
    };
  }

  async replayQueue(cloudApi: CloudApiClient) {
    const jobs = [...this.jobs];
    let successCount = 0;
    let failCount = 0;

    for (const job of jobs) {
      try {
        if (job.type === 'card_issue') {
          // Process card issue
          await this.removeJob(job.id);
          successCount++;
        }
      } catch (error) {
        console.error(`Error replaying job ${job.id}:`, error);
        await this.incrementRetries(job.id);
        
        // Remove if too many retries
        if (job.retries >= 5) {
          await this.removeJob(job.id);
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
    this.save();
  }
}




