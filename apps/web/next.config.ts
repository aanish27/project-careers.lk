import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  experimental: {
    // Turbopack's persistent disk cache (RocksDB-style SST files) is on by
    // default since Next 16.1 and grew to 6.6GB, then corrupted itself once
    // the disk filled and compaction started failing. Disabled to avoid
    // unbounded .next/cache growth during dev.
    turbopackFileSystemCacheForDev: false,
  },
  transpilePackages: ["@careerslk/types"],
  images: {
    // Company logos are scraped from arbitrary company websites, so the
    // host can't be known ahead of time — allow any https host rather than
    // disabling optimization (images.unoptimized) entirely.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
