import type { SavedJobEntry } from "@web-app-lib/web-user-client";
import Link from "next/link";

export function SavedJobsList({ savedJobs }: { savedJobs: SavedJobEntry[] }) {
  if (savedJobs.length === 0) {
    return <p className="text-sm text-muted-foreground">No saved jobs yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {savedJobs.map((entry) => (
        <li key={entry.id}>
          <Link
            href={`/jobs/${entry.job.slug}`}
            className="flex items-center justify-between gap-3 rounded-md border border-border p-3 hover:bg-muted"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{entry.job.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {entry.job.company.name}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
