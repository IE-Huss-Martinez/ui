/** The number of decimals in a number, so steps don't drift: 0.1 + 0.2 is 0.3. */
export function decimals(value: number): number {
  const text = String(value);
  const exponent = /e-(\d+)$/.exec(text);
  if (exponent) {
    return Number(exponent[1]);
  }
  const point = text.indexOf(".");
  return point === -1 ? 0 : text.length - point - 1;
}

/** Rounds away float error at a number of decimals, which `toFixed` caps at 100. */
export function roundTo(value: number, places: number): number {
  return Number(value.toFixed(Math.min(places, 100)));
}
