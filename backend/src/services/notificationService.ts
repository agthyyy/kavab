import db from '../config/database';
import { getMessaging } from '../config/firebase';

/**
 * Upsert an FCM token for the authenticated user.
 * Uses INSERT ... ON CONFLICT (user_id) DO UPDATE to keep only the latest token.
 */
export async function saveToken(userId: string, token: string): Promise<void> {
  await db('fcm_tokens')
    .insert({ user_id: userId, token, updated_at: db.fn.now() })
    .onConflict('user_id')
    .merge({ token, updated_at: db.fn.now() });
}

/**
 * Send an FCM push notification to a user.
 * Looks up the user's FCM token; if none exists, silently skips.
 * If FCM send fails, logs the error but does NOT throw.
 */
export async function sendNotificationToUser(
  userId: string,
  title: string,
  body: string
): Promise<void> {
  const row = await db('fcm_tokens').where({ user_id: userId }).first();
  if (!row) return;

  const token = row.token as string;

  try {
    const messaging = getMessaging();
    await messaging.send({ token, notification: { title, body } });
  } catch (err) {
    console.error(`[FCM] Failed to send notification to user ${userId}:`, err);
  }
}
