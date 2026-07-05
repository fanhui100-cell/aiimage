/* ════════════════════════════════════════════════════════════════════════
   scripts/load-dotenv.ts — 把 .env.local 灌入 process.env（脚本上下文用）。

   Next.js 运行时会自动把 .env.local 载入 process.env，但 tsx 脚本不会。
   依赖 process.env 的服务端模块（如 lib/audio/audio-signing.ts 的 signAudioPath
   读 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_AUDIO_BUCKET）
   在脚本里会因 process.env 为空而静默失败（如听力音频签名返回 null → 卷面听力区空）。
   在脚本顶部调用 loadDotenv() 即可让校验器/冒烟与生产运行时一致。
   ════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs'

export function loadDotenv(path = '.env.local'): void {
  try {
    const raw = readFileSync(path, 'utf8')
    for (const line of raw.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/)
      if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2]
    }
  } catch { /* 缺文件不报错：保持脚本健壮 */ }
}
