import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: false,
  transpilePackages: ["@careerslk/types"],
  images: {
    // Company logos are scraped from arbitrary company websites, so the
    // host can't be known ahead of time — allow any https host rather than
    // disabling optimization (images.unoptimized) entirely.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
