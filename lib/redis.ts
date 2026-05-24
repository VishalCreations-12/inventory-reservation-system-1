const locks = new Map<string, { expiresAt: number }>()

export async function acquireLock(
  key: string,
  ttlMs: number = 5000
): Promise<boolean> {
  const lockKey = `lock:${key}`
  const now = Date.now()
  
  const existing = locks.get(lockKey)
  if (existing && existing.expiresAt > now) {
    return false
  }
  
  locks.set(lockKey, { expiresAt: now + ttlMs })
  return true
}

export async function releaseLock(key: string): Promise<void> {
  const lockKey = `lock:${key}`
  locks.delete(lockKey)
}
