import { Button, IconButton } from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { BoldIcon, DownloadIcon, RotateIcon, TrashIcon } from "../icons.js";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Button" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = { display: "flex", flexWrap: "wrap", gap: "var(--hm-gap-normal)" } as const;

export const Variants: Story = {
  render: () => (
    <div style={row}>
      <Button variant="primary">Export</Button>
      <Button>Cancel</Button>
      <Button variant="quiet">More</Button>
      <Button variant="danger">Delete</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={row}>
      <Button variant="primary">Medium</Button>
      <Button variant="primary" size="small">
        Small
      </Button>
    </div>
  ),
};

export const WithIcons: Story = {
  name: "With icons",
  render: () => (
    <div style={row}>
      <Button variant="primary" startIcon={<DownloadIcon />}>
        Download
      </Button>
      <Button variant="danger" startIcon={<TrashIcon />}>
        Delete page
      </Button>
    </div>
  ),
};

/** A toggle button: `pressed` is exposed as `aria-pressed`. */
export const Toggle: Story = {
  render: function Toggle() {
    const [bold, setBold] = useState(true);
    return (
      <div style={row}>
        <Button
          variant="quiet"
          pressed={bold}
          startIcon={<BoldIcon />}
          onClick={() => setBold(!bold)}
        >
          Bold
        </Button>
        <Button pressed={false}>Off</Button>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={row}>
      <Button variant="primary" disabled>
        Disabled
      </Button>
      <Button disabled focusableWhenDisabled>
        Focusable when disabled
      </Button>
    </div>
  ),
};

export const IconButtons: Story = {
  name: "Icon buttons",
  render: () => (
    <div style={row}>
      <IconButton label="Rotate" icon={<RotateIcon />} />
      <IconButton variant="quiet" label="Bold" icon={<BoldIcon />} pressed />
      <IconButton variant="primary" label="Download" icon={<DownloadIcon />} />
      <IconButton size="small" variant="quiet" label="Delete" icon={<TrashIcon />} />
    </div>
  ),
};

/** Visual styles dropped: layout, focus ring and target size remain. */
export const Unstyled: Story = {
  render: () => (
    <div style={row}>
      <Button unstyled>Unstyled</Button>
      <IconButton unstyled label="Rotate" icon={<RotateIcon />} />
    </div>
  ),
};
