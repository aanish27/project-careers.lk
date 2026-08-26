import { z } from "zod";

export type InitialFormState<T> = z.ZodFlattenedError<T> | undefined;
