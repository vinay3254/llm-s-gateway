import { RequestLog, ReviewRecord } from '../types.js';

class LogStore {
  private logs: RequestLog[] = [];
  private reviews: ReviewRecord[] = [];
  private maxLogs: number = 500;
  private maxReviews: number = 200;

  addLog(log: RequestLog) {
    this.logs.unshift(log);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }
  }

  getLogs(limit = 100, filter?: { model?: string; status?: 'success' | 'error' }): RequestLog[] {
    let result = this.logs;
    if (filter?.model) {
      result = result.filter(l => l.model === filter.model);
    }
    if (filter?.status) {
      result = result.filter(l => l.status === filter.status);
    }
    return result.slice(0, limit);
  }

  addReview(review: ReviewRecord) {
    this.reviews.unshift(review);
    if (this.reviews.length > this.maxReviews) {
      this.reviews.pop();
    }
  }

  getReviews(limit = 50): ReviewRecord[] {
    return this.reviews.slice(0, limit);
  }

  getStats() {
    const totalRequests = this.logs.length;
    const successfulRequests = this.logs.filter(l => l.status === 'success').length;
    const errorRequests = this.logs.filter(l => l.status === 'error').length;
    const avgLatency = totalRequests > 0
      ? Math.round(this.logs.reduce((acc, l) => acc + l.latencyMs, 0) / totalRequests)
      : 0;
    const totalTokens = this.logs.reduce((acc, l) => acc + (l.tokens?.total || 0), 0);

    return {
      totalRequests,
      successfulRequests,
      errorRequests,
      avgLatencyMs: avgLatency,
      totalTokens,
      totalReviews: this.reviews.length,
    };
  }

  clear() {
    this.logs = [];
    this.reviews = [];
  }
}

export const logStore = new LogStore();
