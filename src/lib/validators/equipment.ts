import { z } from "zod";

export const equipmentFormSchema = z.object({
  tag: z.string().trim().min(1, "Tag é obrigatório").max(100, "Máximo de 100 caracteres"),
  type_id: z.string().nullable().optional(),
  status: z.enum(["active", "inactive"]),
});

export const equipmentUpdateSchema = equipmentFormSchema.partial();

export type EquipmentFormValues = z.infer<typeof equipmentFormSchema>;
export type EquipmentUpdateValues = z.infer<typeof equipmentUpdateSchema>;