import { createShortcutRegistry } from "@hussmartinez/sdk-core";
import {
  Button,
  IconButton,
  RedoIcon,
  RotateLeftIcon,
  Toolbar,
  Tooltip,
  UndoIcon,
  usePlatform,
  ZoomInIcon,
} from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo } from "react";

/**
 * A tooltip shows on hover and on keyboard focus; Escape closes it (WCAG
 * 1.4.13). For an icon-only button, `type="label"` makes its text the
 * button's name. Shortcuts come from sdk-core's registry, in the platform's
 * notation.
 */
const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  args: { content: "Rotate left", children: <Button>Rotate</Button> },
  // The tooltip is in the top layer, outside the canvas.
  parameters: { visual: { capture: ".hm-tooltip:popover-open" } },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Opens the story's first tooltip, as a keyboard user would see it. */
const focusFirst = ({ canvasElement }: { canvasElement: HTMLElement }) => {
  canvasElement
    .querySelector<HTMLElement>("button[aria-labelledby], button[aria-describedby]")
    ?.focus();
};

const frame = { padding: "4rem 2rem" } as const;

/** Tools as an SDK's toolbar has them: names from tooltips, shortcuts from the registry. */
export const InToolbar: Story = {
  name: "In a toolbar",
  render: function InToolbar() {
    const platform = usePlatform();
    const shortcuts = useMemo(
      () =>
        createShortcutRegistry({
          platform,
          tools: [
            { id: "demo.undo", shortcuts: ["Mod+Z"] },
            { id: "demo.redo", shortcuts: ["Mod+Shift+Z"] },
          ],
        }),
      [platform],
    );
    return (
      <div style={frame}>
        <Toolbar label="History">
          <Tooltip type="label" content="Undo" shortcut={shortcuts.describe("demo.undo")[0]}>
            <IconButton variant="quiet" label="Undo" icon={<UndoIcon />} />
          </Tooltip>
          <Tooltip type="label" content="Redo" shortcut={shortcuts.describe("demo.redo")[0]}>
            <IconButton
              variant="quiet"
              label="Redo"
              icon={<RedoIcon />}
              disabled
              focusableWhenDisabled
            />
          </Tooltip>
          <Tooltip type="label" content="Rotate left">
            <IconButton variant="quiet" label="Rotate left" icon={<RotateLeftIcon />} />
          </Tooltip>
        </Toolbar>
      </div>
    );
  },
  play: focusFirst,
};

/** A description adds to a button's name, rather than repeating it. */
export const Description: Story = {
  render: () => (
    <div style={frame}>
      <Tooltip content="Fits the whole page in the window">
        <IconButton label="Zoom to fit" icon={<ZoomInIcon />} />
      </Tooltip>
    </div>
  ),
  play: focusFirst,
};

/** Placed below its trigger when asked, or when there's no room above. */
export const Below: Story = {
  render: () => (
    <div style={frame}>
      <Tooltip type="label" placement="bottom" content="Rotate left">
        <IconButton label="Rotate left" icon={<RotateLeftIcon />} />
      </Tooltip>
    </div>
  ),
  play: focusFirst,
};

/** Visual styles dropped: placement and behaviour remain. */
export const Unstyled: Story = {
  render: () => (
    <div style={frame}>
      <Tooltip unstyled type="label" content="Rotate left">
        <IconButton label="Rotate left" icon={<RotateLeftIcon />} />
      </Tooltip>
    </div>
  ),
  play: focusFirst,
};
