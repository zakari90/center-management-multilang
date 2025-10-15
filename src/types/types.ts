export type Manager = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  students?: string[];
  receipts?:string[]

};
  export const daysOfWeek = [
    { key: "monday", label: "Monday" },
    { key: "tuesday", label: "Tuesday" },
    { key: "wednesday", label: "Wednesday" },
    { key: "thursday", label: "Thursday" },
    { key: "friday", label: "Friday" },
    { key: "saturday", label: "Saturday" },
    { key: "sunday", label: "Sunday" },
  ]

  export const availableSubjects = [
    "Mathematics", "English", "Science", "History", "Geography", "Physics", "Chemistry",
    "Biology", "Art", "Music", "Physical Education", "Computer Science", "French", "Spanish",
    "Arabic", "Philosophy", "Economics", "Psychology", "Sociology", "Literature"
  ]

  export const availableGrades = [
    "Kindergarten", "Pre-K", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade",
    "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade",
    "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8",
    "Grade 9", "Grade 10", "Grade 11", "Grade 12", "Primary", "Elementary", "Middle School", 
    "High School", "Advanced", "Beginner", "Intermediate"
  ]

  export const availableClassrooms = [
    "Room 1", "Room 2", "Room 3", "Room 4", "Room 5", "Room 6", "Classroom A", "Classroom B",
    "Lab 1", "Computer Lab", "Science Lab", "Art Room", "Music Room", "Library"
  ]
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000/api";
