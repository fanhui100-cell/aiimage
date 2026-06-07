'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ReferenceLexiverseNavPanel } from './ReferenceLexiverseNavPanel'

type ReferenceGalaxy = {
  id: string
  title: string
  titleZh: string
  sourceType: string
  colorTheme?: string
}

type LexiverseWindow = Window & {
  LexiverseCatalog?: { GALAXIES?: ReferenceGalaxy[] }
  __lexiverse?: {
    openGalaxy?: (galaxy: unknown) => void
    universe?: { focusGalaxy?: (id: string) => void }
    catalog?: { GALAXIES?: ReferenceGalaxy[] }
  }
}

export function ReferenceLexiverseFrame() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const galaxyId = searchParams.get('galaxy')
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [referenceGalaxies, setReferenceGalaxies] = useState<ReferenceGalaxy[]>([])

  const src = useMemo(() => {
    const file = galaxyId ? 'Lexiverse Galaxy.html' : 'Lexiverse Universe.html'
    return `/lexiverse-reference/${encodeURIComponent(file)}`
  }, [galaxyId])

  const syncReferenceCatalog = useCallback(() => {
    let attempt = 0
    const sync = () => {
      const win = frameRef.current?.contentWindow as LexiverseWindow | null
      const galaxies = win?.__lexiverse?.catalog?.GALAXIES ?? win?.LexiverseCatalog?.GALAXIES
      if (Array.isArray(galaxies) && galaxies.length) {
        setReferenceGalaxies(galaxies)
        return
      }
      if (attempt < 30) {
        attempt += 1
        window.setTimeout(sync, 120)
      }
    }
    sync()
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/lexiverse-reference/lexiverse-universe/catalog.js')
      .then(response => response.text())
      .then(source => {
        const fakeWindow: { LexiverseCatalog?: { GALAXIES?: ReferenceGalaxy[] } } = {}
        new Function('window', source)(fakeWindow)
        const galaxies = fakeWindow.LexiverseCatalog?.GALAXIES
        if (!cancelled && Array.isArray(galaxies) && galaxies.length) {
          setReferenceGalaxies(galaxies)
        }
      })
      .catch(() => {
        syncReferenceCatalog()
      })
    return () => {
      cancelled = true
    }
  }, [syncReferenceCatalog])

  const previewGalaxy = useCallback((id: string) => {
    let attempt = 0
    const preview = () => {
      const win = frameRef.current?.contentWindow as LexiverseWindow | null
      const api = win?.__lexiverse
      const catalog = api?.catalog ?? win?.LexiverseCatalog
      const galaxy = catalog?.GALAXIES?.find(item => {
        return item.id === id
      })
      win?.postMessage({ type: 'lexiverse-preview-galaxy', galaxyId: id }, window.location.origin)
      if ((!api?.openGalaxy || !api.universe?.focusGalaxy) && attempt < 20) {
        attempt += 1
        window.setTimeout(preview, 120)
        return
      }
      api?.universe?.focusGalaxy?.(id)
      if (galaxy) api?.openGalaxy?.(galaxy)
    }
    preview()
  }, [])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      const data = event.data as { type?: string; galaxyId?: string }
      if (data.type !== 'lexiverse-enter-galaxy' || !data.galaxyId) return
      const sp = new URLSearchParams(searchParams.toString())
      sp.set('galaxy', data.galaxyId)
      sp.delete('planet')
      router.replace(`${pathname}?${sp.toString()}`)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [router, pathname, searchParams])

  return (
    <>
      <iframe
        ref={frameRef}
        key={src}
        title={galaxyId ? 'Lexiverse Galaxy' : 'Lexiverse Universe'}
        src={src}
        onLoad={() => syncReferenceCatalog()}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100vw',
          height: '100vh',
          border: 0,
          background: '#040407',
        }}
        allow="fullscreen"
      />
      <ReferenceLexiverseNavPanel galaxies={referenceGalaxies} onPreviewGalaxy={previewGalaxy} />
    </>
  )
}
