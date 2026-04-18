/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "logo.clearbit.com" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.microlink.io" },
      { protocol: "https", hostname: "iad.microlink.io" },
    ],
  },
};

export default nextConfig;
