import { db } from './db';
import logger from './logger';

export async function logAuditEvent(params: {
  userId: string;
  action: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await db.execute({
      sql: `INSERT INTO audit_logs (id, userId, action, details, ipAddress, userAgent, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        crypto.randomUUID(),
        params.userId,
        params.action,
        params.details || null,
        params.ipAddress || null,
        params.userAgent || null,
      ],
    });
  } catch (error) {
    logger.error('Failed to log audit event:', error);
  }
}
