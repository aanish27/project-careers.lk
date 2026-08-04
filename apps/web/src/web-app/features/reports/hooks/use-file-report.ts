import type { FileReportInput } from "@careerslk/types";
import { useMutation } from "@tanstack/react-query";
import { fileReport } from "../api/reports.actions";

export function useFileReport() {
  return useMutation({
    mutationFn: async (input: FileReportInput) => {
      const result = await fileReport(input);
      if ("requiresAuth" in result) throw new Error("REQUIRES_AUTH");
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
  });
}
