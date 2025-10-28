/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/offlineRegistration.ts
import { localDb } from './dexie';

function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function addToSyncQueue(
  operation: 'CREATE' | 'UPDATE' | 'DELETE',
  entity: string,
  data: any,
  entityId?: string
) {
  await localDb.syncQueue.add({
    operation,
    entity,
    entityId,
    data,
    timestamp: new Date(),
    attempts: 0,
    status: 'pending'
  });
}

export async function registerUserOffline(formData: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: 'ADMIN' | 'MANAGER';
}) {
  const tempId = generateTempId();
  const now = new Date();
  const user: any = {
    id: tempId,
    email: formData.email,
    name: formData.name,
    password: formData.password,
    role: formData.role || 'MANAGER',
    createdAt: now,
    updatedAt: now,
    syncStatus: 'pending'
  };
  await localDb.users.add(user);
  await addToSyncQueue('CREATE', 'users', user, tempId);

  return user;
}
