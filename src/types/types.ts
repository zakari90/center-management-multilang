export type Manager = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  students?: string[];
  receipts?:string[]

};


export const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
]
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000/api";
