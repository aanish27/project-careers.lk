"use client";

import { Button } from "@ui/button";
import { IconBookmark, IconShare } from "@tabler/icons-react";
import {
  saveJob,
  unsaveJob,
} from "@web-app-features/jobs/api/saved-jobs.actions";
import { shareJob } from "@web-app-features/jobs/utils/share-job";
import { useRequireAuth } from "@jobboard/hooks/use-require-auth";
import { useState, useTransition } from "react";

export function JobDetailActions({
  jobId,
  title,
  url,
}: {
  jobId: number;
  title: string;
  url: string;
}) {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const requireAuth = useRequireAuth();

  const toggleSaved = () => {
    requireAuth(() => {
      const next = !saved;
      setSaved(next);
      startTransition(async () => {
        const result = next ? await saveJob(jobId) : await unsaveJob(jobId);
        if ("ok" in result) return;
        setSaved(!next);
      });
    });
  };

  return (
    <div className="mb-6 flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={toggleSaved}
        disabled={isPending}
      >
        <IconBookmark
          className={saved ? "fill-current" : undefined}
          aria-hidden="true"
        />
        {saved ? "Saved" : "Save"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => shareJob(title, url)}
      >
        <IconShare aria-hidden="true" />
        Share
      </Button>
    </div>
  );
}
