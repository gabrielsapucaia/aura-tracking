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

import { createEquipment, toggleEquipment } from "./actions";

const equipmentId = "uuid-123";

beforeEach(() => {
  builderRef = createBuilder();
  mockSupabase.from.mockReset();
  mockSupabase.from.mockReturnValue(builderRef);
  mockRevalidateTag.mockReset();
});

describe("equipment actions", () => {
  it("creates an equipment with valid payload", async () => {
    await expect(createEquipment({ tag: "Máquina 001", type_id: "550e8400-e29b-41d4-a716-446655440000", status: "active" })).resolves.toBeUndefined();

    expect(builderRef.insert).toHaveBeenCalledWith({ tag: "Máquina 001", type_id: "550e8400-e29b-41d4-a716-446655440000", status: "active" });
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("rejects invalid tag", async () => {
    await expect(createEquipment({ tag: "", type_id: "550e8400-e29b-41d4-a716-446655440000", status: "active" })).rejects.toThrow();
    expect(builderRef.insert).not.toHaveBeenCalled();
  });

  it("toggles equipment status", async () => {
    builderRef.single.mockResolvedValue({ data: { status: "active" }, error: null });

    await expect(toggleEquipment(equipmentId)).resolves.toBeUndefined();

    expect(builderRef.select).toHaveBeenCalledWith("status");
    expect(builderRef.update).toHaveBeenCalledWith({ status: "inactive" });
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});