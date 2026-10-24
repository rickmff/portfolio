import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Uploads are content-addressed (random names, never rewritten), so optimised copies can live long.
  images: { minimumCacheTTL: 31_536_000 },
  experimental: {
    serverActions: { bodySizeLimit: "42mb" },
  },
};

export default nextConfig;
