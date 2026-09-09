"use client";

import { cn } from "@/lib/utils";
import type { SeoSectorStat } from "@/web-app/features/seo/types";
import { slugify } from "@careerslk/lib/slugify";
import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

// Each carousel slide shows 3 sectors stacked; a dot per slide (not per
// sector) keeps the dot row compact even when bySector carries many sectors.
const GROUP_SIZE = 3;

export const StatsCarousel = ({
  stats,
  autoplay = true,
  className,
}: {
  stats: SeoSectorStat[];
  autoplay?: boolean;
  className?: string;
}) => {
  const groups = useMemo(() => {
    // Drop a trailing partial group — a slide with fewer than GROUP_SIZE
    // sectors looks broken next to the full ones.
    const fullLength = Math.floor(stats.length / GROUP_SIZE) * GROUP_SIZE;
    const chunks: SeoSectorStat[][] = [];
    for (let i = 0; i < fullLength; i += GROUP_SIZE) {
      chunks.push(stats.slice(i, i + GROUP_SIZE));
    }
    return chunks;
  }, [stats]);

  const [active, setActive] = useState(0);

  const handleNext = () => setActive((prev) => (prev + 1) % groups.length);
  const handlePrev = () =>
    setActive((prev) => (prev - 1 + groups.length) % groups.length);

  useEffect(() => {
    if (!autoplay || groups.length <= 1) return;
    const interval = setInterval(handleNext, 4000);
    return () => clearInterval(interval);
  }, [autoplay, groups.length]);

  if (groups.length === 0) return null;

  return (
    <div className={cn("w-72 rounded-3xl bg-white p-6 shadow-2xl", className)}>
      <div className="relative min-h-40 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="flex flex-col gap-4"
          >
            {groups[active].map(({ sector, count }) => {
              const href = `/jobs/sector/${slugify(sector)}`;
              return (
                <div key={sector}>
                  <Link href={href}>
                    <span className="text-2xl font-extrabold text-neutral-900">
                      {count.toLocaleString()}
                    </span>{" "}
                    <span className="text-sm font-semibold text-neutral-500">
                      jobs
                    </span>
                  </Link>
                  <Link href={href} className="text-sm text-neutral-500 block">
                    in {sector}
                  </Link>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-1.5">
          {groups.map((_, index) => (
            <span
              key={index}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === active ? "w-4 bg-primary" : "w-1.5 bg-neutral-200",
              )}
            />
          ))}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous stats"
            className="group/button flex size-7 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200"
          >
            <IconArrowLeft className="size-4 text-neutral-600 transition-transform duration-300 group-hover/button:-translate-x-0.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next stats"
            className="group/button flex size-7 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200"
          >
            <IconArrowRight className="size-4 text-neutral-600 transition-transform duration-300 group-hover/button:translate-x-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
