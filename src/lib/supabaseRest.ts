export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function sbSelect<T = unknown>(table: string, select = "*"): Promise<T> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST ${table} failed: ${res.status} ${text}`);
  }
  return res.json() as Promise<T>;
}
