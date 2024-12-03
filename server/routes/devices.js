import { Router } from 'express';
import { getDatabase } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateUUID } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const router = Router();
const db = getDatabase();

// Get all devices for a school
router.get('/:schoolId', authMiddleware, (req, res) => {
  try {
    const devices = db.prepare(`
      SELECT * FROM devices 
      WHERE school_id = ? 
      ORDER BY created_at DESC
    `).all(req.params.schoolId);

    res.json(devices);
  } catch (error) {
    logger.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Add new device
router.post('/', authMiddleware, (req, res) => {
  const { assetTag, model, schoolId, serial } = req.body;

  try {
    // Check if device already exists
    const existing = db.prepare('SELECT id FROM devices WHERE asset_tag = ?')
      .get(assetTag);

    if (existing) {
      return res.status(400).json({ error: 'Device already exists' });
    }

    const result = db.prepare(`
      INSERT INTO devices (id, asset_tag, serial, model, school_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(generateUUID(), assetTag, serial || null, model, schoolId);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (error) {
    logger.error('Error adding device:', error);
    res.status(500).json({ error: 'Failed to add device' });
  }
});

// Check out device
router.post('/:assetTag/checkout', authMiddleware, (req, res) => {
  const { userName, reason, homeroomTeacher } = req.body;
  const { assetTag } = req.params;

  try {
    const device = db.prepare('SELECT * FROM devices WHERE asset_tag = ?')
      .get(assetTag);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (device.status === 'checked_out') {
      return res.status(400).json({ error: 'Device is already checked out' });
    }

    db.transaction(() => {
      // Update device status
      db.prepare(`
        UPDATE devices 
        SET status = 'checked_out',
            assigned_to_name = ?,
            assigned_timestamp = CURRENT_TIMESTAMP,
            assigned_reason = ?,
            homeroom_teacher = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE asset_tag = ?
      `).run(userName, reason, homeroomTeacher, assetTag);

      // Create log entry
      db.prepare(`
        INSERT INTO device_logs (
          id, device_id, asset_tag, action, user_name, 
          reason, homeroom_teacher, school_id
        )
        VALUES (?, ?, ?, 'checkout', ?, ?, ?, ?)
      `).run(
        generateUUID(),
        device.id,
        assetTag,
        userName,
        reason,
        homeroomTeacher,
        device.school_id
      );
    })();

    res.json({ success: true });
  } catch (error) {
    logger.error('Error checking out device:', error);
    res.status(500).json({ error: 'Failed to check out device' });
  }
});

// Check in device
router.post('/:assetTag/checkin', authMiddleware, (req, res) => {
  const { assetTag } = req.params;

  try {
    const device = db.prepare('SELECT * FROM devices WHERE asset_tag = ?')
      .get(assetTag);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (device.status === 'available') {
      return res.status(400).json({ error: 'Device is already checked in' });
    }

    db.transaction(() => {
      // Update device status
      db.prepare(`
        UPDATE devices 
        SET status = 'available',
            assigned_to_name = NULL,
            assigned_timestamp = NULL,
            assigned_reason = NULL,
            homeroom_teacher = NULL,
            updated_at = CURRENT_TIMESTAMP
        WHERE asset_tag = ?
      `).run(assetTag);

      // Create log entry
      db.prepare(`
        INSERT INTO device_logs (
          id, device_id, asset_tag, action, user_name, school_id
        )
        VALUES (?, ?, ?, 'checkin', ?, ?)
      `).run(
        generateUUID(),
        device.id,
        assetTag,
        device.assigned_to_name || 'Unknown',
        device.school_id
      );
    })();

    res.json({ success: true });
  } catch (error) {
    logger.error('Error checking in device:', error);
    res.status(500).json({ error: 'Failed to check in device' });
  }
});

// Delete device
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM devices WHERE id = ?')
      .run(req.params.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error deleting device:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
});

export const deviceRoutes = router;
