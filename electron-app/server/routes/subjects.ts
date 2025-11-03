import { Router } from 'express';
import db from '../../lib/db';
import { requireAuth } from '../middleware/auth';

export const subjectRoutes = Router();

subjectRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const includeTeachers = req.query.includeTeachers === 'true';
    const subjects = await db.subject.findMany({
      include: includeTeachers
        ? {
            teacherSubjects: {
              include: { teacher: true },
            },
          }
        : undefined,
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    });
    res.json(subjects);
  } catch (error: any) {
    console.error('[GET_SUBJECTS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

subjectRoutes.post('/', requireAuth, async (req, res) => {
  try {
    const { name, grade, price, duration, centerId } = req.body;
    if (!name || !grade || !price || !centerId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const subject = await db.subject.create({
      data: {
        name,
        grade,
        price,
        duration: duration || null,
        centerId,
      },
    });
    res.status(201).json(subject);
  } catch (error: any) {
    console.error('[POST_SUBJECTS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

