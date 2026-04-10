export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

export async function checkReachability(): Promise<boolean> {
  // In a local-only app, "reachability" essentially means "is the browser online?"
  // since we don't have a specific server to ping.
  return isOnline();
}
