import { z } from "zod";

export const equipmentTypeFormSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Máximo de 100 caracteres"),
  description: z.string().optional(),
});

export const equipmentTypeUpdateSchema = equipmentTypeFormSchema.partial();

export type EquipmentTypeFormValues = z.infer<typeof equipmentTypeFormSchema>;
export type EquipmentTypeUpdateValues = z.infer<typeof equipmentTypeUpdateSchema>;