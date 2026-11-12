import { FileDropZone, type FileRejection } from "@hussmartinez/ui/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

/**
 * Where people choose or drop files. The button is the keyboard and screen
 * reader path; the zone takes drops from a pointer. The zone checks names,
 * types and counts, never contents: the host validates each file before
 * using it, and shows file names as text.
 */
const meta = {
  title: "Components/FileDropZone",
  component: FileDropZone,
  args: { accept: ".pdf,application/pdf", onFiles: () => undefined },
} satisfies Meta<typeof FileDropZone>;

export default meta;
type Story = StoryObj<typeof meta>;

const frame = { maxInlineSize: "28rem" } as const;
const title = { margin: 0, fontWeight: "var(--hm-font-weight-strong)" } as const;
const alert = { margin: 0, color: "var(--hm-color-danger-text)" } as const;

/** Why each rejected file was turned away, as a host would say it. */
const reasons: Record<FileRejection["reason"], string> = {
  type: "isn't a PDF",
  count: "is one of several; drop one file",
  directory: "is a folder",
};

/** A document picker: the chosen file's name is shown as text, and rejections as an alert. */
export const Default: Story = {
  render: function Default(args) {
    const [chosen, setChosen] = useState<string>();
    const [problem, setProblem] = useState<string>();
    return (
      <div style={frame}>
        <FileDropZone
          {...args}
          onFiles={([file]) => {
            setProblem(undefined);
            setChosen(file?.name);
          }}
          onFilesRejected={([rejection]) =>
            rejection && setProblem(`${rejection.file.name} ${reasons[rejection.reason]}.`)
          }
        >
          <p style={title}>Open a PDF</p>
          {problem ? (
            <p role="alert" style={alert}>
              {problem}
            </p>
          ) : null}
          {chosen ? <p style={{ margin: 0 }}>Chosen: {chosen}</p> : null}
        </FileDropZone>
      </div>
    );
  },
};

/** Several audio files at once, with the host's own text. */
export const Multiple: Story = {
  args: {
    accept: "audio/*",
    multiple: true,
    buttonLabel: "Add audio files",
    hint: "or drop them here: WAV, FLAC, MP3 or Ogg",
    buttonVariant: "secondary",
  },
  render: (args) => (
    <div style={frame}>
      <FileDropZone {...args} />
    </div>
  ),
};

/** While files are dragged over it: a solid accent border and a tint, not colour alone. */
export const Dragging: Story = {
  render: (args) => (
    <div style={frame}>
      <FileDropZone {...args}>
        <p style={title}>Open a PDF</p>
      </FileDropZone>
    </div>
  ),
  play: ({ canvasElement }) => {
    const zone = canvasElement.querySelector(".hm-file-drop-zone");
    const data = new DataTransfer();
    data.items.add(new File(["%PDF-1.7"], "report.pdf", { type: "application/pdf" }));
    zone?.dispatchEvent(
      new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: data }),
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <div style={frame}>
      <FileDropZone {...args}>
        <p style={title}>Open a PDF</p>
      </FileDropZone>
    </div>
  ),
};

/** Visual styles dropped: the layout, the button's focus ring and target size remain. */
export const Unstyled: Story = {
  args: { unstyled: true },
  render: (args) => (
    <div style={frame}>
      <FileDropZone {...args}>
        <p style={title}>Open a PDF</p>
      </FileDropZone>
    </div>
  ),
};
