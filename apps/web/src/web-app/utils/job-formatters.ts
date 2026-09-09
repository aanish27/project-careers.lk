export function formatLocation(job: {
  district: string | null;
  city: string | null;
  province: string | null;
}): string | null {
  return job.city && job.district
    ? `${job.district}, ${job.city}`
    : (job.district ?? job.province);
}

export function formatEnumLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatSalary(job: {
  salaryRaw: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryCurrency: string | null;
}): string | null {
  if (!job.salaryRaw && !job.salaryMin) return null;
  const amount =
    job.salaryRaw ??
    `${job.salaryMin?.toLocaleString()} - ${job.salaryMax?.toLocaleString()}`;
  return job.salaryCurrency ? `${job.salaryCurrency} ${amount}` : amount;
}
