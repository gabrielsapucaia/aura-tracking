import { z } from "zod";

export const operatorFormSchema = z.object({
  name: z.string().trim().min(3, "Mínimo de 3 caracteres").max(60, "Máximo de 60 caracteres"),
  pin: z.string().regex(/^\d{4}$/, "PIN deve conter 4 dígitos"),
  status: z.enum(["active", "inactive"]),
});

export const operatorUpdateSchema = operatorFormSchema.partial();

export type OperatorFormValues = z.infer<typeof operatorFormSchema>;
export type OperatorUpdateValues = z.infer<typeof operatorUpdateSchema>;
