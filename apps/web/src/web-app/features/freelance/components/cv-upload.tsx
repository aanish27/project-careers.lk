"use client";

import { useRequireAuth } from "@jobboard/hooks/use-require-auth";
import { useWebUser } from "@jobboard/providers/web-user-provider";
import { Button } from "@ui/button";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { uploadCv } from "../api/freelance.actions";

export function CvUpload({
  currentCvUploaded,
}: {
  currentCvUploaded: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const requireAuth = useRequireAuth();
  const { openLoginModal } = useWebUser();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    requireAuth(() => {
      setError(null);
      startTransition(async () => {
        const result = await uploadCv(file);
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

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleChange}
      />
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        {isPending
          ? "Uploading…"
          : currentCvUploaded
            ? "Replace CV"
            : "Upload CV"}
      </Button>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}
