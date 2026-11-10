import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button } from "../button/Button.js";
import { SegmentedControl } from "../segmented-control/SegmentedControl.js";
import { Toolbar } from "./Toolbar.js";
import { ToolbarGroup } from "./ToolbarGroup.js";
import { ToolbarSeparator } from "./ToolbarSeparator.js";

describe("Toolbar on the server", () => {
  it("renders a named, oriented toolbar with groups and a separator across it", () => {
    const html = renderToString(
      <Toolbar label="Page tools">
        <ToolbarGroup label="History">
          <Button>Undo</Button>
        </ToolbarGroup>
        <ToolbarSeparator />
      </Toolbar>,
    );
    expect(html).toContain('role="toolbar" aria-label="Page tools" aria-orientation="horizontal"');
    expect(html).toContain('class="hm-toolbar"');
    expect(html).toContain('role="group" aria-label="History" class="hm-toolbar-group"');
    expect(html).toContain('<hr aria-orientation="vertical" class="hm-toolbar-separator"');
  });

  it("orients a vertical toolbar's separators horizontally", () => {
    const html = renderToString(
      <Toolbar label="Tools" orientation="vertical">
        <ToolbarSeparator />
      </Toolbar>,
    );
    expect(html).toContain('class="hm-toolbar hm-toolbar--vertical"');
    expect(html).toContain('<hr aria-orientation="horizontal"');
  });

  it("renders no tabindex, so hydration can't mismatch", () => {
    const html = renderToString(
      <Toolbar label="Tools">
        <Button>A</Button>
        <SegmentedControl
          label="View"
          value="a"
          onValueChange={() => undefined}
          options={[
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ]}
        />
      </Toolbar>,
    );
    expect(html).not.toContain("tabindex");
  });
});

describe("SegmentedControl on the server", () => {
  it("renders a named radio group with the selected option as its Tab stop", () => {
    const html = renderToString(
      <SegmentedControl
        label="View"
        value="grid"
        onValueChange={() => undefined}
        options={[
          { value: "single", label: "Single" },
          { value: "grid", label: "Grid", icon: <svg />, hideLabel: true },
          { value: "off", label: "Off", disabled: true },
        ]}
      />,
    );
    expect(html).toContain('role="radiogroup" aria-label="View" class="hm-segmented-control"');
    expect(html).toMatch(/role="radio" aria-checked="false" tabindex="-1" data-hm-value="single"/);
    expect(html).toMatch(/role="radio" aria-checked="true" aria-label="Grid" tabindex="0"/);
    expect(html).toMatch(/aria-checked="false" disabled="" tabindex="-1" data-hm-value="off"/);
    expect(html).not.toContain('class="hm-segmented-control-label">Grid');
  });
});
