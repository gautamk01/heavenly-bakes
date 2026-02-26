/** Cache of resolved image URLs (Set for O(1) lookup) */
const preloadedUrls = new Set<string>();
const pendingLoads = new Map<string, Promise<void>>();

/**
 * Preload a single image into the browser cache.
 * Returns a promise that resolves when the image is cached.
 * Skips if already preloaded or in-flight.
 */
export function preloadImage(url: string): Promise<void> {
    if (preloadedUrls.has(url)) return Promise.resolve();
    if (pendingLoads.has(url)) return pendingLoads.get(url)!;

    const promise = new Promise<void>((resolve) => {
        const img = new Image();
        img.onload = () => {
            preloadedUrls.add(url);
            pendingLoads.delete(url);
            resolve();
        };
        img.onerror = () => {
            pendingLoads.delete(url);
            resolve(); // Resolve anyway — don't block on a failed image
        };
        img.src = url;
    });

    pendingLoads.set(url, promise);
    return promise;
}

/**
 * Preload multiple images in parallel.
 * Returns a promise that resolves when all images are cached.
 */
export function preloadImages(urls: string[]): Promise<void> {
    return Promise.all(urls.map(preloadImage)).then(() => { });
}

/**
 * Check if a URL has been preloaded (is in browser cache).
 */
export function isPreloaded(url: string): boolean {
    return preloadedUrls.has(url);
}
