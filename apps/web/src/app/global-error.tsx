"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center font-sans">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-gray-500">
            The app hit an unexpected error. This is usually a temporary
            connection issue — try again in a moment.
          </p>
        </div>
        <button
          onClick={() => unstable_retry()}
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
