import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import {
  CenterSchema,
  UserSchema,
  TeacherSchema,
  StudentSchema,
  SubjectSchema,
  ReceiptSchema,
  ScheduleSchema,
} from "@/lib/validations/schemas";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { entities } = body;

    if (!entities || typeof entities !== "object") {
      return NextResponse.json(
        { error: "Invalid request format. Expected { entities: {...} }" },
        { status: 400 },
      );
    }

    const results: Record<
      string,
      { success: number; failed: number; deleted: number; errors: string[] }
    > = {};

    // Helper to process entities with validation
    const processEntities = async <T extends { id: string; status: string }>(
      name: string,
      data: any[],
      schema: z.ZodSchema<T>,
      dbTable: any,
      upsertConfig: (item: T) => any,
    ) => {
      results[name] = { success: 0, failed: 0, deleted: 0, errors: [] };
      if (!Array.isArray(data)) return;

      for (const rawItem of data) {
        try {
          // Validate and sanitize
          const item = schema.parse(rawItem);

          // Handle deletions (status '0')
          if (item.status === "0") {
            await dbTable.delete({
              where: { id: item.id },
            });
            results[name].deleted++;
          } else {
            // Handle create/update
            await dbTable.upsert(upsertConfig(item));
            results[name].success++;
          }
        } catch (error) {
          results[name].failed++;
          const itemId = (rawItem as any)?.id || "unknown";
          let errorMessage = "Unknown error";

          if (error instanceof z.ZodError) {
            errorMessage = error.issues
              .map((e: z.ZodIssue) => `${e.path.join(".")}: ${e.message}`)
              .join(", ");
          } else if (error instanceof Error) {
            errorMessage = error.message;
          }

          results[name].errors.push(`${name} ${itemId}: ${errorMessage}`);
        }
      }
    };

    // Batch sync users
    await processEntities(
      "users",
      entities.users,
      UserSchema,
      db.user,
      (user) => ({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          role: user.role,
          updatedAt: new Date(user.updatedAt),
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          password: user.password,
          role: user.role,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      }),
    );

    // Batch sync centers
    await processEntities(
      "centers",
      entities.centers,
      CenterSchema,
      db.center,
      (center) => ({
        where: { id: center.id },
        update: {
          name: center.name,
          address: center.address,
          phone: center.phone,
          classrooms: center.classrooms,
          workingDays: center.workingDays,
          managers: center.managers,
          academicYear: center.academicYear,
          staffEntryDate: center.staffEntryDate,
          studentEntryDate: center.studentEntryDate,
          schoolEndDateBac: center.schoolEndDateBac,
          schoolEndDateOther: center.schoolEndDateOther,
          updatedAt: new Date(center.updatedAt),
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
          academicYear: center.academicYear,
          staffEntryDate: center.staffEntryDate,
          studentEntryDate: center.studentEntryDate,
          schoolEndDateBac: center.schoolEndDateBac,
          schoolEndDateOther: center.schoolEndDateOther,
          createdAt: new Date(center.createdAt),
          updatedAt: new Date(center.updatedAt),
        },
      }),
    );

    // Batch sync teachers
    await processEntities(
      "teachers",
      entities.teachers,
      TeacherSchema,
      db.teacher,
      (teacher) => ({
        where: { id: teacher.id },
        update: {
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          address: teacher.address,
          weeklySchedule: teacher.weeklySchedule as any,
          updatedAt: new Date(teacher.updatedAt),
        },
        create: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          phone: teacher.phone,
          address: teacher.address,
          weeklySchedule: teacher.weeklySchedule as any,
          managerId: teacher.managerId,
          createdAt: new Date(teacher.createdAt),
          updatedAt: new Date(teacher.updatedAt),
        },
      }),
    );

    // Batch sync students
    await processEntities(
      "students",
      entities.students,
      StudentSchema,
      db.student,
      (student) => ({
        where: { id: student.id },
        update: {
          name: student.name,
          email: student.email,
          phone: student.phone,
          parentName: student.parentName,
          parentPhone: student.parentPhone,
          parentEmail: student.parentEmail,
          grade: student.grade,
          updatedAt: new Date(student.updatedAt),
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
          createdAt: new Date(student.createdAt),
          updatedAt: new Date(student.updatedAt),
        },
      }),
    );

    // Batch sync subjects
    await processEntities(
      "subjects",
      entities.subjects,
      SubjectSchema,
      db.subject,
      (subject) => ({
        where: { id: subject.id },
        update: {
          name: subject.name,
          grade: subject.grade,
          price: subject.price,
          duration: subject.duration,
          updatedAt: new Date(subject.updatedAt),
        },
        create: {
          id: subject.id,
          name: subject.name,
          grade: subject.grade,
          price: subject.price,
          duration: subject.duration,
          centerId: subject.centerId,
          createdAt: new Date(subject.createdAt),
          updatedAt: new Date(subject.updatedAt),
        },
      }),
    );

    // Batch sync receipts
    await processEntities(
      "receipts",
      entities.receipts,
      ReceiptSchema,
      db.receipt,
      (receipt) => ({
        where: { id: receipt.id },
        update: {
          amount: receipt.amount,
          type: receipt.type,
          description: receipt.description,
          paymentMethod: receipt.paymentMethod,
          updatedAt: new Date(receipt.updatedAt),
        },
        create: {
          id: receipt.id,
          receiptNumber: receipt.receiptNumber,
          amount: receipt.amount,
          type: receipt.type,
          description: receipt.description,
          paymentMethod: receipt.paymentMethod,
          date: new Date(receipt.date),
          studentId: receipt.studentId,
          teacherId: receipt.teacherId,
          managerId: receipt.managerId,
          createdAt: new Date(receipt.createdAt),
          updatedAt: new Date(receipt.updatedAt),
        },
      }),
    );

    // Batch sync schedules
    await processEntities(
      "schedules",
      entities.schedules,
      ScheduleSchema,
      db.schedule,
      (schedule) => ({
        where: { id: schedule.id },
        update: {
          day: schedule.day,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          roomId: schedule.roomId,
          updatedAt: new Date(schedule.updatedAt),
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
          createdAt: new Date(schedule.createdAt),
          updatedAt: new Date(schedule.updatedAt),
        },
      }),
    );

    return NextResponse.json({
      message: "Batch sync completed",
      results,
    });
  } catch (error) {
    console.error("Batch sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
