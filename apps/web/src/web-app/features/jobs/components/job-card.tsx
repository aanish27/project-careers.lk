"use client";

import { Button } from "@/components/ui/button";
import { IconBookmark, IconExternalLink, IconShare } from "@tabler/icons-react";
import { useState } from "react";
import { getJobCardColors } from "./job-card-palette";
import LocationPinIcon from "./location-pin-icon";

export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  jobType: string;
  level: string;
  workMode?: string;
  sector: string;
};

const JobCard = ({ job, index }: { job: Job; index: number }) => {
  const [saved, setSaved] = useState(false);
  const { bg, text } = getJobCardColors(index);

  return (
    <div className={`group rounded-2xl ${bg} p-5 hover:shadow-lg`}>
      {/* Bookmark Button */}
      <div>
        <button
          onClick={() => setSaved((prev) => !prev)}
          className="absolute top-5 right-5 z-10  rounded-lg "
        >
          <IconBookmark
            className={`h-5 w-5 transition-colors ${
              saved ? "fill-neutral-900 text-neutral-900" : "text-neutral-400"
            }`}
          />
        </button>
        <button
          onClick={() => setSaved((prev) => !prev)}
          className="absolute top-5 right-5 z-10  rounded-lg "
        >
          <IconShare
            className={`h-5 w-5 transition-colors  ${
              saved ? "fill-neutral-900 text-neutral-900" : "text-neutral-400"
            }`}
          />
        </button>
      </div>

      {/* Job Title */}
      <h3 className="mb-1 text-xl font-bold text-neutral-900">{job.title}</h3>

      {/* Company Name */}
      <p className={`mb-2 font-semibold ${text}`}>{job.company}</p>

      {/* Location */}
      <p className="mb-4 flex items-center gap-1 text-sm text-neutral-600">
        <LocationPinIcon className="h-4 w-4 shrink-0" />
        {job.location}
      </p>

      {/* Description */}
      <p className="mb-5 line-clamp-2 text-sm text-neutral-700 leading-relaxed">
        {job.description}
      </p>

      {/* Job Type and Level */}
      <div className="mb-6 flex gap-3">
        <span className="inline-block rounded-full bg-white bg-opacity-60 px-4 py-1.5 text-xs font-bold text-neutral-800">
          {job.workMode}
        </span>
        <span className="inline-block rounded-full bg-white bg-opacity-60 px-4 py-1.5 text-xs font-bold text-neutral-800">
          {job.jobType}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button className="flex-1 rounded-lg  bg-white text-black font-semibold h-10 hover:bg-accent">
          Apply Now <IconExternalLink />
        </Button>
      </div>
    </div>
  );
};

export default JobCard;
