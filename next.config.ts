import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rismxzrtcbjehezfutdi.supabase.co", // tu host actual
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },

  // 👇 ignora ESLint solo durante el build de producción (Vercel)
  eslint: {
    ignoreDuringBuilds: true,
  },

  /* si algún día tuvieras errores de TypeScript que bloqueen
     el build y solo quieres desplegar, puedes activar esto,
     pero NO es recomendable a largo plazo:
  typescript: {
    ignoreBuildErrors: true,
  },
  */

  webpack: (config) => {
    // Si ya tienes esto, déjalo tal cual
    config.ignoreWarnings = [
      /Failed to parse source map/,
      /Loading "stackframe" failed/,
      /error-stack-parser/,
    ];
    return config;
  },
};

export default nextConfig;
