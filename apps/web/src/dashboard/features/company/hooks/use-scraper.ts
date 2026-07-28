import { toMessage } from "@dashboard/utils/to-message";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { scraperApi } from "../api/api";
import { companyKeys } from "./query-keys";

export function useScrapeCompanyJob(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => scraperApi.scrapeJob(companyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      toast.success(data.message);
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to queue job scrape")),
  });
}

export function useScrapeCompany(companyId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => scraperApi.scrapeCompany(companyId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      toast.success(data.message);
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to queue job scrape")),
  });
}

export function useScrapeCompanyJobs(companyIds: number[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => scraperApi.scrapeJobs(companyIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      toast.success(data.message);
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to queue job scrapes")),
  });
}

export function useScrapeCompanies(companyIds: number[]) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => scraperApi.scrapeCompanies(companyIds),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: companyKeys.lists() });
      toast.success(data.message);
    },
    onError: (error) =>
      toast.error(toMessage(error, "Failed to queue company scrapes")),
  });
}
