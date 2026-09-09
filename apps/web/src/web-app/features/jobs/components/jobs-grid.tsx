import JobCard from "@web-app-features/jobs/components/job-card";
import type { PublicJob } from "@web-app-features/jobs/types";

type JobsGridProps = {
  jobs: PublicJob[];
  isFetching?: boolean;
};

const JobsGrid = ({ jobs, isFetching = false }: JobsGridProps) => {
  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 transition-opacity"
      style={{ opacity: isFetching ? 0.6 : 1 }}
    >
      {jobs.map((job, index) => (
        <JobCard key={job.id} job={job} index={index} />
      ))}
    </div>
  );
};

export default JobsGrid;
