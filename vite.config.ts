import type { UserConfig } from "vite";

const base = process.env.VITE_BASE || "/";

const config: UserConfig = {
  base,
  optimizeDeps: {
    include: [
      "semver/functions/gt",
      "semver/functions/lt",
      "semver/functions/clean",
    ],
  },
};

export default config;
