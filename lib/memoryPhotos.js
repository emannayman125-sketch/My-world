// Journal and Memories photos live in a PRIVATE storage bucket (fixed by
// supabase/migrations/002_private_photos_and_social_links.sql). A private
// bucket has no permanent public URL, so every photo is shown through a
// short-lived signed link generated on demand, only for the owner.
const SIGNED_URL_TTL = 60 * 60; // 1 hour is plenty for one viewing session

// A value saved before the fix (a full https:// link) can no longer be
// served from a private bucket. This tells the UI to show "photo unavailable"
// instead of a broken image, for that handful of old rows only.
export function isLegacyPublicUrl(value) {
  return typeof value === "string" && /^https?:\/\//.test(value);
}

/** Resolve a stored path to a signed URL. Returns null on any failure. */
export async function signMemoryPhoto(supabase, path) {
  if (!path || isLegacyPublicUrl(path)) return null;
  try {
    const { data, error } = await supabase.storage
      .from("memory-photos")
      .createSignedUrl(path, SIGNED_URL_TTL);
    return error ? null : data?.signedUrl || null;
  } catch {
    return null;
  }
}

/** Resolve many rows' `image_url` (a path) at once. Returns { [id]: url|null }. */
export async function signMemoryPhotos(supabase, rows, idKey = "id", pathKey = "image_url") {
  const entries = await Promise.all(
    rows
      .filter((r) => r[pathKey])
      .map(async (r) => [r[idKey], await signMemoryPhoto(supabase, r[pathKey])])
  );
  return Object.fromEntries(entries);
}
