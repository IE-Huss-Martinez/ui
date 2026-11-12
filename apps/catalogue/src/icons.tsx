/**
 * The catalogue's one hand-drawn icon. Every other story uses ui's own set
 * (docs/adr/0005), but components take any element that draws with
 * currentColor, and this shows a host-supplied one: ui's set has no text
 * formatting icons.
 */
export function BoldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zm0 7h7a3.5 3.5 0 0 1 0 7H7z" />
    </svg>
  );
}
