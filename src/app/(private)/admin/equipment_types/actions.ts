"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { EquipmentTypeRecord } from "@/lib/supabase/types";
import { equipmentTypeFormSchema, equipmentTypeUpdateSchema } from "@/lib/validators/equipment_types";
import { revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";

const EQUIPMENT_TYPES_TAG = "equipment_types:list";

type EquipmentTypeInput = z.infer<typeof equipmentTypeFormSchema>;
type EquipmentTypeUpdateInput = z.infer<typeof equipmentTypeUpdateSchema>;

export const listEquipmentTypes = unstable_cache(
  async (): Promise<EquipmentTypeRecord[]> => {
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("equipment_types")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error("Error fetching equipment types:", error);
      return [];
    }

    return data ?? [];
  },
  [EQUIPMENT_TYPES_TAG],
  { tags: [EQUIPMENT_TYPES_TAG] },
);

function invalidateEquipmentTypesTag() {
  (revalidateTag as unknown as (tag: string) => void)(EQUIPMENT_TYPES_TAG);
}

async function mutateAndRevalidate(operation: () => Promise<void>) {
  await operation();
  invalidateEquipmentTypesTag();
}

export async function createEquipmentType(input: EquipmentTypeInput) {
  const payload = equipmentTypeFormSchema.parse(input);
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase
      .from("equipment_types")
      .insert(payload);

    if (error) {
      console.error("Error creating equipment type:", error);
      throw new Error(error?.message || "Failed to create equipment type");
    }
  });
}

export async function updateEquipmentType(id: string | number, input: EquipmentTypeUpdateInput) {
  const payload = equipmentTypeUpdateSchema.parse(input);
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase
      .from("equipment_types")
      .update(payload)
      .eq("id", id);

    if (error) {
      console.error("Error updating equipment type:", error);
      throw new Error(error?.message || "Failed to update equipment type");
    }
  });
}

export async function deleteEquipmentType(id: string | number) {
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase.from("equipment_types").delete().eq("id", id);

    if (error) {
      console.error("Error deleting equipment type:", error);
      throw new Error(error?.message || "Failed to delete equipment type");
    }
  });
}