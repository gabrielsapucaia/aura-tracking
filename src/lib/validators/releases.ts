import { z } from "zod";

export const releaseFormSchema = z.object({
  quota: z.number().int().positive("Cota deve ser um número positivo"),
  sequence: z.number().int().positive("Sequência deve ser um número positivo"),
  material_type_id: z.number().int().positive("Tipo de material é obrigatório"),
  status: z.enum(["active", "inactive"]),
});

export const releaseUpdateSchema = releaseFormSchema.partial();

export type ReleaseFormValues = z.infer<typeof releaseFormSchema>;
export type ReleaseUpdateValues = z.infer<typeof releaseUpdateSchema>;