/**
 * A Server Component. It imports the server-safe entry, which must not touch
 * the browser, and renders components from the client entry directly, which
 * only works if their "use client" directive survived the build (ADR 0007).
 */
import { createTheme, themeToCss, tokens } from "@hussmartinez/ui";
import {
  Button,
  Field,
  IconButton,
  NumberField,
  ProgressBar,
  Slider,
  Spinner,
  ThemeProvider,
  ToggleButton,
  Toolbar,
  ToolbarGroup,
  ToolbarSeparator,
  VisuallyHidden,
} from "@hussmartinez/ui/react";
import { Interactive } from "./Interactive";
import { UndoIcon } from "./icons";

// Created on the server. A theme passed to a client component as a prop is
// serialised, so on the server it's written as CSS instead.
const brand = createTheme({ extends: "light", tokens: { "color-accent": "#5b21b6" } });

export default function Page() {
  return (
    <ThemeProvider mode="light">
      <style
        // themeToCss output is allowlisted and never contains "<".
        dangerouslySetInnerHTML={{ __html: themeToCss(brand, ".brand") }}
      />
      <main className="brand">
        <h1>@hussmartinez/ui in Next.js</h1>
        <p data-testid="token-count">{tokens.length}</p>
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
        <Field label="Volume" description="For playback only">
          <Slider defaultValue={40} />
        </Field>
        <Field label="Copies">
          <NumberField min={1} max={99} defaultValue={1} />
        </Field>
        <VisuallyHidden>Only for screen readers</VisuallyHidden>
        <Interactive />
      </main>
    </ThemeProvider>
  );
}
