/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: ".",
  },
  allowedDevOrigins: [
    '*.trycloudflare.com',
  ],
};

export default nextConfig;
