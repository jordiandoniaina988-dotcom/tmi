const C='tmi-v4';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html','./logo.png','./manifest.json'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.hostname.endsWith('supabase.co'))return;
 // Réseau d'abord (toujours la dernière version), cache en secours hors ligne
 e.respondWith(fetch(e.request).then(r=>{const k=r.clone();caches.open(C).then(c=>c.put(e.request,k));return r}).catch(()=>caches.match(e.request).then(h=>h||(e.request.mode==='navigate'?caches.match('./index.html'):null)).then(h=>h||(e.request.mode==='navigate'?new Response('<meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><title>Hors ligne</title><body style="font-family:system-ui;text-align:center;padding:22vh 24px"><h2>Vous êtes hors ligne</h2><p>L\'application ne peut pas s\'ouvrir sans connexion Internet.</p>',{headers:{'Content-Type':'text/html;charset=utf-8'}}):Response.error()))));
});
