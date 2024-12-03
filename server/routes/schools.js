import { Router } from 'express';
import { getDatabase } from '../database.js';
import { authMiddleware } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = Router();
const db = getDatabase();

// Get all schools
router.get('/', authMiddleware, (req, res) => {
  try {
    const schools = db.prepare('SELECT * FROM schools ORDER BY name').all();
    res.json(schools);
  } catch (error) {
    logger.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Failed to fetch schools' });
  }
});

// Update school settings
router.patch('/:id', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { name, allowNewDevices, logoUrl, address, contact } = req.body;

  try {
    const result = db.prepare(`
      UPDATE schools 
      SET name = ?,
          allow_new_devices = ?,
          logo_url = ?,
          address = ?,
          contact = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, allowNewDevices, logoUrl, address, contact, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error updating school:', error);
    res.status(500).json({ error: 'Failed to update school' });
  }
});

// Upload school logo
router.post('/:id/logo', authMiddleware, (req, res) => {
  const { id } = req.params;
  const { logoUrl } = req.body;

  try {
    const result = db.prepare(`
      UPDATE schools 
      SET logo_url = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(logoUrl, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error uploading school logo:', error);
    res.status(500).json({ error: 'Failed to upload school logo' });
  }
});

export const schoolRoutes = router;
