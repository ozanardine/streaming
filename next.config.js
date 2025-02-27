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
      'vercel.app', // Adicionando o domínio do Vercel
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
    unoptimized: process.env.NODE_ENV === 'development', // Desativa otimização em desenvolvimento
  },
  // Configurações para otimização de builds
  swcMinify: true,
  compiler: {
    // Remover console.logs em produção
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Configurações para o Vercel
  output: 'standalone', // Melhora a velocidade de build no Vercel
}

module.exports = nextConfig