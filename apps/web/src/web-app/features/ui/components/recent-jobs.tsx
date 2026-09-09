import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import JobCard from "../../jobs/components/job-card";
import { PublicJob } from "../../jobs/types";

const RecentJobs = ({ recentJobs }: { recentJobs: PublicJob[] }) => {
  return (
    <section className="flex flex-col gap-10">
      <div className="text-left">
        <h2 className="text-4xl font-extrabold tracking-tight text-foreground">
          Recent Jobs
        </h2>
        <p className="text-lg text-muted-foreground">
          The latest openings, added daily.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {recentJobs.map((job, index) => (
          <JobCard key={job.id} job={job} index={index} />
        ))}
      </div>
      <div className="flex justify-center">
        <Link
          href="/jobs"
          className={buttonVariants({
            size: "lg",
            variant: "outline",
            className: "rounded-lg border-2 font-semibold",
          })}
        >
          View more jobs
        </Link>
      </div>
    </section>
  );
};

export default RecentJobs;
