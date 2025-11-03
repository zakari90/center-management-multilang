import { Router } from 'express';
import db from '../../lib/db';
import { requireAuth, requireRole } from '../middleware/auth';

export const centerRoutes = Router();

centerRoutes.post('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { name, address, phone, classrooms, workingDays, subjects } = req.body;
    const user = (req as any).user;

    if (!name || !Array.isArray(classrooms) || !Array.isArray(workingDays)) {
      return res.status(400).json({ error: 'Missing or invalid fields' });
    }

    const center = await db.center.create({
      data: {
        name,
        address: address || null,
        phone: phone || null,
        classrooms,
        workingDays,
        adminId: user.id,
        subjects: {
          create: subjects?.map((subject: any) => ({
            name: subject.name,
            grade: subject.grade,
            price: subject.price,
            duration: subject.duration || null,
          })) || [],
        },
      },
      include: { subjects: true },
    });

    res.status(201).json(center);
  } catch (error: any) {
    console.error('[CENTER_POST]', error);
    res.status(500).json({ error: 'Failed to create center' });
  }
});

centerRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const centers = await db.center.findMany({
      where: { adminId: user.id },
      include: { subjects: true },
    });
    res.json(centers);
  } catch (error: any) {
    console.error('[CENTER_GET]', error);
    res.status(500).json({ error: 'Failed to get centers' });
  }
});

centerRoutes.patch('/', requireAuth, requireRole('ADMIN'), async (req, res) => {
  try {
    const { centerId, name, address, phone, classrooms, workingDays } = req.body;
    if (!centerId) {
      return res.status(400).json({ error: 'Center ID is required' });
    }
    const center = await db.center.update({
      where: { id: centerId },
      data: {
        ...(name && { name }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(classrooms && { classrooms }),
        ...(workingDays && { workingDays }),
      },
    });
    res.json(center);
  } catch (error: any) {
    console.error('[CENTER_PATCH]', error);
    res.status(500).json({ error: 'Failed to update center' });
  }
});

