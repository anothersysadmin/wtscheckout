import { db } from './db';
import { generateToken, verifyToken, hashPassword } from './security';
import logger from './logger';
import { loginLimiter } from './rate-limiter';
import { generateUUID } from './utils';

export type User = {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  lastLogin: string;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
};

export async function authenticateUser(username: string, password: string) {
  try {
    await loginLimiter.consume(username);

    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ? AND active = 1',
      args: [username],
    });

    const user = result.rows[0];
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const passwordHash = hashPassword(password);
    if (passwordHash !== user.password) {
      throw new Error('Invalid credentials');
    }

    // Generate session token
    const token = await generateToken(user.id, user.isAdmin);

    // Update last login
    await db.execute({
      sql: 'UPDATE users SET lastLogin = datetime("now") WHERE id = ?',
      args: [user.id],
    });

    // Create session
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + (user.isAdmin ? 30 : 20160)); // 30 mins for admin, 14 days for regular users

    await db.execute({
      sql: `INSERT INTO sessions (id, userId, token, expiresAt, createdAt)
            VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [generateUUID(), user.id, token, expiresAt.toISOString()],
    });

    logger.info(`User ${username} logged in successfully`);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.isAdmin,
      },
      token,
    };
  } catch (error) {
    logger.error('Authentication error:', error);
    throw error;
  }
}

export async function validateSession(token: string) {
  try {
    const payload = await verifyToken(token);
    if (!payload) return null;

    const result = await db.execute({
      sql: `SELECT s.*, u.* FROM sessions s
            JOIN users u ON s.userId = u.id
            WHERE s.token = ? AND s.expiresAt > datetime('now')
            AND u.active = 1`,
      args: [token],
    });

    if (!result.rows.length) return null;

    const session = result.rows[0];
    return {
      user: {
        id: session.userId,
        username: session.username,
        email: session.email,
        isAdmin: session.isAdmin,
      },
      token,
    };
  } catch (error) {
    logger.error('Session validation error:', error);
    return null;
  }
}

export async function createUser(userData: {
  username: string;
  email: string;
  password: string;
  isAdmin?: boolean;
}) {
  try {
    // Check if username or email already exists
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ? OR email = ?',
      args: [userData.username, userData.email],
    });

    if (existing.rows.length > 0) {
      throw new Error('Username or email already exists');
    }

    const userId = generateUUID();
    const passwordHash = hashPassword(userData.password);

    await db.execute({
      sql: `INSERT INTO users (id, username, email, password, isAdmin, active, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      args: [userId, userData.username, userData.email, passwordHash, userData.isAdmin || false],
    });

    logger.info(`New user created: ${userData.username}`);
    return { id: userId, username: userData.username, email: userData.email };
  } catch (error) {
    logger.error('User creation error:', error);
    throw error;
  }
}

export async function resetPassword(userId: string, newPassword: string) {
  try {
    const passwordHash = hashPassword(newPassword);
    await db.execute({
      sql: 'UPDATE users SET password = ?, updatedAt = datetime("now") WHERE id = ?',
      args: [passwordHash, userId],
    });

    // Invalidate all existing sessions for this user
    await db.execute({
      sql: 'DELETE FROM sessions WHERE userId = ?',
      args: [userId],
    });

    logger.info(`Password reset for user ${userId}`);
    return true;
  } catch (error) {
    logger.error('Password reset error:', error);
    throw error;
  }
}

export async function updateUserStatus(userId: string, active: boolean) {
  try {
    await db.execute({
      sql: 'UPDATE users SET active = ?, updatedAt = datetime("now") WHERE id = ?',
      args: [active ? 1 : 0, userId],
    });

    if (!active) {
      // Invalidate all sessions if deactivating
      await db.execute({
        sql: 'DELETE FROM sessions WHERE userId = ?',
        args: [userId],
      });
    }

    logger.info(`User ${userId} status updated to ${active}`);
    return true;
  } catch (error) {
    logger.error('User status update error:', error);
    throw error;
  }
}

export async function logout(token: string) {
  try {
    await db.execute({
      sql: 'DELETE FROM sessions WHERE token = ?',
      args: [token],
    });

    logger.info('User logged out successfully');
    return true;
  } catch (error) {
    logger.error('Logout error:', error);
    throw error;
  }
}
