import type { Job } from "@web-app-features/jobs/components/job-card";
import JobsListing from "@web-app-features/jobs/components/jobs-listing";
import type { Metadata } from "next";

const JOBS: Job[] = [
  {
    id: "1",
    title: "Java Developer",
    company: "Amazon",
    location: "Felosa Drive, Los Angeles",
    description:
      "Build cutting-edge web applications from start to finish, utilizing your expertise in both front-end and back-end technologies.",
    jobType: "Full Time",
    level: "Mid Level",
    workMode: "On-Site",
    sector: "IT & Software",
  },
  {
    id: "2",
    title: "Java Developer",
    company: "Google",
    location: "Felosa Drive, Los Angeles",
    description:
      "Build cutting-edge web applications from start to finish, utilizing your expertise in both front-end and back-end technologies.",
    jobType: "Full Time",
    level: "Mid Level",
    workMode: "Remote",
    sector: "IT & Software",
  },
  {
    id: "3",
    title: "Java Developer",
    company: "Twitter",
    location: "Felosa Drive, Los Angeles",
    description:
      "Build cutting-edge web applications from start to finish, utilizing your expertise in both front-end and back-end technologies.",
    jobType: "Part Time",
    level: "Mid Level",
    workMode: "Hybrid",
    sector: "IT & Software",
  },
  {
    id: "78",
    title: "Java Developer",
    company: "Skype",
    location: "Felosa Drive, Los Angeles",
    description:
      "Build cutting-edge web applications from start to finish, utilizing your expertise in both front-end and back-end technologies.",
    jobType: "Contract",
    level: "Mid Level",
    workMode: "Remote",
    sector: "IT & Software",
  },
  {
    id: "34",
    title: "Java Developer",
    company: "Skype",
    location: "Felosa Drive, Los Angeles",
    description:
      "Build cutting-edge web applications from start to finish, utilizing your expertise in both front-end and back-end technologies.",
    jobType: "Contract",
    level: "Mid Level",
    workMode: "Remote",
    sector: "IT & Software",
  },
  {
    id: "9",
    title: "Java Developer",
    company: "Skype",
    location: "Felosa Drive, Los Angeles",
    description:
      "Build cutting-edge web applications from start to finish, utilizing your expertise in both front-end and back-end technologies.",
    jobType: "Contract",
    level: "Mid Level",
    workMode: "Remote",
    sector: "IT & Software",
  },
  {
    id: "32",
    title: "Java Developer",
    company: "Skype",
    location: "Felosa Drive, Los Angeles",
    description:
      "Build cutting-edge web applications from start to finish, utilizing your expertise in both front-end and back-end technologies.",
    jobType: "Contract",
    level: "Mid Level",
    workMode: "Remote",
    sector: "IT & Software",
  },
  {
    id: "12",
    title: "Java Developer",
    company: "Skype",
    location: "Felosa Drive, Los Angeles",
    description:
      "Build cutting-edge web applications from start to finish, utilizing your expertise in both front-end and back-end technologies.",
    jobType: "Contract",
    level: "Mid Level",
    workMode: "Remote",
    sector: "IT & Software",
  },
  {
    id: "5",
    title: "Java Developer",
    company: "IBM",
    location: "Felosa Drive, Los Angeles",
    description:
      "Build cutting-edge web applications from start to finish, utilizing your expertise in both front-end and back-end technologies.",
    jobType: "Full Time",
    level: "Mid Level",
    workMode: "On-Site",
    sector: "IT & Software",
  },
  {
    id: "6",
    title: "Java Developer",
    company: "Apple",
    location: "Felosa Drive, Los Angeles",
    description:
      "Build cutting-edge web applications from start to finish, utilizing your expertise in both front-end and back-end technologies.",
    jobType: "Internship",
    level: "Mid Level",
    workMode: "Hybrid",
    sector: "IT & Software",
  },
];

const EMPLOYMENT_TYPE_LABELS: Record<string, string> = {
  "full-time": "Full Time",
  "part-time": "Part Time",
  contract: "Contract",
  internship: "Internship",
};

export const metadata: Metadata = {
  title: "Browse Jobs in Sri Lanka | Jobswala",
  description:
    "Explore the latest job openings across IT, engineering, sales, and more sectors in Sri Lanka. Filter by sector, location, work mode, and employment type to find your next role.",
};

type JobsPageProps = {
  searchParams: Promise<{
    sector?: string;
    location?: string;
    workMode?: string;
    employmentType?: string;
  }>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const {
    sector: activeCategory = "All Jobs",
    location = "",
    workMode = "all",
    employmentType = "all",
  } = await searchParams;

  const filteredJobs = JOBS.filter((job) => {
    const matchesCategory =
      activeCategory === "All Jobs" || job.sector === activeCategory;
    const matchesLocation = location.trim()
      ? job.location.toLowerCase().includes(location.trim().toLowerCase())
      : true;
    const matchesWorkMode = workMode === "all" || job.workMode === workMode;
    const matchesEmploymentType =
      employmentType === "all" ||
      job.jobType === EMPLOYMENT_TYPE_LABELS[employmentType];
    return (
      matchesCategory &&
      matchesLocation &&
      matchesWorkMode &&
      matchesEmploymentType
    );
  });

  return (
    <JobsListing
      jobs={filteredJobs}
      activeCategory={activeCategory}
      location={location}
      workMode={workMode}
      employmentType={employmentType}
    />
  );
}
