import { Router } from 'express';
import db from '../../lib/db';
import { requireAuth } from '../middleware/auth';

export const dashboardRoutes = Router();

dashboardRoutes.get('/stats', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const [students, teachers, receipts] = await Promise.all([
      db.student.count({ where: { managerId: user.id } }),
      db.teacher.count({ where: { managerId: user.id } }),
      db.receipt.count({ where: { managerId: user.id } }),
    ]);
    res.json({ students, teachers, receipts });
  } catch (error: any) {
    console.error('[GET_STATS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

dashboardRoutes.get('/revenue', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const receipts = await db.receipt.findMany({
      where: { managerId: user.id },
      select: { amount: true, date: true },
    });
    res.json(receipts);
  } catch (error: any) {
    console.error('[GET_REVENUE]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

