"use client";

import type { PublicJob } from "@web-app-features/jobs/types";
import { Button } from "@/components/ui/button";
import { IconBookmark, IconExternalLink, IconShare } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
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
  if (job.salaryRaw) return job.salaryRaw;
  if (job.salaryMin && job.salaryMax) {
    return `${job.salaryCurrency ?? ""} ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}`.trim();
  }
  return null;
}

const JobCard = ({ job, index }: { job: PublicJob; index: number }) => {
  const [saved, setSaved] = useState(false);
  const { bg, text } = getJobCardColors(index);
  const salary = formatSalary(job);

  return (
    <div className={`group relative rounded-2xl ${bg} p-5 hover:shadow-lg`}>
      <div>
        <button
          onClick={() => setSaved((prev) => !prev)}
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
          className="absolute top-5 right-12 z-10 rounded-lg"
          aria-label="Share this job"
        >
          <IconShare className="h-5 w-5 text-neutral-400 transition-colors" />
        </button>
      </div>

      <Link href={`/jobs/${job.slug}`} className="block">
        {job.company.logoUrl && (
          <Image
            src={job.company.logoUrl}
            alt={`${job.company.name} logo`}
            width={40}
            height={40}
            className="mb-3 h-10 w-10 rounded-lg object-contain bg-white"
          />
        )}

        <h3 className="mb-1 text-xl font-bold text-neutral-900">{job.title}</h3>

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
        {job.applyUrl ? (
          <Button
            render={
              <a href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                Apply Now <IconExternalLink />
              </a>
            }
            className="flex-1 rounded-lg bg-white text-black font-semibold h-10 hover:bg-accent"
          />
        ) : (
          <Button
            render={<Link href={`/jobs/${job.slug}`}>View Details</Link>}
            className="flex-1 rounded-lg h-10"
          />
        )}
      </div>
    </div>
  );
};

export default JobCard;
