import { afterEach, beforeEach, expect, it } from "vitest";
import { cleanUp, loadStyles, mount } from "../../test/dom.js";

beforeEach(async () => {
  await loadStyles();
});
afterEach(cleanUp);

it("hides content on screen but keeps it in the accessible name", () => {
  const container = mount(
    '<button type="button"><svg aria-hidden="true"></svg><span class="hm-visually-hidden">Close</span></button>',
  );
  const hidden = container.querySelector(".hm-visually-hidden") as Element;
  const box = hidden.getBoundingClientRect();
  expect(box.width).toBeLessThanOrEqual(1);
  expect(box.height).toBeLessThanOrEqual(1);
  expect(getComputedStyle(hidden).position).toBe("absolute");
  expect((container.querySelector("button") as HTMLElement).innerText.trim()).toBe("Close");
});
