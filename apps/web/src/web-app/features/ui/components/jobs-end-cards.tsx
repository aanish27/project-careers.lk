import { buttonVariants } from "@/components/ui/button";
import { IconArrowRight } from "@tabler/icons-react";
import Link from "next/link";

export const JobsEndCard = () => {
  return (
    <section className="py-16">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="flex flex-col justify-between gap-6 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-10">
          <div>
            <h3 className="mb-2 text-2xl font-bold">
              Looking for your next role?
            </h3>
            <p className="text-primary-foreground/80">
              Browse hundreds of live openings from companies across Sri Lanka.
            </p>
          </div>
          <Link
            href="/jobs"
            className={buttonVariants({
              variant: "secondary",
              size: "lg",
              className: "w-fit rounded-lg font-semibold",
            })}
          >
            Browse jobs <IconArrowRight className="size-4" />
          </Link>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-3xl border border-border bg-card p-8 sm:p-10">
          <div>
            <h3 className="mb-2 text-2xl font-bold text-foreground">
              Hiring for your team?
            </h3>
            <p className="text-muted-foreground">
              Post a job and reach candidates actively searching on Jobswala.
            </p>
          </div>
          <Link
            href="/account/post-job"
            className={buttonVariants({
              size: "lg",
              className: "w-fit rounded-lg font-semibold",
            })}
          >
            Post a job <IconArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
