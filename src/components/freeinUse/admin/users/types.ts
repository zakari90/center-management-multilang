import { Role } from "@/freelib/dexie/dbSchema";

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string;
  createdAt: string;
  isActive: boolean;
  stats: {
    centers: number;
    students: number;
    teachers: number;
  };
}

export interface TeacherData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string;
  };
  stats: {
    subjects: number;
    students: number;
    receipts: number;
  };
}

export interface StudentData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  grade: string | null;
  createdAt: string;
  admin: {
    id: string;
    name: string;
  };
  stats: {
    subjects: number;
    receipts: number;
  };
}

export interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: Role;
}

export interface ItemToDelete {
  id: string;
  type: "user" | "teacher" | "student";
  name: string;
}
