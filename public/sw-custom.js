/**
 * Custom Service Worker Logic for On-Demand Full Precaching
 * 
 * This file is injected into the generated Service Worker to add
 * the ability to download and cache all site assets on-demand when
 * the user opts in to "Full Offline Mode".
 * 
 * IMPORTANT: We use the same precache that Workbox uses so files
 * are served properly by precacheAndRoute().
 */

// Listen for message from the page to enable full offline mode
self.addEventListener('message', async (event) => {
    if (event.data?.type === 'ENABLE_FULL_OFFLINE') {
        const urls = event.data.urls || [];
        const port = event.ports[0];

        if (!port) {
            console.error('[SW] No message port provided');
            return;
        }

        console.log(`[SW] Starting full offline cache for ${urls.length} URLs`);

        try {
            // Use Workbox's precache - this is the cache that precacheAndRoute() serves from
            // It's named like: "alltools-precache-v2-https://example.com/"
            // Exclude old "alltools-precache-full" caches from previous implementation
            const cacheNames = await caches.keys();
            const precacheName = cacheNames.find(name =>
                name.includes('alltools-precache') &&
                name.includes('-v') &&  // Workbox adds version like -v2-
                !name.includes('-full')  // Exclude old full caches
            );

            if (!precacheName) {
                throw new Error('Workbox precache not found');
            }

            console.log(`[SW] Using cache: ${precacheName}`);
            const cache = await caches.open(precacheName);

            let cached = 0;
            const total = urls.length;
            const failedUrls = [];

            // Cache each URL sequentially with progress updates
            for (const url of urls) {
                try {
                    // Check if already cached
                    const cachedResponse = await cache.match(url);
                    if (!cachedResponse) {
                        await cache.add(url);
                    }

                    cached++;

                    // Send progress update every 5 files or on last file
                    if (cached % 5 === 0 || cached === total) {
                        const percent = Math.round((cached / total) * 100);
                        port.postMessage({
                            type: 'PRECACHE_PROGRESS',
                            percent: percent,
                            cached: cached,
                            total: total
                        });
                    }
                } catch (error) {
                    console.warn(`[SW] Failed to cache ${url}:`, error.message);
                    failedUrls.push(url);
                    cached++; // Still increment to keep progress moving
                }
            }

            // Send completion message
            port.postMessage({
                type: 'PRECACHE_DONE',
                cached: cached,
                total: total,
                failed: failedUrls.length,
                cacheName: precacheName
            });

            console.log(`[SW] Full offline cache complete. Cached: ${cached}/${total}, Failed: ${failedUrls.length}`);

        } catch (error) {
            console.error('[SW] Error during full offline caching:', error);
            port.postMessage({
                type: 'PRECACHE_ERROR',
                error: error.message
            });
        }
    }

    // Handle request to check if full cache exists
    if (event.data?.type === 'CHECK_FULL_CACHE') {
        const port = event.ports[0];

        try {
            const cacheNames = await caches.keys();
            const precacheName = cacheNames.find(name =>
                name.includes('alltools-precache') &&
                name.includes('-v') &&
                !name.includes('-full')
            );

            if (!precacheName) {
                port.postMessage({
                    type: 'FULL_CACHE_STATUS',
                    exists: false,
                    count: 0
                });
                return;
            }

            const cache = await caches.open(precacheName);
            const keys = await cache.keys();

            port.postMessage({
                type: 'FULL_CACHE_STATUS',
                exists: keys.length > 0,
                count: keys.length,
                cacheName: precacheName
            });
        } catch (error) {
            port.postMessage({
                type: 'FULL_CACHE_STATUS',
                exists: false,
                count: 0,
                error: error.message
            });
        }
    }
});

// Clean up old -full caches from previous implementation
self.addEventListener('activate', async (event) => {
    console.log('[SW] Activating and cleaning up old caches');

    event.waitUntil((async () => {
        const cacheNames = await caches.keys();
        const oldFullCaches = cacheNames.filter(name => name.includes('-full'));

        if (oldFullCaches.length > 0) {
            console.log(`[SW] Deleting ${oldFullCaches.length} old -full caches:`, oldFullCaches);
            await Promise.all(oldFullCaches.map(name => caches.delete(name)));
            console.log('[SW] Old -full caches deleted');
        }
    })());
});

console.log('[SW] Custom full offline caching logic loaded');

