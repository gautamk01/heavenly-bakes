const BASE = import.meta.env.VITE_CLOUDINARY_BASE_URL;

export function cloudinaryUrl(localPath: string): string {
  const filename = localPath.split("/").pop() ?? localPath;
  const transformed = filename.replace(/heavenlybakes\.by\.divya/g, "heavenlybakes_by_divya");
  return `${BASE}/${transformed}`;
}

/**
 * Insert Cloudinary transformations into a full Cloudinary URL.
 * Transforms are placed after /upload/ and before the version/path.
 */
export function cloudinaryTransformUrl(
  fullUrl: string,
  transforms: string,
): string {
  const marker = "/upload/";
  const idx = fullUrl.indexOf(marker);
  if (idx === -1) return fullUrl; // not a Cloudinary URL, return as-is
  const insertAt = idx + marker.length;
  return (
    fullUrl.slice(0, insertAt) + transforms + "/" + fullUrl.slice(insertAt)
  );
}

/** Tiny blurred placeholder (~1-2KB) */
export function lqipUrl(fullUrl: string): string {
  return cloudinaryTransformUrl(fullUrl, "w_40,q_auto,e_blur:1000,f_auto");
}

/** Optimized full-quality for gallery cards */
export function optimizedUrl(fullUrl: string): string {
  return cloudinaryTransformUrl(fullUrl, "w_800,q_auto,f_auto");
}
