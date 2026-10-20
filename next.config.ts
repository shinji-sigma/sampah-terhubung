import type { NextConfig } from "next";
const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline' https://unpkg.com;
  img-src 'self' blob: data: https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://unpkg.com;
  font-src 'self';
  connect-src 'self' https://*.supabase.co;
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const config: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          {
            key: "Permissions-Policy",
            value: "camera=(self), geolocation=(self), microphone=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};
export default config;
