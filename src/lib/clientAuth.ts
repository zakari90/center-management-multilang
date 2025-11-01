/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/clientAuth.ts
// Client-side authentication helper for offline operations

import { localDb } from './dexie';

/**
 * Get current user from Dexie (for offline operations)
 * This works client-side only and doesn't require cookies
 * Returns the most recently updated synced user (logged in user)
 */
export async function getClientUser(): Promise<{ id: string; email: string; name: string; role: string } | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    // Get users ordered by most recently updated, prefer synced users
    // This should be the currently logged in user
    const syncedUsers = await localDb.users
      .where('syncStatus')
      .equals('synced')
      .sortBy('updatedAt');
    
    if (syncedUsers.length > 0) {
      // Get the most recently updated synced user
      const user = syncedUsers.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
      
      if (user && user.id) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }
    
    // Fallback: get most recently updated user (might be pending but still logged in)
    const allUsers = await localDb.users
      .orderBy('updatedAt')
      .reverse()
      .limit(1)
      .toArray();
    
    if (allUsers.length > 0) {
      const user = allUsers[0];
      if (user && user.id) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get client user:', error);
    return null;
  }
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
export async function getClientUserByEmail(email: string): Promise<{ id: string; email: string; name: string; role: string; password: string } | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    const user = await localDb.users
      .where('email')
      .equals(email)
      .first();
    
    if (user) {
      return {
        id: user.id || '',
        email: user.email,
        name: user.name,
        role: user.role,
        password: user.password, // Needed for offline login verification
      };
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get user by email:', error);
    return null;
  }
}

/**
 * Store current user in Dexie for offline access
 * This updates the user record to mark it as the current logged-in user
 */
export async function setClientUser(user: { id: string; email: string; name: string; role: string }): Promise<void> {
  if (typeof window === 'undefined') return;
  
  try {
    // Check if user exists by email (for offline login) or by ID (for online login)
    const existingByEmail = await localDb.users.where('email').equals(user.email).first();
    const existingById = user.id ? await localDb.users.where('id').equals(user.id).first() : null;
    const existing = existingById || existingByEmail;
    
    if (existing && existing.id) {
      // Update existing user - mark as synced (logged in from server)
      await localDb.users.update(existing.id, {
        id: user.id || existing.id,
        email: user.email,
        name: user.name,
        role: user.role,
        updatedAt: new Date(),
        syncStatus: 'synced', // Mark as synced since it came from server
      });
    } else {
      // Add new user record (shouldn't normally happen but handle it)
      // Note: This won't have password, so offline login won't work until synced
      await localDb.users.add({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        password: '', // Will be set when synced from server
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: 'synced',
      });
    }
  } catch (error) {
    console.error('Failed to store client user:', error);
  }
}
