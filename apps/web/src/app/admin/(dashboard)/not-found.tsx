import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { Button } from "@ui/button";

export default function DashboardNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full">
        <FileQuestion className="text-muted-foreground h-8 w-8" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-foreground text-lg font-semibold">
          Page not found
        </h1>
        <p className="text-muted-foreground max-w-sm text-sm">
          This page doesn&apos;t exist, or you don&apos;t have access to it.
        </p>
      </div>
      <Button render={<Link href="/admin">Back to dashboard</Link>} />
    </div>
  );
}
