import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack: (config) => {
    // Esconde warnings típicos de sourcemaps y stackframe en dev
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Loading "stackframe" failed/,
      /error-stack-parser/,
    ];
    return config;
  },
};

export default nextConfig;

