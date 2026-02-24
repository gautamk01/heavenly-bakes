const BASE = import.meta.env.VITE_CLOUDINARY_BASE_URL;

export function cloudinaryUrl(localPath: string): string {
  const filename = localPath.split("/").pop() ?? localPath;
  const transformed = filename.replace(/heavenlybakes\.by\.divya/g, "heavenlybakes_by_divya");
  return `${BASE}/${transformed}`;
}
