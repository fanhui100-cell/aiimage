/**
 * EasyOCR local provider — 本地免费 OCR（无需任何 API key）。
 * 把图片写到临时文件，spawn 调用 scripts/easyocr_extract.py（EasyOCR / 中英），读回文本。
 * 仅在 Node.js runtime + 本机/自托管有 Python+easyocr 时可用；通过 OCR_ENGINE=easyocr 启用。
 * 任何失败都抛错，由 image-ocr-provider 兜底回退到 MockOCRProvider，管线不崩。
 */

import { spawn } from 'node:child_process'
import { writeFile, unlink, mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import type { OCRProvider, OCRInput, OCRResult } from './ocr-types'

const PYTHON_BIN = process.env.PYTHON_BIN || 'python'
const SCRIPT_PATH = join(process.cwd(), 'scripts', 'easyocr_extract.py')
const TIMEOUT_MS = 120_000

function extOf(mime: string): string {
  if (mime.includes('png')) return '.png'
  if (mime.includes('webp')) return '.webp'
  if (mime.includes('bmp')) return '.bmp'
  return '.jpg'
}

function runPython(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(PYTHON_BIN, args, { windowsHide: true })
    let out = '', err = ''
    const timer = setTimeout(() => { proc.kill(); reject(new Error('easyocr timeout')) }, TIMEOUT_MS)
    proc.stdout.on('data', d => { out += d })
    proc.stderr.on('data', d => { err += d })
    proc.on('error', e => { clearTimeout(timer); reject(e) }) // 如 python 未安装/不在 PATH
    proc.on('close', code => {
      clearTimeout(timer)
      if (code === 0 && out.trim()) resolve(out.trim())
      else reject(new Error(err.trim() || `python exited ${code}`))
    })
  })
}

export class EasyOCRProvider implements OCRProvider {
  readonly name = 'easyocr-local' as const

  async extractText(input: OCRInput): Promise<OCRResult> {
    const dir = await mkdtemp(join(tmpdir(), 'lexi-ocr-'))
    const file = join(dir, `img${extOf(input.mimeType)}`)
    await writeFile(file, input.buffer)
    try {
      const stdout = await runPython([SCRIPT_PATH, file])
      // 取最后一行非空 stdout 作为 JSON（防止前置日志干扰）
      const lastLine = stdout.split(/\r?\n/).filter(Boolean).pop() ?? ''
      const parsed = JSON.parse(lastLine) as { text?: string; confidence?: number | null; error?: string }
      if (parsed.error) throw new Error(parsed.error)
      return {
        rawText: parsed.text ?? '',
        confidence: parsed.confidence ?? undefined,
        languageHints: ['en', 'zh'],
        extractionMethod: 'easyocr-local',
        warnings: [],
      }
    } finally {
      unlink(file).catch(() => {})
    }
  }
}
