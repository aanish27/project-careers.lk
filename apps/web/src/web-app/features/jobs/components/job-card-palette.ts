export const JOB_CARD_PALETTE: { bg: string; text: string }[] = [
  { bg: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-purple-50", text: "text-purple-700" },
  { bg: "bg-orange-50", text: "text-orange-700" },
  { bg: "bg-teal-50", text: "text-teal-700" },
  { bg: "bg-indigo-50", text: "text-indigo-700" },
  { bg: "bg-pink-50", text: "text-pink-700" },
  { bg: "bg-lime-50", text: "text-lime-700" },
];

// Cycling by index guarantees zero repeats within any window of up to
// JOB_CARD_PALETTE.length (9) consecutive cards — covers both the jobs
// grid's 2x3 (6-card) and the homepage's 4-column layout with no extra logic.
// If "Load More" is ever wired up to REPLACE the list with a freshly
// re-indexed-from-0 page (rather than appending to the existing one), the
// last few cards of the old page and first few of the new page could
// collide — append, don't replace, to keep this guarantee.
export const getJobCardColors = (index: number) =>
  JOB_CARD_PALETTE[index % JOB_CARD_PALETTE.length];
