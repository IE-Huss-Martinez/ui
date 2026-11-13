import { Field, TextField } from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/** A single-line text input. In a `Field`, it takes the field's label, description and error. */
const meta = {
  title: "Components/TextField",
  component: TextField,
  args: { label: "File name", defaultValue: "report" },
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;

const column = { display: "grid", gap: "var(--hm-gap-loose)", maxInlineSize: "20rem" } as const;

export const Default: Story = {};

/** With a visible label, a description and live validation. */
export const InField: Story = {
  name: "In a field",
  render: function InField() {
    const [name, setName] = useState("report/final");
    return (
      <div style={column}>
        <Field
          label="File name"
          description="Without the extension."
          error={name.includes("/") ? "A name can't contain /." : undefined}
        >
          <TextField value={name} onValueChange={setName} autoComplete="off" />
        </Field>
        <Field label="Search">
          <TextField type="search" placeholder="Page text" />
        </Field>
      </div>
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Visual styles dropped: the native input, with its focus ring and target size. */
export const Unstyled: Story = {
  args: { unstyled: true },
};
