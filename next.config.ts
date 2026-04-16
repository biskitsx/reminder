import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  allowedDevOrigins: ['frugally-cover-pleading.ngrok-free.dev'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'profile.line-scdn.net' },
      { protocol: 'https', hostname: 'is1-ssl.mzstatic.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'play-lh.googleusercontent.com' },
      { protocol: 'https', hostname: 'yt3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
