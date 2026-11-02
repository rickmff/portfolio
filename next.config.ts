import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy. `frame-ancestors 'none'` is the clickjacking fix: no other site may
 * put these pages in a frame. Scripts and styles keep 'unsafe-inline' because Next's hydration
 * payload, the JSON-LD and the seasonal gate scripts are inline and the pages are static (a
 * nonce would force every page to render per request). Images and video may come from any
 * https host: covers and post images can point at Open Library, Google Books or wherever.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  // The book page looks up a Google Books preview from the visitor's browser.
  `connect-src 'self' https://www.googleapis.com${dev ? " ws: wss:" : ""}`,
  // Google Books' embedded viewer, opened on the book page.
  "frame-src https://books.google.com https://www.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  // Admin sign-in redirects through Google's OAuth screen.
  "form-action 'self' https://accounts.google.com",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // Older browsers that ignore frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  // Uploads are content-addressed (random names, never rewritten), so optimised copies can live long.
  images: {
    minimumCacheTTL: 31_536_000,
    // On Vercel, uploads live in Vercel Blob (public stores serve from this host).
    remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }],
  },
  experimental: {
    serverActions: { bodySizeLimit: "42mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
