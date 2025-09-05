import { Queue } from 'bullmq';

const connection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined
};

export const codeQueue = new Queue('code-exec', { connection });

export default codeQueue;


