import {
  AnnouncerProvider,
  Button,
  Dialog,
  Field,
  FileDropZone,
  IconButton,
  NumberField,
  ProgressBar,
  SegmentedControl,
  Slider,
  Spinner,
  TextField,
  ThemeProvider,
  ToggleButton,
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  Tooltip,
  UndoIcon,
  useAnnounce,
  VisuallyHidden,
} from "@hussmartinez/ui/react";
import { useEffect, useState } from "react";

function Controls() {
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"single" | "grid">("single");
  const [received, setReceived] = useState<string>();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return (
    <section data-hydrated={hydrated ? "" : undefined}>
      <SegmentedControl
        label="View"
        value={view}
        onValueChange={setView}
        options={[
          { value: "single", label: "Single" },
          { value: "grid", label: "Grid" },
        ]}
      />
      <FileDropZone accept=".pdf,application/pdf" onFiles={([file]) => setReceived(file?.name)}>
        {/* The name comes from the file: rendered as text, never as markup. */}
        {received ? <p data-testid="received">Received {received}</p> : null}
      </FileDropZone>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Export"
        footer={
          <Button
            variant="primary"
            onClick={() => {
              setOpen(false);
              announce("Exported");
            }}
          >
            Confirm
          </Button>
        }
      >
        <p>Export this document?</p>
      </Dialog>
    </section>
  );
}

/** Every component, rendered on the server at build time and hydrated in the browser. */
export function App() {
  return (
    <ThemeProvider mode="light">
      <main className="brand">
        <h1>@hussmartinez/ui in Vite</h1>
        <Toolbar label="Page tools">
          <ToolbarGroup label="History">
            <Tooltip type="label" content="Undo">
              <IconButton variant="quiet" label="Undo" icon={<UndoIcon />} />
            </Tooltip>
            <Button variant="quiet">Redo</Button>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToggleButton variant="quiet">Loop</ToggleButton>
          <ToolbarSeparator />
          <Button variant="primary">Export</Button>
        </Toolbar>
        <Spinner label="Loading pages" />
        <ProgressBar value={40} label="Exporting" />
        <Field label="Volume" description="For playback only">
          <Slider defaultValue={40} />
        </Field>
        <Field label="File name">
          <TextField defaultValue="report" />
        </Field>
        <Field label="Copies">
          <NumberField min={1} max={99} defaultValue={1} />
        </Field>
        <VisuallyHidden>Only for screen readers</VisuallyHidden>
        <AnnouncerProvider>
          <Controls />
        </AnnouncerProvider>
      </main>
    </ThemeProvider>
  );
}
