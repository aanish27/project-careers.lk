import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Must be at least 8 characters")
  .max(128)
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&._\-#])/,
    "Must contain an uppercase letter, a lowercase letter, a number, and a special character (@$!%*?&._-#)",
  );

export const createUserSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: passwordSchema,
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
