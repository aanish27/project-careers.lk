"use server";
import { InitialFormState } from "@web-app-types/form";
import { z } from "zod";

const JobSearchSchema = z.object({
  title: z.string({
    error: "Invalid Title or City",
  }),
  location: z.string({
    error: "Invalid Location",
  }),
});

export type JobSearch = z.infer<typeof JobSearchSchema>;

export const searchJobs = async (
  _state: InitialFormState<JobSearch>,
  formData: FormData,
) => {
  const validated = JobSearchSchema.safeParse({
    title: formData.get("title"),
    location: formData.get("location"),
  });

  if (!validated.success) {
    return z.flattenError(validated.error);
  }
};
