"use client";

import { useRequireAuth } from "@jobboard/hooks/use-require-auth";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { Button } from "@ui/button";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { uploadPortfolioFiles } from "../api/freelance.actions";

export function PortfolioUpload({
  currentCount,
  maxFiles = 5,
}: {
  currentCount: number;
  maxFiles?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const requireAuth = useRequireAuth();
  const { openLoginModal } = useWebUser();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    requireAuth(() => {
      setError(null);
      startTransition(async () => {
        const result = await uploadPortfolioFiles(files);
        if ("requiresAuth" in result) {
          openLoginModal();
          return;
        }
        if ("error" in result) {
          setError(result.error);
          return;
        }
        router.refresh();
      });
    });
  };

  const atLimit = currentCount >= maxFiles;

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isPending || atLimit}
        onClick={() => inputRef.current?.click()}
      >
        {isPending
          ? "Uploading…"
          : atLimit
            ? `Portfolio full (${maxFiles} max)`
            : "Add portfolio files"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
