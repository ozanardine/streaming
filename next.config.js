/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'xwrbzkepfkeqtfrcsrpe.supabase.co',
      'drive.google.com',
      'i.ytimg.com',
      'img.youtube.com',
      'lh3.googleusercontent.com',
    ],
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Configurações para otimização de builds
  swcMinify: true,
  compiler: {
    // Remover console.logs em produção
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Habilitar experiência de streaming para SSR
  experimental: {
    // Estas configurações podem mudar em versões futuras do Next.js
    scrollRestoration: true,
  },
}

module.exports = nextConfig