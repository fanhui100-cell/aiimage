// Upstash Redis (REST) 轻客户端 —— 限流/缓存的生产化后端。
// 只用 fetch 调 REST API（无需 SDK / TCP），命令以 JSON 数组 POST，值可含任意字符。
// 未配置 UPSTASH_REDIS_REST_URL/TOKEN 时 redisEnabled() 为假，调用方回退内存版。

const URL = process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

export function redisEnabled(): boolean {
  return !!(URL && TOKEN)
}

/** 执行单条 Redis 命令；失败/未配置返回 null（调用方据此回退内存）。 */
export async function redisCmd<T = unknown>(cmd: (string | number)[]): Promise<T | null> {
  if (!URL || !TOKEN) return null
  try {
    const res = await fetch(URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(cmd),
      // 不让 Redis 抖动拖垮请求
      signal: AbortSignal.timeout(2500),
    })
    if (!res.ok) return null
    const j = await res.json() as { result?: T; error?: string }
    if (j.error) return null
    return (j.result ?? null) as T | null
  } catch {
    return null
  }
}
