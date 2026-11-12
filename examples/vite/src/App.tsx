import {
  AnnouncerProvider,
  Button,
  Dialog,
  IconButton,
  ProgressBar,
  SegmentedControl,
  Spinner,
  ThemeProvider,
  ToggleButton,
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  useAnnounce,
  VisuallyHidden,
} from "@hussmartinez/ui/react";
import { useEffect, useState } from "react";

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

function Controls() {
  const announce = useAnnounce();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"single" | "grid">("single");
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
            <IconButton variant="quiet" label="Undo" icon={<UndoIcon />} />
            <Button variant="quiet">Redo</Button>
          </ToolbarGroup>
          <ToolbarSeparator />
          <ToggleButton variant="quiet">Loop</ToggleButton>
          <ToolbarSeparator />
          <Button variant="primary">Export</Button>
        </Toolbar>
        <Spinner label="Loading pages" />
        <ProgressBar value={40} label="Exporting" />
        <VisuallyHidden>Only for screen readers</VisuallyHidden>
        <AnnouncerProvider>
          <Controls />
        </AnnouncerProvider>
      </main>
    </ThemeProvider>
  );
}
