const CACHE_NAME = 'foodscience-cache-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Amiri:ital,wght@0,700;1,400&family=Aref+Ruqaa:wght@700&family=Noto+Naskh+Arabic:wght@700&family=Reem+Kufi:wght@700&display=swap',
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js'
];

// تثبيت وحفظ الملفات في الكاش
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

// تفعيل وتنظيف الكاش القديم
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// الاستجابة للطلبات من الكاش أولاً في حالة انقطاع الإنترنت
self.addEventListener('fetch', (event) => {
    // استثناء طلبات قاعدة بيانات Firebase المباشرة
    if (event.request.url.includes('firebaseio.com') || event.request.url.includes('googleapis.com/identitytoolkit')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(event.request).then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // في حالة انقطاع النت تماماً
                return caches.match('./index.html');
            });
        })
    );
});