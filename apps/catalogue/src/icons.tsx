/**
 * Sample icons for the catalogue's stories. They draw with currentColor, as
 * every icon passed to ui must (ADR 0006). ui itself ships no icon set.
 */
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function DownloadIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
    </svg>
  );
}

export function RotateIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v5h-5" />
    </svg>
  );
}

export function BoldIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zm0 7h7a3.5 3.5 0 0 1 0 7H7z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13" />
    </svg>
  );
}

export function UndoIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

export function RedoIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />
    </svg>
  );
}

export function ZoomInIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4M11 8v6M8 11h6" />
    </svg>
  );
}

export function ZoomOutIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4M8 11h6" />
    </svg>
  );
}

export function SinglePageIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <rect x="6" y="3" width="12" height="18" rx="1" />
    </svg>
  );
}

export function GridIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <rect x="4" y="4" width="7" height="7" rx="1" />
      <rect x="13" y="4" width="7" height="7" rx="1" />
      <rect x="4" y="13" width="7" height="7" rx="1" />
      <rect x="13" y="13" width="7" height="7" rx="1" />
    </svg>
  );
}

export function PlayIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M7 4.5v15L19 12z" />
    </svg>
  );
}

export function PauseIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M8 5v14M16 5v14" />
    </svg>
  );
}

export function LoopIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M17 3l3 3-3 3M4 11V9a3 3 0 0 1 3-3h13M7 21l-3-3 3-3M20 13v2a3 3 0 0 1-3 3H4" />
    </svg>
  );
}

export function PenIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
    </svg>
  );
}

export function HighlighterIcon() {
  return (
    <svg {...base} aria-hidden="true">
      <path d="M9 15 4 20h5l2-2M9 15l7-11 4 3-7 11zM9 15l4 3" />
    </svg>
  );
}
