import { Router } from 'express';
import db from '../../lib/db';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminRoutes = Router();

adminRoutes.get('/centers', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const user = (req as any).user;
    const centers = await db.center.findMany({
      where: { adminId: user.id },
      include: { subjects: true },
    });
    res.json(centers);
  } catch (error: any) {
    console.error('[GET_CENTERS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

adminRoutes.get('/users', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
    res.json(users);
  } catch (error: any) {
    console.error('[GET_USERS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

