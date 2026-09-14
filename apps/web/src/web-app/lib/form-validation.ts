import { z } from "zod";

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors = z.treeifyError(error) as Record<
    string,
    string[] | undefined
  >;
  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter(([, messages]) => messages?.length)
      .map(([field, messages]) => [field, messages![0]]),
  );
}

// Blank/missing fields resolve to `undefined` (never `null`) so the result
// lines up with zod's `.optional()` — `numberFields` are parsed with
// `parseInt`, since `z.coerce.number()` would turn a blank field into `0`
// instead of leaving it unset.
export function extractFormData({
  fieldNames,
  formData,
  additionalFields = {},
  trimStrings = true,
  numberFields = [],
  booleanFields = [],
}: {
  fieldNames: string[];
  formData: FormData;
  additionalFields?: Record<string, unknown>;
  trimStrings?: boolean;
  numberFields?: string[];
  booleanFields?: string[];
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {};

  for (const field of fieldNames) {
    let value = formData.get(field);

    // Always a real boolean (never `undefined`) — an unchecked box must be
    // able to explicitly persist `false` rather than being silently dropped.
    if (booleanFields.includes(field)) {
      payload[field] = value !== null;
      continue;
    }

    if (typeof value === "string") {
      if (trimStrings) value = value.trim();
      if (value === "") value = null;
    }

    if (numberFields.includes(field)) {
      const parsed =
        typeof value === "string" ? Number.parseInt(value, 10) : NaN;
      payload[field] = Number.isNaN(parsed) ? undefined : parsed;
      continue;
    }

    payload[field] = value ?? undefined;
  }

  return { ...payload, ...additionalFields };
}
