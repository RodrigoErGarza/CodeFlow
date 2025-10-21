import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'https://rismxzrtcbjehezfutdi.supabase.co', // <-- cambia esto
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
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
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
};


export default nextConfig;

