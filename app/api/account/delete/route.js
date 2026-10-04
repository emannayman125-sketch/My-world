import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabaseServer";

// Deletes everything: storage files (3 buckets, each scoped to the
// user's own folder), then the auth user itself -- every table
// references auth.users(id) with "on delete cascade", so removing the
// auth user removes all of his rows across every hub automatically.
// This needs the service_role key (never exposed client-side), set
// as SUPABASE_SERVICE_ROLE_KEY in Vercel -- the anon key cannot
// delete another auth user or bypass RLS on its own.
const BUCKETS = ["memory-photos", "avatars", "library"];

export async function POST() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: "no_service_key" }, { status: 500 });
  }

  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  for (const bucket of BUCKETS) {
    const { data: files } = await admin.storage.from(bucket).list(user.id);
    if (files?.length) {
      await admin.storage.from(bucket).remove(files.map((f) => `${user.id}/${f.name}`));
    }
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "delete_failed", detail: error.message }, { status: 500 });
  }

  await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
