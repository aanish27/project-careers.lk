"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

/** Placeholder skeleton rows shown while the initial data load is in flight. */
export function SkeletonRows({
  rowCount,
  columnCount,
  padding,
}: {
  rowCount: number;
  columnCount: number;
  padding: string;
}) {
  return (
    <>
      {Array.from({ length: Math.max(1, rowCount) }).map((_, rowIndex) => (
        <TableRow key={rowIndex} className="hover:bg-transparent">
          {Array.from({ length: Math.max(1, columnCount) }).map(
            (__, colIndex) => (
              <TableCell key={colIndex} className={padding}>
                <Skeleton className="h-4 w-full max-w-48" />
              </TableCell>
            ),
          )}
        </TableRow>
      ))}
    </>
  );
}
