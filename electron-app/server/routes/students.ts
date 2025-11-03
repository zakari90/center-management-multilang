import { Router } from 'express';
import db from '../../lib/db';
import { requireAuth } from '../middleware/auth';

export const studentRoutes = Router();

studentRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const students = await db.student.findMany({
      where: { managerId: user.id },
      include: {
        studentSubjects: {
          include: { subject: true, teacher: true },
        },
        _count: { select: { receipts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(students);
  } catch (error: any) {
    console.error('[GET_STUDENTS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

studentRoutes.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const { name, email, phone, parentName, parentPhone, parentEmail, grade, enrollments } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (email) {
      const existing = await db.student.findUnique({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const student = await db.$transaction(async (tx: any) => {
      const newStudent = await tx.student.create({
        data: {
          name,
          email: email || null,
          phone: phone || null,
          parentName: parentName || null,
          parentPhone: parentPhone || null,
          parentEmail: parentEmail || null,
          grade: grade || null,
          managerId: user.id,
        },
      });

      if (enrollments?.length > 0) {
        await tx.studentSubject.createMany({
          data: enrollments.map((e: any) => ({
            studentId: newStudent.id,
            subjectId: e.subjectId,
            teacherId: e.teacherId,
          })),
        });
      }

      return tx.student.findUnique({
        where: { id: newStudent.id },
        include: {
          studentSubjects: {
            include: { subject: true, teacher: true },
          },
        },
      });
    });

    res.status(201).json(student);
  } catch (error: any) {
    console.error('[POST_STUDENTS]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

studentRoutes.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const student = await db.student.findUnique({
      where: { id },
      include: {
        studentSubjects: { include: { subject: true, teacher: true } },
        receipts: true,
      },
    });
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (error: any) {
    console.error('[GET_STUDENT]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

studentRoutes.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const student = await db.student.update({
      where: { id },
      data,
    });
    res.json(student);
  } catch (error: any) {
    console.error('[PUT_STUDENT]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

studentRoutes.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.student.delete({ where: { id } });
    res.json({ success: true });
  } catch (error: any) {
    console.error('[DELETE_STUDENT]', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

