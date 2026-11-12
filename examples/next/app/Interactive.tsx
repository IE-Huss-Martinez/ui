"use client";

/**
 * Components that need callbacks, which can't cross from a Server Component.
 * data-hydrated marks the moment React has taken over.
 */
import {
  AnnouncerProvider,
  Button,
  Dialog,
  FileDropZone,
  SegmentedControl,
  useAnnounce,
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

export function Interactive() {
  return (
    <AnnouncerProvider>
      <Controls />
    </AnnouncerProvider>
  );
}
