import { z } from "zod";

export const createRoleSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      "Lowercase alphanumeric with underscores, starting with a letter",
    ),
  name: z.string().min(2, "Required").max(100),
  description: z.string().max(500).optional(),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = z.object({
  name: z.string().min(2, "Required").max(100),
  description: z.string().max(500).optional(),
});

export type UpdateRoleFormValues = z.infer<typeof updateRoleSchema>;
