"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { MaterialTypeRecord } from "@/lib/supabase/types";
import { materialTypeFormSchema, materialTypeUpdateSchema } from "@/lib/validators/material_types";
import { revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";

const MATERIAL_TYPES_TAG = "material_types:list";

type MaterialTypeInput = z.infer<typeof materialTypeFormSchema>;
type MaterialTypeUpdateInput = z.infer<typeof materialTypeUpdateSchema>;

export const listMaterialTypes = unstable_cache(
  async (): Promise<MaterialTypeRecord[]> => {
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("material_types")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching material types:", error);
      return [];
    }

    return data ?? [];
  },
  [MATERIAL_TYPES_TAG],
  { tags: [MATERIAL_TYPES_TAG] },
);

function invalidateMaterialTypesTag() {
  (revalidateTag as unknown as (tag: string) => void)(MATERIAL_TYPES_TAG);
}

async function mutateAndRevalidate(operation: () => Promise<void>) {
  await operation();
  invalidateMaterialTypesTag();
}

export async function createMaterialType(input: MaterialTypeInput) {
  const payload = materialTypeFormSchema.parse(input);
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase
      .from("material_types")
      .insert(payload);

    if (error) {
      console.error("Error creating material type:", error);
      throw new Error(error?.message || "Failed to create material type");
    }
  });
}

export async function updateMaterialType(id: string, input: MaterialTypeUpdateInput) {
  const payload = materialTypeUpdateSchema.parse(input);
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase
      .from("material_types")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Error updating material type:", error);
      throw new Error(error?.message || "Failed to update material type");
    }
  });
}

export async function deleteMaterialType(id: string) {
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase.from("material_types").delete().eq("id", id);

    if (error) {
      console.error("Error deleting material type:", error);
      throw new Error(error?.message || "Failed to delete material type");
    }
  });
}

export async function toggleMaterialType(id: string) {
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { data: current, error: fetchError } = await supabase
      .from("material_types")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching material type for toggle:", fetchError);
      throw new Error(fetchError?.message || "Failed to fetch material type");
    }

    const nextStatus = current?.status === "active" ? "inactive" : "active";

    const { error: updateError } = await supabase
      .from("material_types")
      .update({ status: nextStatus })
      .eq("id", id);

    if (updateError) {
      console.error("Error toggling material type status:", updateError);
      throw new Error(updateError?.message || "Failed to toggle material type status");
    }
  });
}