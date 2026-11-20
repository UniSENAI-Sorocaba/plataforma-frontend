import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    useTypeScriptCli: false,
  },
  async rewrites() {
    const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";
    return [
      { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
      { source: "/actuator/:path*", destination: `${backendUrl}/actuator/:path*` },
    ];
  },
};

export default nextConfig;
