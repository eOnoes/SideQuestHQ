/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  allowedDevOrigins: [
    '*.trycloudflare.com',
  ],
};

export default nextConfig;
