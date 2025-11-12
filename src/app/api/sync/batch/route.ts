import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entities } = body;

    if (!entities || typeof entities !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request format. Expected { entities: {...} }' },
        { status: 400 }
      );
    }

    const results: Record<string, { success: number; failed: number; errors: string[] }> = {};

    // Batch sync users
    if (Array.isArray(entities.users)) {
      results.users = { success: 0, failed: 0, errors: [] };
      for (const user of entities.users) {
        try {
          await db.user.upsert({
            where: { id: user.id },
            update: {
              name: user.name,
              email: user.email,
              role: user.role,
              updatedAt: new Date(),
            },
            create: {
              id: user.id,
              name: user.name,
              email: user.email,
              password: user.password,
              role: user.role,
            },
          });
          results.users.success++;
        } catch (error) {
          results.users.failed++;
          results.users.errors.push(`User ${user.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Batch sync centers
    if (Array.isArray(entities.centers)) {
      results.centers = { success: 0, failed: 0, errors: [] };
      for (const center of entities.centers) {
        try {
          await db.center.upsert({
            where: { id: center.id },
            update: {
              name: center.name,
              address: center.address,
              phone: center.phone,
              classrooms: center.classrooms,
              workingDays: center.workingDays,
              managers: center.managers,
              updatedAt: new Date(),
            },
            create: {
              id: center.id,
              name: center.name,
              address: center.address,
              phone: center.phone,
              classrooms: center.classrooms,
              workingDays: center.workingDays,
              managers: center.managers,
              adminId: center.adminId,
            },
          });
          results.centers.success++;
        } catch (error) {
          results.centers.failed++;
          results.centers.errors.push(`Center ${center.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Batch sync teachers
    if (Array.isArray(entities.teachers)) {
      results.teachers = { success: 0, failed: 0, errors: [] };
      for (const teacher of entities.teachers) {
        try {
          await db.teacher.upsert({
            where: { id: teacher.id },
            update: {
              name: teacher.name,
              email: teacher.email,
              phone: teacher.phone,
              address: teacher.address,
              weeklySchedule: teacher.weeklySchedule,
              updatedAt: new Date(),
            },
            create: {
              id: teacher.id,
              name: teacher.name,
              email: teacher.email,
              phone: teacher.phone,
              address: teacher.address,
              weeklySchedule: teacher.weeklySchedule,
              managerId: teacher.managerId,
            },
          });
          results.teachers.success++;
        } catch (error) {
          results.teachers.failed++;
          results.teachers.errors.push(`Teacher ${teacher.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Batch sync students
    if (Array.isArray(entities.students)) {
      results.students = { success: 0, failed: 0, errors: [] };
      for (const student of entities.students) {
        try {
          await db.student.upsert({
            where: { id: student.id },
            update: {
              name: student.name,
              email: student.email,
              phone: student.phone,
              parentName: student.parentName,
              parentPhone: student.parentPhone,
              parentEmail: student.parentEmail,
              grade: student.grade,
              updatedAt: new Date(),
            },
            create: {
              id: student.id,
              name: student.name,
              email: student.email,
              phone: student.phone,
              parentName: student.parentName,
              parentPhone: student.parentPhone,
              parentEmail: student.parentEmail,
              grade: student.grade,
              managerId: student.managerId,
            },
          });
          results.students.success++;
        } catch (error) {
          results.students.failed++;
          results.students.errors.push(`Student ${student.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Batch sync subjects
    if (Array.isArray(entities.subjects)) {
      results.subjects = { success: 0, failed: 0, errors: [] };
      for (const subject of entities.subjects) {
        try {
          await db.subject.upsert({
            where: { id: subject.id },
            update: {
              name: subject.name,
              grade: subject.grade,
              price: subject.price,
              duration: subject.duration,
              updatedAt: new Date(),
            },
            create: {
              id: subject.id,
              name: subject.name,
              grade: subject.grade,
              price: subject.price,
              duration: subject.duration,
              centerId: subject.centerId,
            },
          });
          results.subjects.success++;
        } catch (error) {
          results.subjects.failed++;
          results.subjects.errors.push(`Subject ${subject.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Batch sync receipts
    if (Array.isArray(entities.receipts)) {
      results.receipts = { success: 0, failed: 0, errors: [] };
      for (const receipt of entities.receipts) {
        try {
          await db.receipt.upsert({
            where: { id: receipt.id },
            update: {
              amount: receipt.amount,
              type: receipt.type,
              description: receipt.description,
              paymentMethod: receipt.paymentMethod,
            },
            create: {
              id: receipt.id,
              receiptNumber: receipt.receiptNumber,
              amount: receipt.amount,
              type: receipt.type,
              description: receipt.description,
              paymentMethod: receipt.paymentMethod,
              date: receipt.date ? new Date(receipt.date) : new Date(),
              studentId: receipt.studentId,
              teacherId: receipt.teacherId,
              managerId: receipt.managerId,
            },
          });
          results.receipts.success++;
        } catch (error) {
          results.receipts.failed++;
          results.receipts.errors.push(`Receipt ${receipt.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    // Batch sync schedules
    if (Array.isArray(entities.schedules)) {
      results.schedules = { success: 0, failed: 0, errors: [] };
      for (const schedule of entities.schedules) {
        try {
          await db.schedule.upsert({
            where: { id: schedule.id },
            update: {
              day: schedule.day,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              roomId: schedule.roomId,
              updatedAt: new Date(),
            },
            create: {
              id: schedule.id,
              day: schedule.day,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              roomId: schedule.roomId,
              teacherId: schedule.teacherId,
              subjectId: schedule.subjectId,
              managerId: schedule.managerId,
              centerId: schedule.centerId,
            },
          });
          results.schedules.success++;
        } catch (error) {
          results.schedules.failed++;
          results.schedules.errors.push(`Schedule ${schedule.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    return NextResponse.json({
      message: 'Batch sync completed',
      results,
    });
  } catch (error) {
    console.error('Batch sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

