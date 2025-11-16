"use server";

import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Database, OperatorRecord } from "@/lib/supabase/types";
import { operatorFormSchema, operatorUpdateSchema } from "@/lib/validators/operators";
import { revalidateTag, unstable_cache } from "next/cache";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

const OPERATORS_TAG = "operators:list";
const SEQ_ID_MISSING_ERROR = "column operators.seq_id does not exist";

type OperatorInput = z.infer<typeof operatorFormSchema>;
type OperatorUpdateInput = z.infer<typeof operatorUpdateSchema>;

const numericIdSchema = z.union([z.number().int().positive(), z.string().regex(/^\d+$/)]);
let seqIdAvailable: boolean | null = null;

function normalizeOperatorId(id: unknown): number {
  const parsed = numericIdSchema.parse(id);
  return typeof parsed === "number" ? parsed : Number(parsed);
}

async function fetchOperatorsWithSeqId(client: SupabaseClient<Database>) {
  return client
    .from("operators")
    .select("id, seq_id, name, pin, status, created_at, updated_at")
    .order("seq_id", { ascending: true });
}

async function fetchOperatorsFallback(client: SupabaseClient<Database>): Promise<OperatorRecord[]> {
  const { data, error } = await client
    .from("operators")
    .select("id, name, pin, status, created_at, updated_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((operator, index) => ({
    ...operator,
    seq_id: index + 1,
  }));
}

export const listOperators = unstable_cache(
  async (): Promise<OperatorRecord[]> => {
    const supabase = supabaseAdmin();

    if (seqIdAvailable === false) {
      return fetchOperatorsFallback(supabase);
    }

    const { data, error } = await fetchOperatorsWithSeqId(supabase);

    if (error) {
      if (error.message.includes(SEQ_ID_MISSING_ERROR)) {
        seqIdAvailable = false;
        console.warn("operators.seq_id column missing; falling back to created_at ordering");
        return fetchOperatorsFallback(supabase);
      }
      throw new Error(error.message);
    }

    seqIdAvailable = true;
    return data ?? [];
  },
  [OPERATORS_TAG],
  { tags: [OPERATORS_TAG] },
);

function invalidateOperatorsTag() {
  (revalidateTag as unknown as (tag: string) => void)(OPERATORS_TAG);
}

async function mutateAndRevalidate(operation: () => Promise<void>) {
  await operation();
  invalidateOperatorsTag();
}

export async function createOperator(input: OperatorInput) {
  const payload = operatorFormSchema.parse(input);
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase
      .from("operators")
      .insert(payload);

    if (error) {
      throw new Error(error.message);
    }
  });
}

export async function updateOperator(id: number | string, input: OperatorUpdateInput) {
  const operatorId = normalizeOperatorId(id);
  const payload = operatorUpdateSchema.parse(input);
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase
      .from("operators")
      .update(payload)
      .eq("id", operatorId);

    if (error) {
      throw new Error(error.message);
    }
  });
}

export async function toggleOperator(id: number | string) {
  const operatorId = normalizeOperatorId(id);
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { data: current, error: fetchError } = await supabase
      .from("operators")
      .select("status")
      .eq("id", operatorId)
      .single();

    if (fetchError) {
      throw new Error(fetchError.message);
    }

    const nextStatus = current?.status === "active" ? "inactive" : "active";

    const { error: updateError } = await supabase
      .from("operators")
      .update({ status: nextStatus })
      .eq("id", operatorId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  });
}

export async function deleteOperator(id: number | string) {
  const operatorId = normalizeOperatorId(id);
  const supabase = supabaseAdmin();

  return mutateAndRevalidate(async () => {
    const { error } = await supabase.from("operators").delete().eq("id", operatorId);

    if (error) {
      throw new Error(error.message);
    }
  });
}
