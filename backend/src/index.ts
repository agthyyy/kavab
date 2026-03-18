import { env } from './config/env';
import app from './app';
import db from './config/database';
import { startCronJobs } from './jobs/cronJobs';

async function main() {
  // Verify DB connection
  await db.raw('SELECT 1');
  console.log('✅ Database connected');

  // Start cron jobs
  startCronJobs();

  app.listen(env.port, () => {
    console.log(`🚀 Server running on port ${env.port} [${env.nodeEnv}]`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
