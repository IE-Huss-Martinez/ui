import { Button, DeleteIcon, Dialog } from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { type ReactNode, useState } from "react";

/**
 * A modal dialog on the native `<dialog>` element: focus moves in and is
 * trapped, the page behind is inert, Escape asks to close, and focus returns
 * to the button that opened it.
 */
const meta = {
  title: "Components/Dialog",
  // A modal dialog paints in the top layer, outside the story's canvas, so
  // visual tests capture the dialog itself.
  parameters: { visual: { capture: "dialog[open]" } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Example({
  title,
  description,
  size,
  footer,
  children,
}: {
  title: string;
  description?: string;
  size?: "small" | "large";
  footer?: (close: () => void) => ReactNode;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        size={size}
        footer={footer?.(() => setOpen(false))}
      >
        {children}
      </Dialog>
    </>
  );
}

export const Default: Story = {
  render: () => (
    <Example
      title="Export document"
      description="Choose how to save a copy of this document."
      footer={(close) => (
        <>
          <Button onClick={close}>Cancel</Button>
          <Button variant="primary" onClick={close}>
            Export
          </Button>
        </>
      )}
    >
      <p style={{ margin: 0 }}>The copy keeps your annotations and page order.</p>
    </Example>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Example
      title="Delete 3 pages?"
      size="small"
      footer={(close) => (
        <>
          <Button onClick={close}>Keep</Button>
          <Button variant="danger" startIcon={<DeleteIcon />} onClick={close}>
            Delete
          </Button>
        </>
      )}
    >
      <p style={{ margin: 0 }}>You can undo this from the toolbar.</p>
    </Example>
  ),
};

/** Long content scrolls inside the body; the header and footer stay put. */
export const LongContent: Story = {
  name: "Long content",
  render: () => (
    <Example
      title="Keyboard shortcuts"
      size="large"
      footer={(close) => (
        <Button variant="primary" onClick={close}>
          Done
        </Button>
      )}
    >
      <ul style={{ margin: 0 }}>
        {Array.from({ length: 40 }, (_, index) => (
          <li key={index}>Shortcut {index + 1}</li>
        ))}
      </ul>
    </Example>
  ),
};
