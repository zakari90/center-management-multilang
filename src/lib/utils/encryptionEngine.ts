import { getGlobalCryptoKey, encryptData, decryptData } from "./crypto";

// Fields that should never be encrypted (used for IDs, relations, and Dexie indexing)
const unencryptedFields = new Set([
  "id",
  "status",
  "createdAt",
  "updatedAt",
  "adminId",
  "managerId",
  "centerId",
  "teacherId",
  "studentId",
  "subjectId",
  "receiptNumber",
  "type",
  "date", // Receipts
  "day", // Schedules
  "role",
  "email", // Users / Teachers
  "grade", // Students / Subjects
  "entityType",
  "entityId",
  "requestedBy",
  "requestStatus", // DeleteRequests
]);

/**
 * Transforms an entity into its E2EE format.
 * Moves all sensitive fields into a single encrypted Base64 `encryptedData` string.
 */
export async function encryptEntity<T extends Record<string, any>>(
  item: T,
): Promise<T> {
  const { key, isEncrypted } = getGlobalCryptoKey();
  if (!isEncrypted || !key) return item;

  const sensitiveData: Record<string, any> = {};
  const outputItem: Record<string, any> = {};

  for (const [k, v] of Object.entries(item)) {
    if (unencryptedFields.has(k) || k === "encryptedData") {
      outputItem[k] = v;
    } else {
      sensitiveData[k] = v;
      // Provide dummy values for strict types
      if (typeof v === "number") outputItem[k] = 0;
      else if (typeof v === "boolean") outputItem[k] = false;
      else if (Array.isArray(v)) outputItem[k] = [];
      else if (k.toLowerCase().includes("email"))
        outputItem[k] = "encrypted@e2ee.local";
      else if (typeof v === "string") outputItem[k] = "ENCRYPTED";
      else outputItem[k] = null;
    }
  }

  if (Object.keys(sensitiveData).length > 0) {
    outputItem.encryptedData = await encryptData(sensitiveData, key);
  }

  return outputItem as T;
}

/**
 * Restores an E2EE entity back into its original shape.
 * Decrypts `encryptedData` and merges it back into the object.
 */
export async function decryptEntity<T extends Record<string, any>>(
  item: T,
): Promise<T> {
  const { key, isEncrypted } = getGlobalCryptoKey();
  // If not encrypted mode, or no key, or no encryptedData field, return as is.
  if (!isEncrypted || !key || !item.encryptedData) return item;

  try {
    const sensitiveData = await decryptData<Record<string, any>>(
      item.encryptedData,
      key,
    );
    const restoredItem = { ...item, ...sensitiveData };
    delete restoredItem.encryptedData; // Clean up
    return restoredItem as T;
  } catch (error) {
    console.error(`Failed to decrypt entity ${item.id}`, error);
    return item; // Return partially encrypted object as fallback so app doesn't crash completely
  }
}
