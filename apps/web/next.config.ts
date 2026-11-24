import type { NextConfig } from "next";

const config: NextConfig = {
  transpilePackages: ["@tbt/engine", "@tbt/glyphs", "@tbt/content", "@tbt/ui"],
  reactStrictMode: true,
};
export default config;
