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
// Use relative URLs for API calls to avoid port mismatch issues
// In server actions, we can use absolute URLs with the current request origin
export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' 
  ? `${window.location.origin}/api` 
  : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:6524/api');
