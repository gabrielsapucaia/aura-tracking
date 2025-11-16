"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { EquipmentRecord } from "@/lib/supabase/types";
import { equipmentFormSchema, equipmentUpdateSchema } from "@/lib/validators/equipment";
import { revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";

const EQUIPMENT_TAG = "equipment:list";

type EquipmentInput = z.infer<typeof equipmentFormSchema>;
type EquipmentUpdateInput = z.infer<typeof equipmentUpdateSchema>;

export const listEquipment = unstable_cache(
  async (): Promise<EquipmentRecord[]> => {
    const supabase = supabaseAdmin();

    try {
      // Query all equipment and include the related equipment_types.name via a join.
      // Use wildcard selection to avoid depending on a specific column like `seq_id`.
      const { data, error } = await supabase
        .from("equipment")
        .select("*, equipment_types(name)")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching equipment:", error);
        return [];
      }

      const rows = (data ?? []) as EquipmentRecord[];
      return rows.map((item) => ({ ...item, equipment_types: (item.equipment_types as { name: string } | null) ?? null })) as EquipmentRecord[];
    } catch (err) {
      console.error("Failed to list equipment:", err);
      return [];
    }
  },
  [EQUIPMENT_TAG],
  { tags: [EQUIPMENT_TAG] },
);

function invalidateEquipmentTag() {
  (revalidateTag as unknown as (tag: string) => void)(EQUIPMENT_TAG);
}

async function mutateAndRevalidate(operation: () => Promise<void>) {
  await operation();
  invalidateEquipmentTag();
}

export async function createEquipment(input: EquipmentInput) {
  const parsed = equipmentFormSchema.parse(input);
  const payload = { ...parsed, type_id: parsed.type_id ?? null };
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase
      .from("equipment")
      .insert(payload);

    if (error) {
      console.error("Error creating equipment:", error);
      throw new Error(error?.message || "Failed to create equipment");
    }
  });
}

export async function updateEquipment(id: string, input: EquipmentUpdateInput) {
  const parsed = equipmentUpdateSchema.parse(input);
  const payload = { ...parsed, type_id: parsed.type_id ?? null };
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase
      .from("equipment")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Error updating equipment:", error);
      throw new Error(error?.message || "Failed to update equipment");
    }
  });
}

export async function toggleEquipment(id: string) {
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { data: current, error: fetchError } = await supabase
      .from("equipment")
      .select("status")
      .eq("id", id)
      .single();

    if (fetchError) {
      console.error("Error fetching equipment for toggle:", fetchError);
      throw new Error(fetchError?.message || "Failed to fetch equipment");
    }

    const nextStatus = current?.status === "active" ? "inactive" : "active";

    const { error: updateError } = await supabase
      .from("equipment")
      .update({ status: nextStatus })
      .eq("id", id);

    if (updateError) {
      console.error("Error toggling equipment status:", updateError);
      throw new Error(updateError?.message || "Failed to toggle equipment status");
    }
  });
}

export async function deleteEquipment(id: string) {
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase.from("equipment").delete().eq("id", id);

    if (error) {
      console.error("Error deleting equipment:", error);
      throw new Error(error?.message || "Failed to delete equipment");
    }
  });
}