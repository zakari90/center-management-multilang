import { useState, useCallback, useEffect } from "react";
import {
  userActions,
  teacherActions,
  studentActions,
  centerActions,
  teacherSubjectActions,
  studentSubjectActions,
  receiptActions,
} from "@/freelib/dexie/freedexieaction";
import { Role } from "@/freelib/dexie/dbSchema";
import { useAuth } from "@/freelib/context/freeauthContext";
import { UserData, TeacherData, StudentData } from "./types";

export function useAllUsers(unknownAdminText: string = "Unknown Admin") {
  const { user } = useAuth();

  const [users, setUsers] = useState<UserData[]>([]);
  const [teachers, setTeachers] = useState<TeacherData[]>([]);
  const [students, setStudents] = useState<StudentData[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [
        allUsers,
        allTeachers,
        allStudents,
        allCenters,
        allTeacherSubjects,
        allStudentSubjects,
        allReceipts,
      ] = await Promise.all([
        userActions.getAll(),
        teacherActions.getAll(),
        studentActions.getAll(),
        centerActions.getAll(),
        teacherSubjectActions.getAll(),
        studentSubjectActions.getAll(),
        receiptActions.getAll(),
      ]);

      const activeUsers = allUsers;
      const activeTeachers = allTeachers;
      const activeStudents = allStudents;
      const activeCenters = allCenters;
      const activeTeacherSubjects = allTeacherSubjects;
      const activeStudentSubjects = allStudentSubjects;
      const activeReceipts = allReceipts;

      const usersData: UserData[] = activeUsers.map((userItem) => {
        const centers =
          userItem.role === Role.ADMIN
            ? activeCenters.filter((c) => c.adminId === userItem.id).length
            : 0;

        const studentsCount = activeStudents.length;
        const teachersCount = activeTeachers.length;

        return {
          id: userItem.id,
          name: userItem.name,
          email: userItem.email,
          role: Role.ADMIN,
          password: userItem.password,
          createdAt: new Date(userItem.createdAt).toISOString(),
          isActive: true, // Simplified for single-user admin
          stats: {
            centers,
            students: studentsCount,
            teachers: teachersCount,
          },
        };
      });

      const teachersData: TeacherData[] = activeTeachers.map((teacher) => {
        const admin = activeUsers[0];

        const teacherSubs = activeTeacherSubjects.filter(
          (ts) => ts.teacherId === teacher.id,
        );
        const studentSubs = activeStudentSubjects.filter(
          (ss) => ss.teacherId === teacher.id,
        );
        const teacherReceipts = activeReceipts.filter(
          (r) => r.teacherId === teacher.id,
        );

        return {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email || null,
          phone: teacher.phone || null,
          address: teacher.address || null,
          createdAt: new Date(teacher.createdAt).toISOString(),
          admin: admin
            ? {
                id: admin.id,
                name: admin.name,
              }
            : {
                id: "unknown",
                name: unknownAdminText,
              },
          stats: {
            subjects: teacherSubs.length,
            students: studentSubs.length,
            receipts: teacherReceipts.length,
          },
        };
      });

      const studentsData: StudentData[] = activeStudents.map((student) => {
        const admin = activeUsers[0];

        const studentSubs = activeStudentSubjects.filter(
          (ss) => ss.studentId === student.id,
        );
        const studentReceipts = activeReceipts.filter(
          (r) => r.studentId === student.id,
        );

        return {
          id: student.id,
          name: student.name,
          email: student.email || null,
          phone: student.phone || null,
          parentName: student.parentName || null,
          parentPhone: student.parentPhone || null,
          parentEmail: student.parentEmail || null,
          grade: student.grade || null,
          createdAt: new Date(student.createdAt).toISOString(),
          admin: admin
            ? {
                id: admin.id,
                name: admin.name,
              }
            : {
                id: "unknown",
                name: unknownAdminText,
              },
          stats: {
            subjects: studentSubs.length,
            receipts: studentReceipts.length,
          },
        };
      });

      setUsers(usersData);
      setTeachers(teachersData);
      setStudents(studentsData);
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load data from local database");
    } finally {
      setIsLoading(false);
    }
  }, [user, unknownAdminText]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    users,
    teachers,
    students,
    isLoading,
    error,
    refreshData: fetchAllData,
  };
}
