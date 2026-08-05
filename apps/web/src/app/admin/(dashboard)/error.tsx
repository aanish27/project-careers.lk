"use client";

import { Button } from "@ui/button";
import { WifiOff } from "lucide-react";
import { useEffect } from "react";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
        <WifiOff className="text-muted-foreground h-8 w-8" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-lg font-semibold">
          Something went wrong
        </h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          We couldn&apos;t load this page. This is usually a temporary
          connection issue — try again in a moment.
        </p>
      </div>
      <Button onClick={() => unstable_retry()}>Try again</Button>
    </div>
  );
}
