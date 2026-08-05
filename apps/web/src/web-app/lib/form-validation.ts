import type { z } from "zod";

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors = error.flatten().fieldErrors as Record<
    string,
    string[] | undefined
  >;
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, messages]) => messages?.length)
      .map(([field, messages]) => [field, messages![0]]),
  );
}
