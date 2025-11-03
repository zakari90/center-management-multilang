import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../../lib/db';
import { requireAuth, requireRole } from '../middleware/auth';
import { getSession, setSession } from '../../lib/authentication';

export const managerRoutes = Router();

// Manager login
managerRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || user.role !== 'MANAGER') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    setSession(res, { user: { id: user.id, email: user.email, name: user.name, role: user.role } });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error: any) {
    console.error('[MANAGER_LOGIN_ERROR]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Manager register
managerRoutes.post('/register', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'MANAGER',
      },
    });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error: any) {
    console.error('[MANAGER_REGISTER_ERROR]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all managers (admin only)
managerRoutes.get('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const managers = await db.user.findMany({
      where: { role: 'MANAGER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        role: true,
      },
    });

    res.json(managers);
  } catch (error: any) {
    console.error('[GET_MANAGERS]', error);
    res.status(500).json({ error: 'Failed to fetch managers' });
  }
});

