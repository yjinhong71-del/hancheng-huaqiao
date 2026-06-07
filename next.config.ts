import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static exports? No, we need server for SQLite
  // SQLite path for Railway volume
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
