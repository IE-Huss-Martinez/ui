import {
  HighlighterIcon,
  IconButton,
  LoopIcon,
  PauseIcon,
  PenIcon,
  PlayIcon,
  ToggleButton,
  Toolbar,
  ToolbarSeparator,
} from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { BoldIcon } from "../icons.js";

/**
 * A button that turns something on or off, exposed as `aria-pressed`. Its
 * label stays the same in both states; screen readers announce the state.
 */
const meta = {
  title: "Components/ToggleButton",
  component: ToggleButton,
  args: { children: "Loop" },
} satisfies Meta<typeof ToggleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const row = { display: "flex", flexWrap: "wrap", gap: "var(--hm-gap-normal)" } as const;

/** Off and on in each variant. The on state has a border as well as a fill. */
export const States: Story = {
  render: () => (
    <div style={{ display: "grid", gap: "var(--hm-gap-normal)" }}>
      {(["secondary", "quiet"] as const).map((variant) => (
        <div key={variant} style={row}>
          <ToggleButton variant={variant} startIcon={<BoldIcon />}>
            Bold
          </ToggleButton>
          <ToggleButton variant={variant} startIcon={<BoldIcon />} defaultPressed>
            Bold
          </ToggleButton>
          <ToggleButton variant={variant} label="Loop" icon={<LoopIcon />} />
          <ToggleButton variant={variant} label="Loop" icon={<LoopIcon />} defaultPressed />
        </div>
      ))}
    </div>
  ),
};

/** Controlled with `pressed` and `onPressedChange`. */
export const Controlled: Story = {
  render: function Controlled() {
    const [loop, setLoop] = useState(true);
    return (
      <ToggleButton
        variant="quiet"
        pressed={loop}
        onPressedChange={setLoop}
        startIcon={<LoopIcon />}
      >
        Loop
      </ToggleButton>
    );
  },
};

/**
 * A media player's toolbar. Play and pause is an `IconButton` whose label
 * and icon change, not a toggle button: a toggle's label must stay the
 * same. Loop and the tools are toggle buttons; pressing the active tool
 * again turns it off.
 */
export const InToolbar: Story = {
  name: "In a toolbar",
  render: function InToolbar() {
    const [playing, setPlaying] = useState(false);
    const [loop, setLoop] = useState(false);
    const [tool, setTool] = useState<"pen" | "highlighter" | null>("pen");
    const toggleTool = (name: "pen" | "highlighter") => (on: boolean) => setTool(on ? name : null);
    return (
      <Toolbar label="Player">
        <IconButton
          variant="quiet"
          label={playing ? "Pause" : "Play"}
          icon={playing ? <PauseIcon /> : <PlayIcon />}
          onClick={() => setPlaying(!playing)}
        />
        <ToggleButton
          variant="quiet"
          label="Loop"
          icon={<LoopIcon />}
          pressed={loop}
          onPressedChange={setLoop}
        />
        <ToolbarSeparator />
        <ToggleButton
          variant="quiet"
          label="Pen"
          icon={<PenIcon />}
          pressed={tool === "pen"}
          onPressedChange={toggleTool("pen")}
        />
        <ToggleButton
          variant="quiet"
          label="Highlighter"
          icon={<HighlighterIcon />}
          pressed={tool === "highlighter"}
          onPressedChange={toggleTool("highlighter")}
        />
      </Toolbar>
    );
  },
};

export const Disabled: Story = {
  render: () => (
    <div style={row}>
      <ToggleButton disabled defaultPressed>
        Disabled
      </ToggleButton>
      <ToggleButton disabled focusableWhenDisabled label="Loop" icon={<LoopIcon />} />
    </div>
  ),
};

/** Visual styles dropped: layout, focus ring and target size remain. */
export const Unstyled: Story = {
  render: () => (
    <div style={row}>
      <ToggleButton unstyled defaultPressed>
        Unstyled
      </ToggleButton>
      <ToggleButton unstyled label="Loop" icon={<LoopIcon />} />
    </div>
  ),
};
