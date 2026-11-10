import type { StorybookConfig } from "@storybook/react-vite";
import { uiSourceAliases } from "../ui-source.js";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/**/*.mdx", "../src/**/*.stories.tsx"],
  addons: ["@storybook/addon-docs", "@storybook/addon-a11y", "@storybook/addon-vitest"],
  core: {
    // No network requests (ADR 0012), from the tooling either.
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    resolve: {
      ...viteConfig.resolve,
      alias: [...uiSourceAliases, ...toAliasArray(viteConfig.resolve?.alias)],
    },
  }),
};

function toAliasArray(alias: unknown): { find: string | RegExp; replacement: string }[] {
  if (Array.isArray(alias)) {
    return alias;
  }
  if (alias && typeof alias === "object") {
    return Object.entries(alias as Record<string, string>).map(([find, replacement]) => ({
      find,
      replacement,
    }));
  }
  return [];
}

export default config;
