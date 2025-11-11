// src/lib/clientAuth.ts
// Client-side authentication helper using Dexie

import { userActions } from './dexie/dexieActions';
import { User } from './dexie/dbSchema';

type ClientUser = { id: string; email: string; name: string; role: string };

const isBrowser = () => typeof window !== 'undefined';

/**
 * Get current user from Dexie (prioritizes synced users)
 */
export async function getClientUser(): Promise<ClientUser | null> {
  if (!isBrowser()) return null;

  try {
    const allUsers = await userActions.getAll();
    if (allUsers.length === 0) return null;

    // Prioritize synced users (status '1')
    const syncedUsers = allUsers
      .filter((user) => user.status === '1')
      .sort((a, b) => b.updatedAt - a.updatedAt);

    // Fallback to any user
    const fallbackUsers = [...allUsers].sort((a, b) => b.updatedAt - a.updatedAt);

    const selectedUser = syncedUsers[0] ?? fallbackUsers[0];

    if (selectedUser?.id) {
      return {
        id: selectedUser.id,
        email: selectedUser.email,
        name: selectedUser.name,
        role: selectedUser.role,
      };
    }
  } catch (error) {
    console.error('Failed to get client user:', error);
  }

  return null;
}

/**
 * Get current user ID (for offline operations)
 */
export async function getClientUserId(): Promise<string | null> {
  const user = await getClientUser();
  return user?.id || null;
}

/**
 * Get current user by email (useful for login verification)
 */
export async function getClientUserByEmail(
  email: string
): Promise<{ id: string; email: string; name: string; role: string; password: string } | null> {
  if (!isBrowser()) return null;

  try {
    const normalizedEmail = email.toLowerCase();
    const user = await userActions.getLocalByEmail(normalizedEmail);

    if (user) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        password: user.password,
      };
    }
  } catch (error) {
    console.error('Failed to get user by email:', error);
  }

  return null;
}

/**
 * Store current user in Dexie for offline access
 * This updates the user record to mark it as synced
 */
export async function setClientUser(user: ClientUser): Promise<void> {
  if (!isBrowser()) return;

  try {
    const existing = await userActions.getLocalByEmail(user.email) || 
                     (user.id ? await userActions.getLocal(user.id) : null);
    
    const now = Date.now();

    if (existing) {
      // Update existing user
      const updatedUser: User = {
        ...existing,
        id: user.id || existing.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: '1' as const, // Mark as synced
        updatedAt: now,
      };
      await userActions.putLocal(updatedUser);
    } else {
      // Create new user (shouldn't happen often, but handle it)
      const newUser: User = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        password: '', // No password stored here (handled by saveManagerToLocalDb)
        status: '1' as const, // Mark as synced
        createdAt: now,
        updatedAt: now,
      };
      await userActions.putLocal(newUser);
    }
  } catch (error) {
    console.error('Failed to store client user:', error);
  }
}
