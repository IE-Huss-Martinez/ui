import "@hussmartinez/ui/styles.css";
import "../src/catalogue.css";
import { ThemeProvider } from "@hussmartinez/ui/react";
import type { Decorator, Preview } from "@storybook/react-vite";
import { type ThemeChoice, themeChoices } from "../src/themes/choices.js";

/** Every story renders inside ThemeProvider, so the catalogue dogfoods it. */
const withTheme: Decorator = (Story, context) => {
  const choice = themeChoices[context.globals["theme"] as ThemeChoice] ?? themeChoices.light;
  const density = context.globals["density"] === "compact" ? "compact" : "comfortable";
  return (
    <ThemeProvider {...choice} density={density}>
      <div className="hm-catalogue-canvas">
        <Story />
      </div>
    </ThemeProvider>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Theme and colour mode",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        dynamicTitle: true,
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
          { value: "system", title: "System" },
          { value: "poster-light", title: "Poster light" },
          { value: "poster-dark", title: "Poster dark" },
        ],
      },
    },
    density: {
      description: "Density",
      toolbar: {
        title: "Density",
        icon: "component",
        dynamicTitle: true,
        items: [
          { value: "comfortable", title: "Comfortable" },
          { value: "compact", title: "Compact" },
        ],
      },
    },
  },
  initialGlobals: { theme: "light", density: "comfortable" },
  parameters: {
    layout: "fullscreen",
    // Every story is checked with axe, and a violation fails its test (ADR 0022).
    a11y: { test: "error" },
  },
};

export default preview;
