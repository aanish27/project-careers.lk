import Link from "next/link";
import type { PublicFreelancerProfile } from "../types";

export function FreelancerCard({
  profile,
}: {
  profile: PublicFreelancerProfile;
}) {
  return (
    <Link
      href={`/freelance/freelancers/${profile.slug}`}
      className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <div>
        {profile.category && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {profile.category}
          </span>
        )}
      </div>
      {profile.bio && (
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {profile.bio}
        </p>
      )}
      {profile.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {profile.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium"
            >
              {skill}
            </span>
          ))}
        </div>
      )}
      {profile.rate && (
        <p className="text-sm font-semibold text-foreground">
          {profile.rate} {profile.rateCurrency ?? ""}
        </p>
      )}
    </Link>
  );
}
