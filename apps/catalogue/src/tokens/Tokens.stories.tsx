import { contrastPairs } from "@hussmartinez/ui";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TokenTable } from "./TokenTable.js";

/**
 * The semantic tokens, with the values they resolve to under the theme and
 * density chosen in the toolbar. Components use only these and component
 * tokens (ADR 0006).
 */
const meta = {
  title: "Tokens",
  parameters: { docs: { description: { component: "Every semantic token, live." } } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Colour: Story = {
  render: () => (
    <TokenTable
      title="Colour"
      category="color"
      preview={(value, definition) =>
        definition.type === "color" ? (
          <div className="hm-catalogue-swatch" style={{ background: value }} />
        ) : null
      }
    />
  ),
};

/**
 * Every pair the contrast tests check. Text pairs are drawn as text, so axe
 * checks them as rendered; boundary pairs (3:1) are drawn as shapes.
 */
export const Contrast: Story = {
  render: () => (
    <section>
      <h2 className="hm-catalogue-title">Contrast pairs</h2>
      <table className="hm-catalogue-table">
        <thead>
          <tr>
            <th scope="col">Foreground</th>
            <th scope="col">Background</th>
            <th scope="col">Needs</th>
            <th scope="col">Sample</th>
          </tr>
        </thead>
        <tbody>
          {contrastPairs.map(({ foreground, background, minimum }) => (
            <tr key={`${foreground}-${background}`}>
              <td>
                <code className="hm-catalogue-code">{foreground}</code>
              </td>
              <td>
                <code className="hm-catalogue-code">{background}</code>
              </td>
              <td>{minimum}:1</td>
              <td>
                {minimum === 4.5 ? (
                  <span
                    className="hm-catalogue-sample"
                    style={{
                      color: `var(--hm-${foreground})`,
                      background: `var(--hm-${background})`,
                    }}
                  >
                    Sample text
                  </span>
                ) : (
                  <span
                    className="hm-catalogue-sample"
                    style={{ background: `var(--hm-${background})` }}
                  >
                    <span
                      className="hm-catalogue-swatch"
                      style={{ display: "block", borderColor: `var(--hm-${foreground})` }}
                    />
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  ),
};

export const Typography: Story = {
  render: () => (
    <TokenTable
      title="Typography"
      category="typography"
      preview={(value, definition) =>
        definition.name.startsWith("font-size") ? (
          <span style={{ fontSize: value }}>Aa</span>
        ) : definition.name.startsWith("font-weight") ? (
          <span style={{ fontWeight: value }}>Aa</span>
        ) : definition.type === "font-family" ? (
          <span style={{ fontFamily: value }}>Aa</span>
        ) : null
      }
    />
  ),
};

export const SpaceAndSize: Story = {
  name: "Space and size",
  render: () => (
    <>
      <TokenTable
        title="Space"
        category="space"
        preview={(value) => <div className="hm-catalogue-bar" style={{ inlineSize: value }} />}
      />
      <TokenTable
        title="Size"
        category="size"
        preview={(value) => <div className="hm-catalogue-bar" style={{ inlineSize: value }} />}
      />
    </>
  ),
};

export const ShapeAndShadow: Story = {
  name: "Shape and shadow",
  render: () => (
    <>
      <TokenTable
        title="Shape"
        category="shape"
        preview={(value, definition) =>
          definition.name.startsWith("radius") ? (
            <div className="hm-catalogue-box" style={{ borderRadius: value }} />
          ) : null
        }
      />
      <TokenTable
        title="Shadow"
        category="shadow"
        preview={(value) => <div className="hm-catalogue-box" style={{ boxShadow: value }} />}
      />
    </>
  ),
};

export const MotionAndStacking: Story = {
  name: "Motion, stacking and focus",
  render: () => (
    <>
      <TokenTable title="Motion" category="motion" />
      <TokenTable title="Z-index" category="z-index" />
      <TokenTable title="Opacity" category="opacity" />
      <TokenTable
        title="Focus"
        category="focus"
        preview={(_value, definition) =>
          definition.name === "focus-ring" ? (
            <div
              className="hm-catalogue-box"
              style={{
                outline: "var(--hm-focus-ring)",
                outlineOffset: "var(--hm-focus-ring-offset)",
              }}
            />
          ) : null
        }
      />
    </>
  ),
};
