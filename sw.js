const CACHE_NAME = 'evosustain-shell-v2'
const scopeUrl = new URL(self.registration.scope)
const APP_SHELL = [scopeUrl.href, new URL('manifest.webmanifest', scopeUrl).href, new URL('icons/icon.svg', scopeUrl).href]
const ASSET_PREFIX = new URL('assets/', scopeUrl).pathname
const SHELL_URL = scopeUrl.href

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))))
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return
  if (!url.pathname.startsWith(scopeUrl.pathname)) return
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(SHELL_URL, response.clone()))
      return response
    }).catch(async () => (await caches.match(SHELL_URL)) || Response.error()))
    return
  }
  if (url.pathname.startsWith(ASSET_PREFIX) || APP_SHELL.includes(url.href)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
      return response
    })))
  }
})
