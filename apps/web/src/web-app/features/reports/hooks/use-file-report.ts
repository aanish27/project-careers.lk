import type { FileReportInput } from "@careerslk/types";
import { RATE_LIMIT_MESSAGE } from "@lib/messages";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { fileReport } from "../api/reports.actions";

export function useFileReport() {
  return useMutation({
    mutationFn: async (input: FileReportInput) => {
      const result = await fileReport(input);
      if ("requiresAuth" in result) throw new Error("REQUIRES_AUTH");
      if ("error" in result) throw new Error(result.error);
      return result.data;
    },
    onError: (error) => {
      if (error.message === RATE_LIMIT_MESSAGE) toast.error(error.message);
    },
  });
}
