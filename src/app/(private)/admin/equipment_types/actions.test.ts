import { describe, expect, it, beforeEach, vi } from "vitest";

const { mockSupabase, mockRevalidateTag } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
  },
  mockRevalidateTag: vi.fn(),
}));

function createBuilder() {
  const builder = {
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    select: vi.fn(() => builder),
    single: vi.fn(),
    order: vi.fn(() => Promise.resolve({ data: [], error: null })),
    eq: vi.fn(() => builder),
  };
  return builder;
}

let builderRef: ReturnType<typeof createBuilder>;

vi.mock("next/cache", () => ({
  revalidateTag: mockRevalidateTag,
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => mockSupabase,
}));

import { createEquipmentType } from "./actions";

beforeEach(() => {
  builderRef = createBuilder();
  mockSupabase.from.mockReset();
  mockSupabase.from.mockReturnValue(builderRef);
  mockRevalidateTag.mockReset();
});

describe("equipment_types actions", () => {
  it("creates an equipment type with valid payload", async () => {
    await expect(createEquipmentType({ name: "Máquina de Solda", description: "Equipamento para solda" })).resolves.toBeUndefined();

    expect(builderRef.insert).toHaveBeenCalledWith({ name: "Máquina de Solda", description: "Equipamento para solda" });
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("rejects invalid name", async () => {
    await expect(createEquipmentType({ name: "", description: "Test" })).rejects.toThrow();
    expect(builderRef.insert).not.toHaveBeenCalled();
  });
});