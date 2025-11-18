import { z } from "zod";

export const materialTypeFormSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Máximo de 100 caracteres"),
  description: z.string().optional(),
  status: z.enum(["active", "inactive"]),
});

export const materialTypeUpdateSchema = materialTypeFormSchema.partial();

export type MaterialTypeFormValues = z.infer<typeof materialTypeFormSchema>;
export type MaterialTypeUpdateValues = z.infer<typeof materialTypeUpdateSchema>;