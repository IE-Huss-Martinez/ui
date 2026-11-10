import { Button, ProgressBar, Spinner } from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Progress for long operations (STANDARDS: UX). A spinner when the amount is
 * unknown; a progress bar when it's known, on the native `<progress>`.
 */
const meta = { title: "Components/Progress" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: "grid", gap: "var(--hm-gap-loose)", maxInlineSize: "24rem" } as const;
const row = { display: "flex", alignItems: "center", gap: "var(--hm-gap-normal)" } as const;

export const Spinners: Story = {
  render: () => (
    <div style={row}>
      <Spinner />
      <Spinner label="Loading pages" style={{ ["--hm-spinner-size" as string]: "2rem" }} />
      <Button disabled startIcon={<Spinner label="Saving" />}>
        Saving
      </Button>
    </div>
  ),
};

export const ProgressBars: Story = {
  name: "Progress bars",
  render: () => (
    <div style={column}>
      <ProgressBar value={0} label="Not started" />
      <ProgressBar value={40} label="Exporting" valueText="Page 4 of 10" />
      <ProgressBar value={100} label="Done" />
      <ProgressBar label="Preparing" />
    </div>
  ),
};
