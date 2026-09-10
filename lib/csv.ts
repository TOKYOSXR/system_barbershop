/** Escapes a CSV field: wraps in quotes and doubles internal quotes. */
function escapeCSV(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n;]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export interface CSVColumn {
  key: string;
  label: string;
}

/**
 * Builds a CSV string. Uses ";" as separator (friendlier to pt-BR Excel) and
 * prepends a UTF-8 BOM so accents render correctly.
 */
export function buildCSV(
  columns: CSVColumn[],
  rows: Record<string, string | number>[],
): string {
  const header = columns.map((c) => escapeCSV(c.label)).join(";");
  const body = rows
    .map((row) => columns.map((c) => escapeCSV(row[c.key] ?? "")).join(";"))
    .join("\n");
  return `\uFEFF${header}\n${body}`;
}
