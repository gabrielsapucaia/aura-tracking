import { createSupabaseServerClient } from "@/lib/supabaseServer";

export default async function MePage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: sessionData }, { data: userData }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ]);

  const session = sessionData.session;
  const user = userData.user;

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">/me</h1>
        <p className="text-sm text-gray-500">no session</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-2">
      <h1 className="text-xl font-semibold">/me</h1>
      <p className="text-sm text-gray-600">User ID: {user.id}</p>
      <p className="text-sm text-gray-600">Email: {user.email ?? "—"}</p>
      <p className="text-sm text-gray-600">Session expires at: {session?.expires_at ?? "—"}</p>
    </div>
  );
}
