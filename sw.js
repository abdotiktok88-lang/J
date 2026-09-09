self.addEventListener('install', (e) => {
  self.skipWaiting();
});
self.addEventListener('fetch', (e) => {
  // لا نقوم بالكاش هنا حالياً لمنع تعارض فايربيز، هذا الملف وظيفته تفعيل زر التثبيت فقط.
});