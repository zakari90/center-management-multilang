import { Router } from 'express';
import db from '../../lib/db';
import { requireAuth } from '../middleware/auth';

export const receiptRoutes = Router();

receiptRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const receipts = await db.receipt.findMany({
      where: { managerId: user.id },
      include: {
        student: true,
        teacher: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(receipts);
  } catch (error: any) {
    console.error('[GET_RECEIPTS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

receiptRoutes.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const data = req.body;
    const receipt = await db.receipt.create({
      data: {
        ...data,
        managerId: user.id,
      },
    });
    res.status(201).json(receipt);
  } catch (error: any) {
    console.error('[POST_RECEIPTS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

