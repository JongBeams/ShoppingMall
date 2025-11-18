import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig['images']>['remotePatterns'] = [
  {
    protocol: 'https',
    hostname: 'images.unsplash.com',
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  try {
    const hostname = new URL(supabaseUrl).hostname;
    remotePatterns.push({
      protocol: 'https',
      hostname,
    });
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL, skipping image config for Supabase:', error);
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  output: 'standalone', // For Docker production builds
};

export default nextConfig;
