export function resolveChatMessageCount(
  currentCount: number | null | undefined,
  insertedCount: number,
): number {
  return Math.max(0, currentCount ?? 0) + Math.max(0, insertedCount)
}
