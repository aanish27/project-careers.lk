import { z } from 'zod';

// Format-validated optional string fields (z.url(), z.email(), z.iso.datetime(), …)
// only treat `undefined` as "not set" — an empty string still has to pass the
// format check and fails it. Forms naturally default these fields to `""`,
// so without this an untouched optional field blocks submission.
//
// Built with `z.union(...).transform(...)` rather than `z.preprocess` —
// preprocess widens the schema's inferred *input* type to `unknown`, which
// then no longer matches its *output* type (`z.infer`). Resolvers (e.g.
// `zodResolver`) key off both, and libraries like react-hook-form assume
// input/output line up unless told otherwise — so the widened input silently
// breaks type inference for consumers using a single `z.infer` generic.
// `.transform()` on a union keeps the input type equal to the union's own
// members, so it stays `string | undefined` in and out.
export function emptyToUndefined<T extends z.ZodTypeAny>(schema: T) {
  return (
    z
      .union([z.literal(''), schema])
      .transform((value) => (value === '' ? undefined : value))
      // Restores the outermost `ZodOptional` transform/union strips off, so
      // `z.object` still infers this as an optional key (`key?:`) rather than
      // a required key typed `key: T | undefined` — otherwise structurally
      // different enough to break exact-type consumers like `zodResolver`.
      .optional()
  );
}
