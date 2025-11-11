import { userActions } from '@/lib/dexie/dexieActions';
import { User } from '@/lib/dexie/dbSchema';
import { generateObjectId } from './generateObjectId';
import bcrypt from 'bcryptjs';

/**
 * Save user (manager/admin) to localDb (Dexie)
 * Always saves with status 'w' (waiting for sync)
 * After successful sync, status will be changed to '1' (synced)
 * 
 * @param userData - User data from API response or form
 * @param plainPassword - Plain password (needed for sync)
 * @returns The saved user
 */
export async function saveManagerToLocalDb(
  userData: {
    id?: string;
    email: string;
    name: string;
    role: 'MANAGER' | 'ADMIN';
  },
  plainPassword: string
): Promise<User> {
  const existingUser = await userActions.getLocalByEmail(userData.email);
  
  // Hash the password for secure storage
  const hashedPassword = await bcrypt.hash(plainPassword, 10);
  
  const now = Date.now();
  const userToSave: User = {
    id: userData.id || existingUser?.id || generateObjectId(), // Use provided ID or generate MongoDB-compatible ID
    status: 'w' as const, // Always start with 'w' (waiting for sync)
    createdAt: existingUser?.createdAt || now,
    updatedAt: now,
    email: userData.email,
    password: hashedPassword,
    name: userData.name,
    role: userData.role,
  };
  
  await userActions.putLocal(userToSave);
  
  // Always store plain password in sessionStorage for sync purposes
  // This will be cleared after successful sync
  if (typeof window !== 'undefined') {
    const syncPasswords = JSON.parse(sessionStorage.getItem('syncPasswords') || '{}');
    syncPasswords[userData.email] = plainPassword;
    sessionStorage.setItem('syncPasswords', JSON.stringify(syncPasswords));
  }
  
  return userToSave;
}

/**
 * Get plain password for sync (if stored)
 */
export function getPlainPasswordForSync(email: string): string | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const syncPasswords = JSON.parse(sessionStorage.getItem('syncPasswords') || '{}');
    return syncPasswords[email] || null;
  } catch {
    return null;
  }
}

/**
 * Clear stored plain password after successful sync
 */
export function clearPlainPasswordForSync(email: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const syncPasswords = JSON.parse(sessionStorage.getItem('syncPasswords') || '{}');
    delete syncPasswords[email];
    sessionStorage.setItem('syncPasswords', JSON.stringify(syncPasswords));
  } catch {
    // Ignore errors
  }
}

