import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  void initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /** 动态目标详情等链接使用模板字符串；关闭严格路由类型以避免各处断言 */
  typedRoutes: false,
};

export default nextConfig;
