import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 将 openai SDK 标记为外部依赖，避免在 Edge Runtime 中打包时出现问题。
  serverExternalPackages: ['openai'],
};

export default nextConfig;
