import { IconButton, Slider, ToggleButton, Toolbar } from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useId, useState } from "react";
import { LoopIcon, PlayIcon } from "../icons.js";

/**
 * A native range input. Arrow keys move by `step`, Page Up and Page Down by
 * a tenth of the range, Home and End to the ends. `formatValue` gives screen
 * readers the value as text.
 */
const meta = {
  title: "Components/Slider",
  component: Slider,
  args: { label: "Volume", defaultValue: 40 },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: "grid", gap: "var(--hm-gap-normal)", maxInlineSize: "20rem" } as const;
const labelRow = { display: "flex", justifyContent: "space-between" } as const;

/** Decibels with a real minus sign, as a screen reader should hear them. */
const decibels = (db: number) => (db === 0 ? "0 dB" : `${db < 0 ? "−" : "+"}${Math.abs(db)} dB`);

export const Default: Story = {};

/** A visible label and value. Screen readers hear "−6 dB", not "-6". */
export const FormattedValue: Story = {
  name: "Formatted value",
  render: function FormattedValue() {
    const id = useId();
    const [gain, setGain] = useState(-6);
    return (
      <div style={column}>
        <div style={labelRow}>
          <label htmlFor={id}>Gain</label>
          <output htmlFor={id}>{decibels(gain)}</output>
        </div>
        <Slider
          id={id}
          min={-24}
          max={24}
          step={0.5}
          largeStep={6}
          value={gain}
          onValueChange={setGain}
          formatValue={decibels}
        />
      </div>
    );
  },
};

export const Steps: Story = {
  render: () => (
    <div style={column}>
      <Slider
        label="Zoom"
        min={25}
        max={400}
        step={25}
        defaultValue={100}
        formatValue={(v) => `${v}%`}
      />
    </div>
  ),
};

/** Mirrored: the minimum is on the right, and the arrow keys follow it. */
export const RightToLeft: Story = {
  name: "Right to left",
  render: () => (
    <div dir="rtl" style={column}>
      <Slider label="Volume" defaultValue={25} />
    </div>
  ),
};

/** The slider keeps its arrow keys, so it goes last. */
export const InToolbar: Story = {
  name: "In a toolbar",
  render: function InToolbar() {
    const [volume, setVolume] = useState(80);
    return (
      <Toolbar label="Player">
        <IconButton variant="quiet" label="Play" icon={<PlayIcon />} />
        <ToggleButton variant="quiet" label="Loop" icon={<LoopIcon />} />
        <Slider
          label="Volume"
          value={volume}
          onValueChange={setVolume}
          formatValue={(v) => `${v}%`}
          style={{ inlineSize: "8rem" }}
        />
      </Toolbar>
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Visual styles dropped: the native slider, with its focus ring and target size. */
export const Unstyled: Story = {
  args: { unstyled: true },
};
