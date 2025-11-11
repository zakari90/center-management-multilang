/**
 * Generate a MongoDB ObjectId-compatible string (24 hex characters)
 * This creates a valid ObjectId format that MongoDB will accept
 */
export function generateObjectId(): string {
  // Generate 24 hex characters (same format as MongoDB ObjectId)
  const hexChars = '0123456789abcdef'
  let objectId = ''
  
  for (let i = 0; i < 24; i++) {
    objectId += hexChars[Math.floor(Math.random() * 16)]
  }
  
  return objectId
}

/**
 * Check if a string is a valid MongoDB ObjectId format (24 hex characters)
 */
export function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

