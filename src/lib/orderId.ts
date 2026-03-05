/**
 * Generates a human-readable order ID in the format HB-YYYYMMDD-XXXX
 * where XXXX is a 4-digit random number.
 * Example: HB-20260305-4721
 */
export function generateOrderId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(1000 + Math.random() * 9000)); // 1000-9999
  return `HB-${year}${month}${day}-${rand}`;
}
