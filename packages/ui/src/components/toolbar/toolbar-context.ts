import { createContext, useContext } from "react";

/** What children of a Toolbar need to know. */
export interface ToolbarContextValue {
  readonly orientation: "horizontal" | "vertical";
}

export const ToolbarContext = /* @__PURE__ */ createContext<ToolbarContextValue | undefined>(
  undefined,
);

/** The enclosing toolbar, or `undefined` outside one. */
export function useToolbar(): ToolbarContextValue | undefined {
  return useContext(ToolbarContext);
}
