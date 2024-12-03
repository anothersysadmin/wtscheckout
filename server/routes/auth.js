import { Router } from 'express';
import { getDatabase } from '../database.js';
import { loginLimiter } from '../middleware/rate-limiter.js';
import { validatePassword } from '../utils/helpers.js';
import logger from '../utils/logger.js';

const router = Router();
const db = getDatabase();

// Login route
router.post('/login', loginLimiter, (req, res) => {
  const { username, password } = req.body;

  // For development, use environment variables for credentials
  const adminPassword = process.env.VITE_ADMIN_PASSWORD || "where'dtheyallgo?";
  const checkoutPassword = process.env.VITE_CHECKOUT_PASSWORD || 'chromebooks@51';

  try {
    if (username === 'admin' && password === adminPassword) {
      res.json({
        username: 'admin',
        isAdmin: true,
        lastLogin: new Date().toISOString()
      });
    } else if (username === 'checkout' && password === checkoutPassword) {
      res.json({
        username: 'checkout',
        isAdmin: false,
        lastLogin: new Date().toISOString()
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

export const authRoutes = router;
