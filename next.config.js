/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
      domains: [
        'xwrbzkepfkeqtfrcsrpe.supabase.co', // Domínio do Supabase Storage
        'drive.google.com', // Para thumbnails do Google Drive
        'i.ytimg.com', // Para thumbnails do YouTube
        'img.youtube.com',
        'lh3.googleusercontent.com',
      ],
      formats: ['image/avif', 'image/webp'],
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