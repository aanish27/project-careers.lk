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
    // Every image the app renders (company logos, job images, etc.) is our
    // own S3-hosted asset — scope the allowlist to that host pattern rather
    // than wildcarding every https host.
    remotePatterns: [{ protocol: "https", hostname: "*.s3.*.amazonaws.com" }],
  },
};

export default nextConfig;
