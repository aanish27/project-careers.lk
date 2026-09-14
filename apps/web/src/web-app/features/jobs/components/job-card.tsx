"use client";

import { buttonVariants } from "@/components/ui/button";
import { stripHtmlToText } from "@/lib/sanitize-html";
import {
  formatEnumLabel,
  formatLocation,
} from "@/web-app/utils/job-formatters";
import { useRequireAuth } from "@jobboard/hooks/use-require-auth";
import { IconBookmark, IconExternalLink, IconShare } from "@tabler/icons-react";
import {
  saveJob,
  unsaveJob,
} from "@web-app-features/jobs/api/saved-jobs.actions";
import type { PublicJob } from "@web-app-features/jobs/types";
import Link from "next/link";
import { useState, useTransition } from "react";
import { getJobCardColors } from "./job-card-palette";
import LocationPinIcon from "./location-pin-icon";
import { ShareMenu } from "./share-menu";

// Enum values are SCREAMING_SNAKE_CASE (e.g. "FULL_TIME") — turn them into
// display text ("Full Time") instead of maintaining a separate label map.

const JobCard = ({ job, index }: { job: PublicJob; index: number }) => {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const requireAuth = useRequireAuth();
  const { bg, text } = getJobCardColors(index);
  const isPosted = job.source === "POSTED";

  const toggleSaved = () => {
    requireAuth(() => {
      const next = !saved;
      setSaved(next);
      startTransition(async () => {
        const result = next ? await saveJob(job.id) : await unsaveJob(job.id);
        if ("ok" in result) return;
        // Revert on failure — including a logged-out surprise (e.g. session
        // expired between click and the server action running).
        setSaved(!next);
      });
    });
  };

  return (
    <div
      className={`flex flex-col justify-between  rounded-2xl ${bg} p-5 hover:shadow-lg `}
    >
      <div>
        <div className="flex items-baseline gap-3 justify-between">
          <h3 className="text-lg font-bold text-neutral-900 text-wrap">
            {job.title}
          </h3>
          <div className="flex gap-2">
            <button
              onClick={toggleSaved}
              disabled={isPending}
              className="rounded-lg "
              aria-label={saved ? "Remove Saved Job" : "Save this job"}
            >
              <IconBookmark
                className={`h-5 w-5 transition-colors ${
                  saved
                    ? "fill-neutral-900 text-neutral-900"
                    : "text-neutral-400"
                }`}
              />
            </button>
            <ShareMenu
              title={job.title}
              url={`/job/${job.slug}`}
              trigger={
                <button
                  type="button"
                  className="rounded-lg"
                  aria-label="Share this job"
                >
                  <IconShare className="h-5 w-5 text-neutral-400 transition-colors" />
                </button>
              }
            />
          </div>
        </div>

        <p className={`mb-2 font-semibold ${text} hover:underline`}>
          <Link href={`/companies/${job.company.slug}/jobs`}>
            {job.company.name}
          </Link>
        </p>

        {job.district && (
          <p className="mb-4 flex items-center gap-1 text-sm text-neutral-600">
            <LocationPinIcon className="h-4 w-4 shrink-0" />
            {formatLocation(job)}
          </p>
        )}
        {job.description && (
          <p className="mb-5 line-clamp-2 text-sm text-neutral-700 leading-relaxed">
            {stripHtmlToText(job.description)}
          </p>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          {job.workMode && (
            <span className="inline-block rounded-full bg-white bg-opacity-60 px-4 py-1.5 text-xs font-bold text-neutral-800">
              {formatEnumLabel(job.workMode)}
            </span>
          )}
          {job.employmentType && (
            <span className="inline-block rounded-full bg-white bg-opacity-60 px-4 py-1.5 text-xs font-bold text-neutral-800">
              {formatEnumLabel(job.employmentType)}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {isPosted ? (
          <Link
            href={`/job/${job.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ className: "flex-1 rounded-lg h-10" })}
          >
            View Details
          </Link>
        ) : job.applyUrl ? (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              className:
                "flex-1 rounded-lg bg-white text-black! font-semibold h-10 hover:bg-accent hover:text-white!",
            })}
          >
            Apply Now <IconExternalLink />
          </a>
        ) : (
          <Link
            href={`/job/${job.slug}`}
            className={buttonVariants({ className: "flex-1 rounded-lg h-10" })}
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
};

export default JobCard;
