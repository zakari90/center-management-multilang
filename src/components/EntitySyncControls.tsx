/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

type EntityType =
  | 'users'
  | 'centers'
  | 'teachers'
  | 'students'
  | 'subjects'
  | 'receipts'
  | 'schedules'

interface EntitySyncControlsProps {
  entity: EntityType
}

export function EntitySyncControls({ entity }: EntitySyncControlsProps) {
  void entity;
  return null;
}


