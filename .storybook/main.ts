import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-docs",
    "@storybook/addon-onboarding",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest"
  ],
  "framework": {
    "name": "@storybook/nextjs-vite",
    "options": {}
  },
  "staticDirs": [
    "../public"
  ],
  "webpackFinal": async (config) => {
    // Ensure aliases work in Storybook
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": "/src",
        "@/components": "/src/components",
        "@/lib": "/src/lib",
        "@/hooks": "/src/hooks",
        "@/contexts": "/src/contexts",
        "@/types": "/src/types",
        "@/config": "/src/config",
        "@/data": "/src/data",
        "@/server": "/src/server",
        "@/middleware": "/src/middleware",
        "@/navigation": "/src/navigation",
      };
    }
    return config;
  },
  "viteFinal": async (config) => {
    // Ensure aliases work in Vite
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "@": "/src",
        "@/components": "/src/components",
        "@/lib": "/src/lib",
        "@/hooks": "/src/hooks",
        "@/contexts": "/src/contexts",
        "@/types": "/src/types",
        "@/config": "/src/config",
        "@/data": "/src/data",
        "@/server": "/src/server",
        "@/middleware": "/src/middleware",
        "@/navigation": "/src/navigation",
      };
    }
    return config;
  },
};
export default config;