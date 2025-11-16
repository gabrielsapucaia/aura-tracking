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

import { createOperator, toggleOperator } from "./actions";

const operatorId = 7;

beforeEach(() => {
  builderRef = createBuilder();
  mockSupabase.from.mockReset();
  mockSupabase.from.mockReturnValue(builderRef);
  mockRevalidateTag.mockReset();
});

describe("operators actions", () => {
  it("creates an operator with valid payload", async () => {
    await expect(createOperator({ name: "Joana Lima", pin: "1234", status: "active" })).resolves.toBeUndefined();

    expect(builderRef.insert).toHaveBeenCalledWith({ name: "Joana Lima", pin: "1234", status: "active" });
    expect(mockRevalidateTag).toHaveBeenCalled();
  });

  it("rejects invalid pin", async () => {
    await expect(createOperator({ name: "Jo", pin: "12", status: "active" })).rejects.toThrow();
    expect(builderRef.insert).not.toHaveBeenCalled();
  });

  it("toggles operator status", async () => {
    builderRef.single.mockResolvedValue({ data: { status: "active" }, error: null });

    await expect(toggleOperator(operatorId)).resolves.toBeUndefined();

    expect(builderRef.select).toHaveBeenCalledWith("status");
    expect(builderRef.update).toHaveBeenCalledWith({ status: "inactive" });
    expect(mockRevalidateTag).toHaveBeenCalled();
  });
});
