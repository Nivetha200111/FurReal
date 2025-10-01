import { Queue, Worker, QueueScheduler, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');

export const analysisQueueName = 'analysis-queue';
export const analysisQueue = new Queue(analysisQueueName, { connection });
new QueueScheduler(analysisQueueName, { connection });

export interface AnalysisJobData {
  postUrl?: string;
  reelId?: string;
  postId?: string;
}

export const analysisWorker = new Worker<AnalysisJobData>(
  analysisQueueName,
  async (job) => {
    // TODO: integrate scraping, download, frame extract, detection
    return { status: 'ok', input: job.data };
  },
  { connection }
);

export async function enqueueAnalysis(data: AnalysisJobData, opts?: JobsOptions) {
  return analysisQueue.add('analyze', data, opts);
}
