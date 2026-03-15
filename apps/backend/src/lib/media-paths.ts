/**
 * Derive thumbnail path from main media path.
 * Convention: {tenant_id}/{uuid}.webp → {tenant_id}/thumbs/{uuid}.webp
 */
export function getThumbnailPath(mainPath: string): string {
  const lastSlash = mainPath.lastIndexOf('/');
  if (lastSlash === -1) return mainPath;
  const dir = mainPath.slice(0, lastSlash);
  const filename = mainPath.slice(lastSlash + 1);
  return `${dir}/thumbs/${filename}`;
}
