/**
 * ui's icon names and the Lucide glyph behind each (docs/adr/0005). Names
 * describe what an icon is for in the SDK family, not what it draws, so a
 * glyph can change, or Lucide can rename it, without breaking anyone.
 *
 * `mirror` marks icons that point along the reading direction, which flip in
 * right-to-left text. Media controls, rotations and physical directions, such
 * as the chevrons, don't.
 *
 * Development-time only: `pnpm --filter @hussmartinez/ui icons` reads it to
 * write `icons.generated.tsx`. Add an icon here, then regenerate.
 */
export const iconManifest = {
  add: { lucide: "plus" },
  check: { lucide: "check" },
  "chevron-down": { lucide: "chevron-down" },
  "chevron-left": { lucide: "chevron-left" },
  "chevron-right": { lucide: "chevron-right" },
  close: { lucide: "x" },
  crop: { lucide: "crop" },
  delete: { lucide: "trash" },
  download: { lucide: "download" },
  "fade-in": { lucide: "chart-no-axes-column-increasing" },
  "fade-out": { lucide: "chart-no-axes-column-decreasing" },
  fit: { lucide: "scan" },
  "flip-horizontal": { lucide: "triangles-centerline-dashed-vertical" },
  "flip-vertical": { lucide: "triangles-centerline-dashed-horizontal" },
  highlighter: { lucide: "highlighter" },
  info: { lucide: "info" },
  loop: { lucide: "repeat" },
  menu: { lucide: "menu" },
  more: { lucide: "ellipsis" },
  muted: { lucide: "volume-x" },
  open: { lucide: "folder-open" },
  "page-grid": { lucide: "grid-2x2" },
  "page-single": { lucide: "file" },
  pan: { lucide: "hand" },
  pause: { lucide: "pause" },
  pen: { lucide: "pen" },
  play: { lucide: "play" },
  redo: { lucide: "redo-2", mirror: true },
  remove: { lucide: "minus" },
  "rotate-left": { lucide: "rotate-ccw" },
  "rotate-right": { lucide: "rotate-cw" },
  search: { lucide: "search" },
  select: { lucide: "mouse-pointer-2" },
  "skip-back": { lucide: "skip-back" },
  "skip-forward": { lucide: "skip-forward" },
  snap: { lucide: "magnet" },
  split: { lucide: "scissors" },
  stop: { lucide: "square" },
  "trim-end": { lucide: "arrow-left-from-line" },
  "trim-start": { lucide: "arrow-right-from-line" },
  undo: { lucide: "undo-2", mirror: true },
  upload: { lucide: "upload" },
  volume: { lucide: "volume-2" },
  warning: { lucide: "triangle-exclamation-point" },
  "zoom-in": { lucide: "zoom-in" },
  "zoom-out": { lucide: "zoom-out" },
} as const satisfies Record<string, { readonly lucide: string; readonly mirror?: boolean }>;
