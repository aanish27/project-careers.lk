"use client";

import { Button } from "@/components/ui/button";
import { IconBookmark, IconExternalLink, IconShare } from "@tabler/icons-react";
import {
  saveJob,
  unsaveJob,
} from "@web-app-features/jobs/api/saved-jobs.actions";
import type { PublicJob } from "@web-app-features/jobs/types";
import { shareJob } from "@web-app-features/jobs/utils/share-job";
import { useRequireAuth } from "@jobboard/hooks/use-require-auth";
import Link from "next/link";
import { useState, useTransition } from "react";
import { getJobCardColors } from "./job-card-palette";
import LocationPinIcon from "./location-pin-icon";

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  full_time: "Full Time",
  part_time: "Part Time",
  contract: "Contract",
  internship: "Internship",
  freelance: "Freelance",
};

const WORK_MODE_LABELS: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-Site",
};

function formatSalary(job: PublicJob): string | null {
  const currencyPrefix = job.salaryCurrency ? `${job.salaryCurrency} ` : "";
  if (job.salaryRaw) return `${currencyPrefix}${job.salaryRaw}`.trim();
  if (job.salaryMin && job.salaryMax) {
    return `${currencyPrefix}${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`.trim();
  }
  return null;
}

const JobCard = ({ job, index }: { job: PublicJob; index: number }) => {
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const requireAuth = useRequireAuth();
  const { bg, text } = getJobCardColors(index);
  const salary = formatSalary(job);
  // Posted (web-user-submitted) jobs always route to our own detail page,
  // in a new tab, where the Apply button lives — scraped jobs keep linking
  // straight out to the company's own apply URL, unchanged.
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
    <div className={`group relative rounded-2xl ${bg} p-5 hover:shadow-lg`}>
      <div>
        <button
          onClick={toggleSaved}
          disabled={isPending}
          className="absolute top-5 right-5 z-10 rounded-lg"
          aria-label={saved ? "Remove bookmark" : "Bookmark this job"}
        >
          <IconBookmark
            className={`h-5 w-5 transition-colors ${
              saved ? "fill-neutral-900 text-neutral-900" : "text-neutral-400"
            }`}
          />
        </button>
        <button
          onClick={() => shareJob(job.title, `/jobs/${job.slug}`)}
          className="absolute top-5 right-12 z-10 rounded-lg"
          aria-label="Share this job"
        >
          <IconShare className="h-5 w-5 text-neutral-400 transition-colors" />
        </button>
      </div>

      <Link
        href={`/jobs/${job.slug}`}
        target={isPosted ? "_blank" : undefined}
        rel={isPosted ? "noopener noreferrer" : undefined}
        className="flex flex-col "
      >
        <h3 className="mb-1 text-xl font-bold text-neutral-900 text-wrap">
          {job.title}
        </h3>
        <p className={`mb-2 font-semibold ${text}`}>{job.company.name}</p>
        {job.location && (
          <p className="mb-4 flex items-center gap-1 text-sm text-neutral-600">
            <LocationPinIcon className="h-4 w-4 shrink-0" />
            {job.location}
          </p>
        )}
        {job.description && (
          <p className="mb-5 line-clamp-2 text-sm text-neutral-700 leading-relaxed">
            {job.description}
          </p>
        )}
      </Link>

      <div className="mb-6 flex flex-wrap gap-3">
        {job.workMode && (
          <span className="inline-block rounded-full bg-white bg-opacity-60 px-4 py-1.5 text-xs font-bold text-neutral-800">
            {WORK_MODE_LABELS[job.workMode] ?? job.workMode}
          </span>
        )}
        {job.employmentType && (
          <span className="inline-block rounded-full bg-white bg-opacity-60 px-4 py-1.5 text-xs font-bold text-neutral-800">
            {EMPLOYMENT_TYPE_LABELS[job.employmentType] ?? job.employmentType}
          </span>
        )}
        {salary && (
          <span className="inline-block rounded-full bg-white bg-opacity-60 px-4 py-1.5 text-xs font-bold text-neutral-800">
            {salary}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {isPosted ? (
          <Button
            render={
              <Link
                href={`/jobs/${job.slug}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Details
              </Link>
            }
            className="flex-1 rounded-lg h-10"
            nativeButton={false}
          />
        ) : job.applyUrl ? (
          <Button
            render={
              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                Apply Now <IconExternalLink />
              </a>
            }
            className="flex-1 rounded-lg bg-white text-black font-semibold h-10 hover:bg-accent"
            nativeButton={false}
          />
        ) : (
          <Button
            render={<Link href={`/jobs/${job.slug}`}>View Details</Link>}
            className="flex-1 rounded-lg h-10"
            nativeButton={false}
          />
        )}
      </div>
    </div>
  );
};

export default JobCard;
