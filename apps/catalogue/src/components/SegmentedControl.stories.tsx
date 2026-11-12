import { PageGridIcon, PageSingleIcon, SegmentedControl } from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/**
 * A radio group: one Tab stop on the selected option, and arrow keys move and
 * select. The selected option also has a border, so it doesn't rely on
 * colour alone.
 */
const meta = { title: "Components/SegmentedControl" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Example(props: { size?: "small"; icons?: boolean; disabled?: boolean }) {
  const [value, setValue] = useState<"single" | "double" | "grid">("double");
  return (
    <SegmentedControl
      label="View"
      size={props.size}
      value={value}
      onValueChange={setValue}
      options={[
        {
          value: "single",
          label: "Single",
          disabled: props.disabled ?? false,
          ...(props.icons ? { icon: <PageSingleIcon /> } : {}),
        },
        { value: "double", label: "Double" },
        { value: "grid", label: "Grid", ...(props.icons ? { icon: <PageGridIcon /> } : {}) },
      ]}
    />
  );
}

export const Text: Story = { render: () => <Example /> };

export const WithIcons: Story = { name: "With icons", render: () => <Example icons /> };

export const Small: Story = { render: () => <Example size="small" /> };

/** Disabled options are skipped by the arrow keys. */
export const DisabledOption: Story = {
  name: "Disabled option",
  render: () => <Example disabled />,
};

export const IconsOnly: Story = {
  name: "Icons only",
  render: function IconsOnly() {
    const [value, setValue] = useState<"single" | "grid">("grid");
    return (
      <SegmentedControl
        label="View"
        value={value}
        onValueChange={setValue}
        options={[
          { value: "single", label: "Single page", icon: <PageSingleIcon />, hideLabel: true },
          { value: "grid", label: "Grid", icon: <PageGridIcon />, hideLabel: true },
        ]}
      />
    );
  },
};
