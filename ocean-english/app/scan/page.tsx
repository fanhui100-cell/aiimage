import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'

export default function ScanPage() {
  return (
    <AppShell>
      <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', paddingTop: '80px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>
          <h1 style={{ margin: '0 0 6px', fontSize: '32px', fontWeight: 700, color: '#ECFBFF' }}>
            Scan Hollow <span style={{ fontSize: '18px', color: '#9BBFCA' }}>文档树洞</span>
          </h1>
          <p style={{ margin: '0 0 32px', color: '#9BBFCA', fontSize: '14px' }}>
            Upload a PDF or image. Extract vocabulary, questions, and get AI-suggested answers.
            <br />
            <span style={{ fontSize: '13px', color: 'rgba(155,191,202,0.6)' }}>
              上传 PDF 或图片，识别题目，提取生词，获取答案建议。
            </span>
          </p>
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '2px dashed rgba(255,215,106,0.3)',
              borderRadius: '16px',
              padding: '64px 32px',
              textAlign: 'center',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
            <div style={{ color: 'rgba(255,215,106,0.6)', fontSize: '14px', marginBottom: '8px' }}>
              Drop PDF or image here / 拖放 PDF 或图片至此
            </div>
            <div style={{ color: 'rgba(155,191,202,0.4)', fontSize: '12px', fontFamily: 'ui-monospace, monospace' }}>
              [ File upload & OCR analysis — Phase 2 / 文件上传与识别 (Phase 2) ]
            </div>
          </div>
          <Link href="/" style={{ fontSize: '13px', color: '#38BDF8', textDecoration: 'none' }}>
            ← Back to Home / 返回首页
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
