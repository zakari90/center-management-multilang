/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/dexieUserActions.ts
import { localDb, LocalUser } from './dexie';

/**
 * Get all users from local database
 */
export async function getAllUsers(): Promise<LocalUser[]> {
  try {
    return await localDb.users.toArray();
  } catch (error) {
    console.error('Error getting users from Dexie:', error);
    return [];
  }
}

/**
 * Save or update a user locally (for offline access after successful login)
 */
export async function saveUserLocal(user: any): Promise<void> {
  try {
    const existingUser = await localDb.users.get(user.id);
    
    if (existingUser) {
      // Update existing user
      await localDb.users.update(user.id, {
        ...user,
        updatedAt: new Date(),
        syncStatus: user.status === '1' ? 'synced' : 'pending'
      });
    } else {
      // Add new user
      await localDb.users.add({
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt || new Date(),
        updatedAt: new Date(),
        syncStatus: user.status === '1' ? 'synced' : 'pending'
      });
    }
  } catch (error) {
    console.error('Error saving user to Dexie:', error);
  }
}

/**
 * Get a user by email
 */
export async function getUserByEmail(email: string): Promise<LocalUser | undefined> {
  try {
    return await localDb.users.where('email').equals(email).first();
  } catch (error) {
    console.error('Error getting user by email from Dexie:', error);
    return undefined;
  }
}

/**
 * Get a user by ID
 */
export async function getUserById(id: string): Promise<LocalUser | undefined> {
  try {
    return await localDb.users.get(id);
  } catch (error) {
    console.error('Error getting user by ID from Dexie:', error);
    return undefined;
  }
}

