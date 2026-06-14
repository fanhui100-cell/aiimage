/* LexiOcean Service Worker — PWA 安装 + Web Push 展示（Task 3.5）
   说明：不做激进离线缓存（避免动态内容陈旧）；仅 push 通知 + 点击聚焦。
   注册在前端（layout 引入 /sw.js）—— 属「🔌 植入」，待前端接入。 */

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = {} }
  const title = data.title || '词渊 · 复习提醒'
  const body = data.body || '今天有单词到期啦，来点亮你的词汇宇宙 ✦'
  const url = data.url || '/today'
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url },
      tag: 'lexiocean-reminder',
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/today'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) { c.navigate(url); return c.focus() } }
      return self.clients.openWindow(url)
    })
  )
})
