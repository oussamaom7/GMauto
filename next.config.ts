import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // pdfkit reads its font metrics (.afm) files from disk relative to its own
  // module location at runtime; bundling it breaks that path resolution.
  // sharp ships platform-native binaries that must stay external too.
  serverExternalPackages: ["pdfkit", "sharp"],
  experimental: {
    serverActions: {
      // Next.js defaults Server Action bodies to 1MB, but our own upload
      // validation (src/lib/upload.ts) allows photos up to 5MB — without
      // raising this, any photo over ~1MB (a normal phone camera photo)
      // passes our check and then gets rejected by Next.js itself with a
      // raw 500 before our code even runs. +1MB of headroom for
      // multipart/form-data overhead.
      bodySizeLimit: "6mb",
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
