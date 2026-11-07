import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  // GitHub Pages 프로젝트 사이트는 /<repo> 하위로 서비스된다.
  basePath: "/indie-guild",
  // 디렉터리/index.html 로 내보내 확장자 없는 URL이 Pages에서 확실히 동작하게 한다.
  trailingSlash: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
