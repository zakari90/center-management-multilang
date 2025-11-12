/**
 * Generate a MongoDB ObjectId-compatible string (24 hex characters)
 * This creates a valid ObjectId format that MongoDB will accept
 */
import { ObjectId } from 'bson';
export function generateObjectId() {
  return new ObjectId().toHexString();
}

