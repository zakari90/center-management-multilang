//api/admin/centers/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import { getSession } from "@/lib/authentication";
import db from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const centers = await db.center.findMany({
      include: {
        admin: { select: { id: true, name: true, email: true } },
        _count: { select: { subjects: true } }
      }
    });

    const centersWithStats = await Promise.all(
      centers.map(async (center: any & { admin: any; _count: any }) => {
        const classrooms = Array.isArray(center.classrooms) ? (center.classrooms as string[]) : [];
        const workingDays = Array.isArray(center.workingDays) ? (center.workingDays as string[]) : [];
        const managerIds = Array.isArray(center.managers) ? (center.managers as string[]) : [];

        const [students, teachers, receipts, managers] = await Promise.all([
          db.student.count({ where: { managerId: { in: managerIds } } }),
          db.teacher.count({ where: { managerId: { in: managerIds } } }),
          db.receipt.findMany({
            where: { type: 'STUDENT_PAYMENT', managerId: { in: managerIds } },
            select: { amount: true }
          }),
          managerIds.length
            ? db.user.findMany({
                where: { id: { in: managerIds }, role: 'MANAGER' },
                select: { id: true, name: true, email: true }
              })
            : Promise.resolve([])
        ]);

        const revenue = receipts.reduce((sum :number, r:any) => sum + r.amount , 0);

        return {
          id: center.id,
          name: center.name,
          address: center.address,
          phone: center.phone,
          classrooms,
          workingDays,
          managers,
          admin: center.admin,
          studentsCount: students,
          teachersCount: teachers,
          subjectsCount: center._count.subjects,
          revenue,
          managersCount: managers.length,
          createdAt: center.createdAt,
          updatedAt: center.updatedAt
        };
      })
    );

    return NextResponse.json(centersWithStats);
  } catch (error) {
    console.error('Error fetching centers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}