/** ISO 3166-1 alpha-2 → emoji flag */
export function countryFlag(code: string): string {
  const c = code.toUpperCase();
  if (c.length !== 2) return '🏳️';
  return String.fromCodePoint(
    ...c.split('').map((ch) => 127397 + ch.charCodeAt(0)),
  );
}
