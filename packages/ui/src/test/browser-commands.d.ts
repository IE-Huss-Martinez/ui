// Browser commands defined in vitest.config.ts.
declare module "vitest/browser" {
  interface BrowserCommands {
    setColorScheme: (scheme: "light" | "dark") => Promise<void>;
  }
}

export {};
