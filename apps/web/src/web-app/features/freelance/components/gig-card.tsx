import Link from "next/link";
import type { PublicGig } from "../types";

export function GigCard({ gig }: { gig: PublicGig }) {
  return (
    <Link
      href={`/freelance/gigs/${gig.slug}`}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-foreground">{gig.title}</h3>
        {gig.category && (
          <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {gig.category}
          </span>
        )}
      </div>
      {gig.description && (
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {gig.description}
        </p>
      )}
      {gig.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {gig.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
      {(gig.budgetMin || gig.budgetMax) && (
        <p className="text-sm font-semibold text-foreground">
          {gig.budgetMin ?? ""}
          {gig.budgetMin && gig.budgetMax ? "–" : ""}
          {gig.budgetMax ?? ""} {gig.budgetCurrency ?? ""}
        </p>
      )}
    </Link>
  );
}
