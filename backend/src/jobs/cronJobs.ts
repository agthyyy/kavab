import cron from 'node-cron';
import db from '../config/database';
import { getMessaging } from '../config/firebase';

/**
 * Job 1: Daily at midnight — reset streaks for users who missed a day.
 * Only updates users who had streak > 0 to avoid unnecessary writes.
 */
async function resetStreaks(): Promise<void> {
  try {
    const updated = await db('user_progress')
      .where('streak', '>', 0)
      .where(function () {
        this.whereNull('last_activity_date').orWhere('last_activity_date', '<', db.raw('CURRENT_DATE'));
      })
      .update({ streak: 0 });

    console.log(`[CronJob] Streak reset: ${updated} users affected`);
  } catch (err) {
    console.error('[CronJob] Error resetting streaks:', err);
  }
}

/**
 * Job 2: Daily at 21:00 — send FCM reminders to users who haven't been active today.
 */
async function sendReminders(): Promise<void> {
  try {
    // Select users with fcm_tokens where last_activity_date < today or null
    const usersToNotify = await db('fcm_tokens')
      .join('user_progress', 'fcm_tokens.user_id', 'user_progress.user_id')
      .where(function () {
        this.whereNull('user_progress.last_activity_date').orWhere(
          'user_progress.last_activity_date',
          '<',
          db.raw('CURRENT_DATE')
        );
      })
      .select('fcm_tokens.user_id', 'fcm_tokens.token');

    if (usersToNotify.length === 0) {
      console.log('[CronJob] No users to remind');
      return;
    }

    const messaging = getMessaging();
    let sent = 0;
    let failed = 0;

    for (const user of usersToNotify) {
      try {
        await messaging.send({
          token: user['token'] as string,
          notification: {
            title: "Don't break your streak!",
            body: "You haven't studied today. Keep your streak going!",
          },
        });
        sent++;
      } catch (err) {
        failed++;
        console.error(`[CronJob] Failed to send reminder to user ${user['user_id'] as string}:`, err);
      }
    }

    console.log(`[CronJob] Reminders sent: ${sent}, failed: ${failed}`);
  } catch (err) {
    console.error('[CronJob] Error sending reminders:', err);
  }
}

/**
 * Register and start all cron jobs.
 */
export function startCronJobs(): void {
  // Job 1: Daily at midnight — reset streaks
  cron.schedule('0 0 * * *', () => {
    void resetStreaks();
  });

  // Job 2: Daily at 21:00 — send FCM reminders
  cron.schedule('0 21 * * *', () => {
    void sendReminders();
  });

  console.log('[CronJobs] Scheduled: streak reset (00:00), reminders (21:00)');
}

// Export for testing
export { resetStreaks, sendReminders };
