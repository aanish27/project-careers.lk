"use client";

import type { CompanySearchResult } from "@web-app-lib/web-user-client";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { Button } from "@ui/button";
import { Input } from "@ui/input";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { claimCompany, searchCompanies } from "../api/company.actions";

export function CompanySearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompanySearchResult[] | null>(null);
  const [error, setError] = useState<string | undefined>();
  const [claimMessage, setClaimMessage] = useState<
    Record<number, string | undefined>
  >({});
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { openLoginModal } = useWebUser();

  const runSearch = () => {
    if (!query.trim()) return;
    setError(undefined);
    startTransition(async () => {
      const result = await searchCompanies(query.trim());
      if ("requiresAuth" in result) {
        openLoginModal();
        return;
      }
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setResults(result.results);
    });
  };

  const handleClaim = (companyId: number) => {
    startTransition(async () => {
      const result = await claimCompany(companyId);
      if ("requiresAuth" in result) {
        openLoginModal();
        return;
      }
      if ("error" in result) {
        setClaimMessage((prev) => ({ ...prev, [companyId]: result.error }));
        return;
      }
      if (result.result.status === "APPROVED") {
        setClaimMessage((prev) => ({
          ...prev,
          [companyId]: "Linked! Refreshing…",
        }));
        router.refresh();
        return;
      }
      setClaimMessage((prev) => ({
        ...prev,
        [companyId]: "Request sent — pending admin review.",
      }));
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder="Search for your company by name"
        />
        <Button
          type="button"
          variant="outline"
          onClick={runSearch}
          disabled={isPending}
        >
          Search
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {results && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No companies found — try creating a new one instead.
        </p>
      )}
      {results && results.length > 0 && (
        <ul className="flex flex-col gap-2">
          {results.map((company) => (
            <li
              key={company.id}
              className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{company.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {company.websiteUrl}
                </p>
                {claimMessage[company.id] && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {claimMessage[company.id]}
                  </p>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleClaim(company.id)}
              >
                Claim
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
