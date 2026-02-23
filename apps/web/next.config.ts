import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@afenda/core", "@afenda/contracts"],
    serverExternalPackages: [],
    images: {
        formats: ["image/avif", "image/webp"],
    },
};

export default nextConfig;
