"use client";

/**
 * Accessible React components of the `@hussmartinez` design system.
 *
 * @remarks
 * A client entry: it starts with `"use client"`, which the build keeps
 * (ADR 0007). React and React DOM 18.3 or later are optional peer
 * dependencies.
 *
 * @packageDocumentation
 */

export type {
  Announce,
  AnnouncerProviderProps,
  Politeness,
} from "./components/announcer/Announcer.js";
export { AnnouncerProvider, useAnnounce } from "./components/announcer/Announcer.js";
export type {
  ButtonPart,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
} from "./components/button/Button.js";
export { Button } from "./components/button/Button.js";
export type { IconButtonProps } from "./components/button/IconButton.js";
export { IconButton } from "./components/button/IconButton.js";
export type { DialogPart, DialogProps } from "./components/dialog/Dialog.js";
export { Dialog } from "./components/dialog/Dialog.js";
export type {
  UiMessages,
  UiMessagesProviderProps,
} from "./components/messages/UiMessagesProvider.js";
export { UiMessagesProvider, useUiMessages } from "./components/messages/UiMessagesProvider.js";
export type { ProgressBarProps } from "./components/progress-bar/ProgressBar.js";
export { ProgressBar } from "./components/progress-bar/ProgressBar.js";
export type {
  SegmentedControlOption,
  SegmentedControlPart,
  SegmentedControlProps,
} from "./components/segmented-control/SegmentedControl.js";
export { SegmentedControl } from "./components/segmented-control/SegmentedControl.js";
export type { ClassNames, StyleProps } from "./components/shared/style-props.js";
export type { SpinnerProps } from "./components/spinner/Spinner.js";
export { Spinner } from "./components/spinner/Spinner.js";
export type {
  ToggleButtonBaseProps,
  ToggleButtonIconProps,
  ToggleButtonProps,
  ToggleButtonTextProps,
  ToggleButtonVariant,
} from "./components/toggle-button/ToggleButton.js";
export { ToggleButton } from "./components/toggle-button/ToggleButton.js";
export type { ToolbarProps } from "./components/toolbar/Toolbar.js";
export { Toolbar } from "./components/toolbar/Toolbar.js";
export type { ToolbarGroupProps } from "./components/toolbar/ToolbarGroup.js";
export { ToolbarGroup } from "./components/toolbar/ToolbarGroup.js";
export type { ToolbarSeparatorProps } from "./components/toolbar/ToolbarSeparator.js";
export { ToolbarSeparator } from "./components/toolbar/ToolbarSeparator.js";
export type { VisuallyHiddenProps } from "./components/visually-hidden/VisuallyHidden.js";
export { VisuallyHidden } from "./components/visually-hidden/VisuallyHidden.js";
export { uiMessages } from "./messages/en.js";
export type {
  ThemeProviderBaseProps,
  ThemeProviderModeProps,
  ThemeProviderProps,
  ThemeProviderSingleProps,
} from "./react/ThemeProvider.js";
export { ThemeProvider } from "./react/ThemeProvider.js";
export type { ColorMode, Density, Theme, ThemePair } from "./theme/types.js";
