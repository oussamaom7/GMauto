import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its font metrics (.afm) files from disk relative to its own
  // module location at runtime; bundling it breaks that path resolution.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
