import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // Cloudflare Pages 不支持 Next.js 图片优化端点
    formats: ['image/avif', 'image/webp'],
    // 优化：减少 deviceSizes，匹配实际显示尺寸
    deviceSizes: [640, 750, 828, 1080],
    // 优化：减少 imageSizes，卡片不需要太大
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 允许外部头像域名（Supabase Auth 使用 GitHub/Google 等 OAuth 头像）
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default nextConfig;
