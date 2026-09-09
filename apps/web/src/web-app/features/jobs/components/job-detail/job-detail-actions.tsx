"use client";

import { Button } from "@ui/button";
import {
  IconBolt,
  IconBookmark,
  IconChevronDown,
  IconShare,
} from "@tabler/icons-react";
import {
  saveJob,
  unsaveJob,
} from "@web-app-features/jobs/api/saved-jobs.actions";
import { useRequireAuth } from "@jobboard/hooks/use-require-auth";
import { useState, useTransition } from "react";
import { ShareMenu } from "../share-menu";

export function JobDetailActions({
  jobId,
  title,
  url,
  applyUrl,
}: {
  jobId: number;
  title: string;
  url: string;
  applyUrl?: string | null;
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
    <div className="flex shrink-0 items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-full"
        onClick={toggleSaved}
        disabled={isPending}
        aria-label={saved ? "Remove saved job" : "Save this job"}
      >
        <IconBookmark
          className={saved ? "fill-current" : undefined}
          aria-hidden="true"
        />
      </Button>
      <ShareMenu
        title={title}
        url={url}
        trigger={
          <Button type="button" variant="outline" className="rounded-full">
            <IconShare aria-hidden="true" />
            Share job
            <IconChevronDown className="size-3.5" aria-hidden="true" />
          </Button>
        }
      />
      {applyUrl && (
        <a
          href={applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          <IconBolt className="size-4" aria-hidden="true" />
          Quick apply
        </a>
      )}
    </div>
  );
}
