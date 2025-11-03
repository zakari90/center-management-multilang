import { Router } from 'express';
import db from '../../lib/db';
import { requireAuth } from '../middleware/auth';

export const teacherRoutes = Router();

teacherRoutes.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, email, phone, address, weeklySchedule, subjects } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (email) {
      const existing = await db.teacher.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const scheduleArray = Array.isArray(weeklySchedule) ? weeklySchedule : [];

    const teacher = await db.$transaction(async (tx: any) => {
      const newTeacher = await tx.teacher.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          address: address || null,
          weeklySchedule: scheduleArray,
          managerId: user.id,
        },
      });

      if (subjects?.length > 0) {
        await tx.teacherSubject.createMany({
          data: subjects.map((s: any) => ({
            teacherId: newTeacher.id,
            subjectId: s.subjectId,
            percentage: s.percentage,
            hourlyRate: s.hourlyRate,
          })),
        });
      }

      return tx.teacher.findUnique({
        where: { id: newTeacher.id },
        include: {
          teacherSubjects: { include: { subject: true } },
        },
      });
    });

    res.status(201).json(teacher);
  } catch (error: any) {
    console.error('[POST_TEACHERS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

teacherRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const teachers = await db.teacher.findMany({
      where: { managerId: user.id },
      include: {
        teacherSubjects: { include: { subject: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(teachers);
  } catch (error: any) {
    console.error('[GET_TEACHERS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

teacherRoutes.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const teacher = await db.teacher.findUnique({
      where: { id },
      include: {
        teacherSubjects: { include: { subject: true } },
        schedules: true,
      },
    });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });
    res.json(teacher);
  } catch (error: any) {
    console.error('[GET_TEACHER]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

teacherRoutes.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const teacher = await db.teacher.update({
      where: { id },
      data,
    });
    res.json(teacher);
  } catch (error: any) {
    console.error('[PUT_TEACHER]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

teacherRoutes.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.teacher.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE_TEACHER]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

