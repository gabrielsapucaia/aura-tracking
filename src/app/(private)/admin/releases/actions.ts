"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { ReleaseRecord } from "@/lib/supabase/types";
import { releaseFormSchema, releaseUpdateSchema } from "@/lib/validators/releases";
import { revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";

const RELEASES_TAG = "releases:list";

type ReleaseInput = z.infer<typeof releaseFormSchema>;
type ReleaseUpdateInput = z.infer<typeof releaseUpdateSchema>;

export const listReleases = unstable_cache(
  async (): Promise<ReleaseRecord[]> => {
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("releases")
      .select("*, material_types(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching releases:", error);
      return [];
    }

    const rows = (data ?? []) as ReleaseRecord[];
    return rows.map((item) => ({ ...item, material_types: (item.material_types as { name: string } | null) ?? null })) as ReleaseRecord[];
  },
  [RELEASES_TAG],
  { tags: [RELEASES_TAG] },
);

function invalidateReleasesTag() {
  (revalidateTag as unknown as (tag: string) => void)(RELEASES_TAG);
}

async function mutateAndRevalidate(operation: () => Promise<void>) {
  await operation();
  invalidateReleasesTag();
}

export async function createRelease(input: ReleaseInput) {
  const payload = releaseFormSchema.parse(input);
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase
      .from("releases")
      .insert(payload);

    if (error) {
      console.error("Error creating release:", error);
      throw new Error(error?.message || "Failed to create release");
    }
  });
}

export async function updateRelease(id: number, input: ReleaseUpdateInput) {
  const payload = releaseUpdateSchema.parse(input);
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase
      .from("releases")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Error updating release:", error);
      throw new Error(error?.message || "Failed to update release");
    }
  });
}

export async function deleteRelease(id: number) {
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase.from("releases").delete().eq("id", id);

    if (error) {
      console.error("Error deleting release:", error);
      throw new Error(error?.message || "Failed to delete release");
    }
  });
}

export async function toggleRelease(id: number) {
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { data: current, error: fetchError } = await supabase
      .from("releases")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching release for toggle:", fetchError);
      throw new Error(fetchError?.message || "Failed to fetch release");
    }

    const nextStatus = current?.status === "active" ? "inactive" : "active";

    const { error: updateError } = await supabase
      .from("releases")
      .update({ status: nextStatus })
      .eq("id", id);

    if (updateError) {
      console.error("Error toggling release status:", updateError);
      throw new Error(updateError?.message || "Failed to toggle release status");
    }
  });
}