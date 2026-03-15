/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      // Supabase Storage — product images
      {
        protocol: 'https',
        hostname: 'xnmnklgmmeqpajxwrkir.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.yandex.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.yandex.net',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
