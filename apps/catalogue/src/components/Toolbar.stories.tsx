import {
  Button,
  IconButton,
  PageGridIcon,
  PageSingleIcon,
  RedoIcon,
  RotateLeftIcon,
  SegmentedControl,
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  UndoIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { BoldIcon } from "../icons.js";

/**
 * One Tab stop for the whole toolbar; arrow keys move between items, Home and
 * End jump to the ends. The segmented control joins the same arrow-key
 * navigation, and Space or Enter selects.
 */
const meta = { title: "Components/Toolbar", component: Toolbar } satisfies Meta<typeof Toolbar>;

export default meta;
type Story = StoryObj<typeof meta>;

function EditorToolbar() {
  const [view, setView] = useState<"single" | "grid">("single");
  const [bold, setBold] = useState(false);
  return (
    <Toolbar label="Page tools">
      <ToolbarGroup label="History">
        <IconButton variant="quiet" label="Undo" icon={<UndoIcon />} />
        <IconButton
          variant="quiet"
          label="Redo"
          icon={<RedoIcon />}
          disabled
          focusableWhenDisabled
        />
      </ToolbarGroup>
      <ToolbarSeparator />
      <ToolbarGroup label="Zoom">
        <IconButton variant="quiet" label="Zoom out" icon={<ZoomOutIcon />} />
        <IconButton variant="quiet" label="Zoom in" icon={<ZoomInIcon />} />
      </ToolbarGroup>
      <ToolbarSeparator />
      <IconButton
        variant="quiet"
        label="Bold"
        icon={<BoldIcon />}
        pressed={bold}
        onClick={() => setBold(!bold)}
      />
      <IconButton variant="quiet" label="Rotate" icon={<RotateLeftIcon />} />
      <ToolbarSeparator />
      <SegmentedControl
        label="View"
        size="small"
        value={view}
        onValueChange={setView}
        options={[
          { value: "single", label: "Single page", icon: <PageSingleIcon />, hideLabel: true },
          { value: "grid", label: "Grid", icon: <PageGridIcon />, hideLabel: true },
        ]}
      />
      <ToolbarSeparator />
      <Button variant="primary" size="small">
        Export
      </Button>
    </Toolbar>
  );
}

export const Editor: Story = {
  args: { label: "Page tools" },
  render: () => <EditorToolbar />,
};

export const Vertical: Story = {
  args: { label: "Tools" },
  render: () => (
    <div style={{ display: "inline-block" }}>
      <Toolbar label="Tools" orientation="vertical">
        <IconButton variant="quiet" label="Undo" icon={<UndoIcon />} />
        <IconButton variant="quiet" label="Redo" icon={<RedoIcon />} />
        <ToolbarSeparator />
        <IconButton variant="quiet" label="Rotate" icon={<RotateLeftIcon />} />
      </Toolbar>
    </div>
  ),
};

/** Visual styles dropped: layout, focus rings and target sizes remain. */
export const Unstyled: Story = {
  args: { label: "Tools" },
  render: () => (
    <Toolbar label="Tools" unstyled>
      <IconButton variant="quiet" label="Undo" icon={<UndoIcon />} />
      <ToolbarSeparator />
      <IconButton variant="quiet" label="Rotate" icon={<RotateLeftIcon />} />
    </Toolbar>
  ),
};
