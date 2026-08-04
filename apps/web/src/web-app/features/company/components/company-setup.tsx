"use client";

import { Button } from "@ui/button";
import { useState } from "react";
import { CompanyForm } from "./company-form";
import { CompanySearch } from "./company-search";

export function CompanySetup() {
  const [mode, setMode] = useState<"search" | "create">("search");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "search" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("search")}
        >
          Search for my company
        </Button>
        <Button
          type="button"
          variant={mode === "create" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("create")}
        >
          Create a new company
        </Button>
      </div>
      {mode === "search" ? <CompanySearch /> : <CompanyForm />}
    </div>
  );
}
