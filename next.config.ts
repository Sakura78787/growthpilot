import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  void initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 关掉 typedRoutes，因为目标详情页的动态路由用模板字符串拼的
  typedRoutes: false,
};

export default nextConfig;
