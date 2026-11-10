import { AnnouncerProvider, Button, useAnnounce } from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";

/**
 * Announcements for screen readers, such as the result of a long operation
 * (ADR 0014). The live regions are visually hidden; turn on a screen reader
 * to hear them.
 */
const meta = { title: "Components/Announcer" } satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Actions() {
  const announce = useAnnounce();
  return (
    <div style={{ display: "flex", gap: "var(--hm-gap-normal)" }}>
      <Button onClick={() => announce("Saved 1.3 MB")}>Save</Button>
      <Button
        variant="danger"
        onClick={() => announce("Export failed. Try again.", { politeness: "assertive" })}
      >
        Fail an export
      </Button>
    </div>
  );
}

export const Announcements: Story = {
  render: () => (
    <AnnouncerProvider>
      <Actions />
    </AnnouncerProvider>
  ),
};
