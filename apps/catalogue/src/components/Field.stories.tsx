import { Field, Slider } from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/**
 * A label, a description and an error, wired to one control. `ui` controls
 * connect themselves; other controls take the props from function children.
 */
const meta = {
  title: "Components/Field",
  component: Field,
  args: { label: "Volume", children: <Slider defaultValue={40} /> },
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: "grid", gap: "var(--hm-gap-loose)", maxInlineSize: "20rem" } as const;

export const Default: Story = {};

export const WithDescription: Story = {
  name: "With a description",
  args: { label: "Resolution", description: "Higher values make larger files." },
  render: (args) => (
    <div style={column}>
      <Field {...args}>
        <Slider
          min={72}
          max={600}
          step={6}
          defaultValue={300}
          formatValue={(dpi) => `${dpi} dpi`}
        />
      </Field>
    </div>
  ),
};

/** The error is read after the description, and the control is marked invalid. */
export const WithError: Story = {
  name: "With an error",
  render: function WithError() {
    const [gain, setGain] = useState(12);
    return (
      <div style={column}>
        <Field
          label="Gain"
          description="Between −24 and 24 dB."
          error={gain > 6 ? "Above 6 dB, the export may clip." : undefined}
        >
          <Slider min={-24} max={24} value={gain} onValueChange={setGain} />
        </Field>
      </div>
    );
  },
};

/** Any labelable control, with the props spread from function children. */
export const NativeControl: Story = {
  name: "Native control",
  render: () => (
    <div style={column}>
      <Field label="Page size" description="For new documents.">
        {(control) => (
          <select {...control} defaultValue="a4">
            <option value="a4">A4</option>
            <option value="letter">Letter</option>
          </select>
        )}
      </Field>
    </div>
  ),
};

/** Visual styles dropped: the layout and the wiring remain. */
export const Unstyled: Story = {
  render: () => (
    <div style={column}>
      <Field label="Volume" description="For playback only." error="Muted by the system." unstyled>
        <Slider defaultValue={40} />
      </Field>
    </div>
  ),
};
