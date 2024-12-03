import { Router } from 'express';
import { getDatabase } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';
import { generateUUID } from '../utils/helpers.js';
import { createOperationsHeroTicket } from '../services/operations-hero.js';
import logger from '../utils/logger.js';

const router = Router();
const db = getDatabase();

// Get repair tickets
router.get('/', authMiddleware, (req, res) => {
  const {
    startDate,
    endDate,
    deviceBarcode,
    fullName,
    issueType,
    schoolId,
    isStaff,
    status
  } = req.query;

  try {
    let query = 'SELECT * FROM repair_tickets WHERE 1=1';
    const params = [];

    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }
    if (deviceBarcode) {
      query += ' AND device_barcode LIKE ?';
      params.push(`%${deviceBarcode}%`);
    }
    if (fullName) {
      query += ' AND full_name LIKE ?';
      params.push(`%${fullName}%`);
    }
    if (issueType) {
      query += ' AND issue_type = ?';
      params.push(issueType);
    }
    if (schoolId) {
      query += ' AND school_id = ?';
      params.push(schoolId);
    }
    if (isStaff !== undefined) {
      query += ' AND is_staff = ?';
      params.push(isStaff === 'true');
    }
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const tickets = db.prepare(query).all(...params);
    res.json(tickets);
  } catch (error) {
    logger.error('Error fetching repair tickets:', error);
    res.status(500).json({ error: 'Failed to fetch repair tickets' });
  }
});

// Create repair ticket
router.post('/', authMiddleware, async (req, res) => {
  const {
    schoolId,
    deviceType,
    fullName,
    issueType,
    deviceBarcode,
    notes,
    isStaff
  } = req.body;

  try {
    // Create Operations Hero ticket
    const operationsHeroResponse = await createOperationsHeroTicket({
      schoolId,
      deviceType,
      fullName,
      issueType,
      deviceBarcode,
      notes,
      isStaff
    });

    // Save ticket in local database
    const result = db.prepare(`
      INSERT INTO repair_tickets (
        id, school_id, device_type, full_name, issue_type,
        device_barcode, notes, is_staff, operations_hero_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      generateUUID(),
      schoolId,
      deviceType,
      fullName,
      issueType,
      deviceBarcode,
      notes,
      isStaff,
      operationsHeroResponse.id
    );

    res.status(201).json({
      id: result.lastInsertRowid,
      operationsHeroId: operationsHeroResponse.id
    });
  } catch (error) {
    logger.error('Error creating repair ticket:', error);
    res.status(500).json({ error: 'Failed to create repair ticket' });
  }
});

export const repairRoutes = router;
