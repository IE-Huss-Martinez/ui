import {
  Field,
  IconButton,
  NumberField,
  Toolbar,
  ZoomInIcon,
  ZoomOutIcon,
} from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/**
 * A number input exposed as a spin button. Typing is committed on blur or
 * Enter, kept within `min` and `max`; text that isn't a number goes back to
 * the last value. Arrow Up and Down step, Page Up and Down take ten steps,
 * and Escape throws the typing away.
 */
const meta = {
  title: "Components/NumberField",
  component: NumberField,
  args: { label: "Copies", defaultValue: 1, min: 1, max: 99 },
} satisfies Meta<typeof NumberField>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: "grid", gap: "var(--hm-gap-loose)", maxInlineSize: "16rem" } as const;

export const Default: Story = {};

/** In a `Field`, which gives it a visible label, a description and an error. */
export const InField: Story = {
  name: "In a field",
  render: function InField() {
    const [dpi, setDpi] = useState(300);
    return (
      <div style={column}>
        <Field
          label="Resolution"
          description="Dots per inch, from 72 to 1200."
          error={dpi > 600 ? "Above 600 dpi, files get very large." : undefined}
        >
          <NumberField min={72} max={1200} step={25} value={dpi} onValueChange={setDpi} />
        </Field>
        <Field label="Resolution" error="Above 600 dpi, files get very large.">
          <NumberField min={72} max={1200} defaultValue={900} />
        </Field>
      </div>
    );
  },
};

/** The default parse and format follow the locale: German uses a decimal comma. */
export const Locale: Story = {
  render: () => (
    <div style={column}>
      <Field label="Seitenbreite (mm)" lang="de">
        <NumberField locale="de" step={0.5} defaultValue={1234.5} />
      </Field>
      <Field label="عدد النسخ" lang="ar" dir="rtl">
        <NumberField locale="ar-EG" defaultValue={42} />
      </Field>
    </div>
  ),
};

/** Decibels with a unit: the format adds it, and the parse reads it or a bare number. */
export const Units: Story = {
  render: () => (
    <div style={column}>
      <Field label="Gain">
        <NumberField
          min={-24}
          max={24}
          step={0.5}
          defaultValue={-6}
          format={(db) => `${db < 0 ? "−" : ""}${Math.abs(db)} dB`}
          parse={(text) => {
            const number = Number(text.replace(/dB/i, "").replace("−", "-").trim());
            return text.trim() === "" || Number.isNaN(number) ? undefined : number;
          }}
        />
      </Field>
    </div>
  ),
};

const pad = (n: number) => String(n).padStart(2, "0");

/** A timecode field is a `NumberField` of seconds, with its own parse and format. */
export const Timecode: Story = {
  render: () => (
    <div style={column}>
      <Field label="Start" description="Minutes and seconds, such as 1:05.">
        <NumberField
          min={0}
          max={3599}
          defaultValue={65}
          inputMode="numeric"
          format={(s) => `${Math.floor(s / 60)}:${pad(Math.round(s % 60))}`}
          parse={(text) => {
            const match = /^(\d{1,2}):([0-5]\d)$/.exec(text.trim());
            return match ? Number(match[1]) * 60 + Number(match[2]) : undefined;
          }}
        />
      </Field>
    </div>
  ),
};

/** Text fields keep the arrow keys for the caret, so Left and Right stay inside it. */
export const InToolbar: Story = {
  name: "In a toolbar",
  render: function InToolbar() {
    const [zoom, setZoom] = useState(100);
    const clamp = (n: number) => Math.min(400, Math.max(10, n));
    return (
      <Toolbar label="View">
        <IconButton
          variant="quiet"
          label="Zoom out"
          icon={<ZoomOutIcon />}
          onClick={() => setZoom(clamp(zoom - 10))}
        />
        <NumberField
          label="Zoom"
          min={10}
          max={400}
          step={10}
          value={zoom}
          onValueChange={setZoom}
          format={(percent) => `${percent}%`}
          parse={(text) => {
            const number = Number(text.replace("%", "").trim());
            return text.trim() === "" || Number.isNaN(number) ? undefined : number;
          }}
          style={{ inlineSize: "6rem" }}
        />
        <IconButton
          variant="quiet"
          label="Zoom in"
          icon={<ZoomInIcon />}
          onClick={() => setZoom(clamp(zoom + 10))}
        />
      </Toolbar>
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Visual styles dropped: the native text field, with its focus ring and target size. */
export const Unstyled: Story = {
  args: { unstyled: true },
};
