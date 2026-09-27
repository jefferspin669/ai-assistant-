/**
 * Object storage: Supabase Storage when configured, else simulation.
 * S3-compatible env vars are reserved for a later adapter.
 */

import { createClient } from "@supabase/supabase-js";

export function objectStoreConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim()) &&
      process.env.SUPABASE_STORAGE_BUCKET?.trim(),
  );
}

export async function uploadObject(input: {
  path: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType?: string;
}): Promise<{ ok: true; path: string; simulated: boolean } | { ok: false; error: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_ANON_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  if (!url || !key || !bucket) {
    return { ok: true, path: input.path, simulated: true };
  }
  try {
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.storage.from(bucket).upload(input.path, input.body, {
      contentType: input.contentType,
      upsert: true,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, path: input.path, simulated: false };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "upload failed" };
  }
}
