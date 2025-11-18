import { z } from "zod";

export const releaseFormSchema = z.object({
  quota: z.number().int().positive("Cota deve ser um número positivo"),
  sequence: z.number().int().positive("Sequência deve ser um número positivo"),
  material_type_id: z.number().int().positive("Tipo de material é obrigatório"),
  planned_mass: z.number().positive("Massa Plano deve ser um número positivo").optional().nullable(),
  model_grade: z.number().positive("Teor Modelo deve ser um número positivo").optional().nullable(),
  planned_grade: z.number().positive("Teor Plano deve ser um número positivo").optional().nullable(),
  status: z.enum(["active", "inactive"]),
});

export const releaseUpdateSchema = releaseFormSchema.partial();

export type ReleaseFormValues = z.infer<typeof releaseFormSchema>;
export type ReleaseUpdateValues = z.infer<typeof releaseUpdateSchema>;