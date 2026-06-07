/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Standalone output bundles the app into a self-contained folder
  // that includes only the necessary files — no node_modules needed.
  // This makes Docker images ~10x smaller (~80MB vs ~800MB).
  output: "standalone",
}

export default nextConfig
