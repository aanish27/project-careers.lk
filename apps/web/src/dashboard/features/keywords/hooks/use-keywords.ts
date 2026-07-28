import { useQuery } from "@tanstack/react-query";
import { keywordsApi } from "../api/api";
import { keywordsKeys } from "./query-keys";

export function useKeywords() {
  return useQuery({
    queryKey: keywordsKeys.lists(),
    queryFn: () => keywordsApi.list(),
  });
}
