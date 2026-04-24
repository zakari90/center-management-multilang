import { z } from "zod";

// --- Enums ---
export const RoleSchema = z.enum(["ADMIN"]);
export const ReceiptTypeSchema = z.enum(["STUDENT_PAYMENT", "TEACHER_PAYMENT"]);

// --- Base Schemas ---
export const SyncEntitySchema = z.object({
  id: z.string().min(1),
  createdAt: z
    .number()
    .or(z.date())
    .transform((v) => (v instanceof Date ? v.getTime() : v)),
  updatedAt: z
    .number()
    .or(z.date())
    .transform((v) => (v instanceof Date ? v.getTime() : v)),
});

// --- Entity Schemas ---

export const CenterSchema = SyncEntitySchema.extend({
  name: z.string().trim().min(2),
  address: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  classrooms: z.array(z.string().trim()),
  workingDays: z.array(z.string().trim()),
  paymentStartDay: z.number().min(1).max(31).optional().nullable(),
  paymentEndDay: z.number().min(1).max(31).optional().nullable(),
  academicYear: z.string().trim().optional().nullable(),
  staffEntryDate: z.string().trim().optional().nullable(),
  studentEntryDate: z.string().trim().optional().nullable(),
  schoolEndDateBac: z.string().trim().optional().nullable(),
  schoolEndDateOther: z.string().trim().optional().nullable(),

  adminId: z.string().min(1),
});

export const UserSchema = SyncEntitySchema.extend({
  email: z.string().trim().email(),
  password: z.string().min(1),
  name: z.string().trim().min(2),
  role: RoleSchema,
});

export const TeacherSchema = SyncEntitySchema.extend({
  name: z.string().trim().min(2),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  weeklySchedule: z
    .array(z.string())
    .or(z.record(z.string(), z.any()))
    .optional()
    .nullable(),
});

export const StudentSchema = SyncEntitySchema.extend({
  name: z.string().trim().min(2),
  email: z.string().trim().email().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  parentName: z.string().trim().optional().nullable(),
  parentPhone: z.string().trim().optional().nullable(),
  parentEmail: z.string().trim().email().optional().nullable(),
  grade: z.string().trim().optional().nullable(),
});

export const SubjectSchema = SyncEntitySchema.extend({
  name: z.string().trim().min(1),
  grade: z.string().trim().min(1),
  price: z.number().min(0),
  duration: z.number().min(0).optional().nullable(),
  centerId: z.string().min(1),
});

export const TeacherSubjectSchema = SyncEntitySchema.extend({
  percentage: z.number().min(0).max(100).optional().nullable(),
  assignedAt: z.number(),
  teacherId: z.string().min(1),
  subjectId: z.string().min(1),
});

export const StudentSubjectSchema = SyncEntitySchema.extend({
  enrolledAt: z.number().or(z.string()),
  studentId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
});

export const ReceiptSchema = SyncEntitySchema.extend({
  receiptNumber: z.string().trim().min(1),
  amount: z.number().min(0),
  type: ReceiptTypeSchema,
  description: z.string().trim().optional().nullable(),
  paymentMethod: z.string().trim().optional().nullable(),
  date: z
    .number()
    .or(z.date())
    .transform((v) => (v instanceof Date ? v.getTime() : v)),
  studentId: z.string().min(1).optional().nullable(),
  teacherId: z.string().min(1).optional().nullable(),
});

export const ScheduleSchema = SyncEntitySchema.extend({
  day: z.string().trim().min(1),
  startTime: z.string().trim().min(1),
  endTime: z.string().trim().min(1),
  roomId: z.string().trim().min(1),
  teacherId: z.string().min(1),
  subjectId: z.string().min(1),

  centerId: z.string().min(1).optional().nullable(),
});

// --- Form Schemas ---
export const StudentFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email().nullish().or(z.literal("")),
  phone: z.string().trim().nullish().or(z.literal("")),
  parentName: z.string().trim().nullish().or(z.literal("")),
  parentPhone: z.string().trim().nullish().or(z.literal("")),
  parentEmail: z.string().trim().email().nullish().or(z.literal("")),
  grade: z.string().trim().nullish().or(z.literal("")),
});

export const SubjectFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  grade: z.string().trim().min(1, "Grade is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  duration: z.coerce.number().min(0).optional().nullable(),
});

// --- Input Schemas (Sanitization) ---
export const CenterInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  address: z.string().trim().optional().nullable(),
  phone: z.string().trim().optional().nullable(),
  classrooms: z.array(z.string().trim()).default([]),
  workingDays: z.array(z.string().trim()).default([]),
});

export const StudentInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email().nullish().or(z.literal("")),
  phone: z.string().trim().nullish().or(z.literal("")),
  parentName: z.string().trim().nullish().or(z.literal("")),
  parentPhone: z.string().trim().nullish().or(z.literal("")),
  parentEmail: z.string().trim().email().nullish().or(z.literal("")),
  grade: z.string().trim().nullish().or(z.literal("")),
  enrollments: z
    .array(
      z.object({
        id: z.string().min(1).optional(),
        subjectId: z.string().min(1),
        teacherId: z.string().min(1),
      }),
    )
    .optional()
    .default([]),
});

export const SubjectInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  grade: z.string().trim().min(1, "Grade is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  duration: z.coerce.number().min(0).optional().nullable(),
  centerId: z.string().min(1, "Center ID is required"),
});

export const UserUpdateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  username: z.string().trim().min(2, "Username is required"),
  email: z.string().trim().email("Invalid email").optional().or(z.literal("")),
  password: z.string().optional().or(z.literal("")), // Optional for updates
});

// --- Types ---
export type StudentFormInput = z.infer<typeof StudentFormSchema>;
export type SubjectFormInput = z.infer<typeof SubjectFormSchema>;
export type CenterInput = z.infer<typeof CenterSchema>;
export type CenterSanitizedInput = z.infer<typeof CenterInputSchema>;
export type StudentSanitizedInput = z.infer<typeof StudentInputSchema>;
export type SubjectSanitizedInput = z.infer<typeof SubjectInputSchema>;
