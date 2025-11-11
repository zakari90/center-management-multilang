import { describe, it, expect, beforeEach } from 'vitest';
import {
  addOfflineRecord,
  deleteOfflineRecord,
  enqueueSyncOperation,
  generateObjectId,
  getAllOfflineRecords,
  getSyncOperations,
  mergeRemoteRecords,
  resetOfflineStore,
  updateOfflineRecord,
} from '../src/lib/offlineStore';

describe('offlineStore', () => {
  beforeEach(() => {
    resetOfflineStore();
  });

  it('generates 24-char hex ObjectIds', () => {
    const id = generateObjectId();
    expect(id).toHaveLength(24);
    expect(/^[0-9a-f]+$/i.test(id)).toBe(true);
  });

  it('adds and reads records', async () => {
    const record = { id: 'abc', name: 'Test', createdAt: new Date().toISOString() };
    await addOfflineRecord('students', record);
    const result = await getAllOfflineRecords('students');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject(record);
    expect(result[0]).not.toBe(record); // ensure cloning
  });

  it('updates an existing record', async () => {
    await addOfflineRecord('teachers', { id: 't1', name: 'Old' });
    const updated = await updateOfflineRecord('teachers', 't1', { name: 'New' });
    expect(updated).toBe(true);
    const result = await getAllOfflineRecords('teachers');
    expect(result[0].name).toBe('New');
  });

  it('deletes records', async () => {
    await addOfflineRecord('subjects', { id: 's1', name: 'Math' });
    await deleteOfflineRecord('subjects', 's1');
    const result = await getAllOfflineRecords('subjects');
    expect(result).toHaveLength(0);
  });

  it('enqueues sync operations', async () => {
    await enqueueSyncOperation({
      operation: 'CREATE',
      entity: 'students',
      entityId: 'abc',
      data: { id: 'abc' },
    });
    const queue = await getSyncOperations();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({
      operation: 'CREATE',
      entity: 'students',
      entityId: 'abc',
      status: 'pending',
    });
  });

  it('merges remote records and marks them synced', async () => {
    const localId = 'student-1';
    await addOfflineRecord('students', {
      id: localId,
      name: 'Local',
      syncStatus: 'pending',
    });

    await mergeRemoteRecords('students', [
      { id: localId, name: 'Remote', updatedAt: new Date().toISOString() },
    ]);

    const records = await getAllOfflineRecords('students');
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: localId,
      name: 'Remote',
      syncStatus: 'synced',
    });
  });
});


