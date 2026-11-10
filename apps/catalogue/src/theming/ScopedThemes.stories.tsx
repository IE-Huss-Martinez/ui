import { ThemeProvider } from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { poster } from "../themes/poster.js";

/**
 * Themes apply to subtrees and nest; the closest theme wins (docs/adr/0001).
 * The outer theme comes from the toolbar.
 */
const meta = { title: "Theming/Scoped themes" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Panel({ label, children }: { label: string; children?: ReactNode }) {
  return (
    <div className="hm-catalogue-panel">
      <strong>{label}</strong>
      <span
        className="hm-catalogue-sample"
        style={{ background: "var(--hm-color-accent)", color: "var(--hm-color-on-accent)" }}
      >
        Accent
      </span>
      {children}
    </div>
  );
}

export const Nested: Story = {
  render: () => (
    <Panel label="From the toolbar">
      <ThemeProvider theme={poster} mode="dark">
        <Panel label="Poster, dark">
          <ThemeProvider mode="light" density="compact">
            <Panel label="Built-in light, compact">
              <div data-hm-theme="dark">
                <Panel label='data-hm-theme="dark"' />
              </div>
            </Panel>
          </ThemeProvider>
        </Panel>
      </ThemeProvider>
    </Panel>
  ),
};
