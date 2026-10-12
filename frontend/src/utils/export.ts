import i18n, { normalizeLanguage } from "../i18n";

export type ExportColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function safeFileName(name: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `${name.trim().replace(/[\\/:*?"<>|\s]+/g, "-") || "export"}-${date}`;
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/* CSV : BOM UTF-8 (accents/arabe lisibles dans Excel) ; ";" en français, comme l'attend Excel FR */
export function toCsv<T>(columns: ExportColumn<T>[], rows: T[]): string {
  const separator = normalizeLanguage(i18n.language) === "fr" ? ";" : ",";
  const escape = (value: unknown) => {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",;\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };

  return [
    columns.map((c) => escape(c.header)).join(separator),
    ...rows.map((row) => columns.map((c) => escape(c.value(row))).join(separator)),
  ].join("\r\n");
}

export async function exportRows<T>(
  format: "csv" | "xlsx",
  name: string,
  columns: ExportColumn<T>[],
  rows: T[]
): Promise<void> {
  const fileName = safeFileName(name);

  if (format === "csv") {
    download(new Blob(["\uFEFF" + toCsv(columns, rows)], { type: "text/csv;charset=utf-8" }), `${fileName}.csv`);
    return;
  }

  // Chargé à la demande : la librairie Excel n'alourdit pas le bundle principal
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const data = [
    columns.map((c) => ({ value: c.header, fontWeight: "bold" as const })),
    ...rows.map((row) =>
      columns.map((c) => {
        const value = c.value(row);
        return typeof value === "number" ? { type: Number, value } : { type: String, value: value == null ? "" : String(value) };
      })
    ),
  ];

  await writeXlsxFile(data, {
    columns: columns.map((c) => ({ width: Math.min(Math.max(c.header.length + 4, 14), 40) })),
    rightToLeft: normalizeLanguage(i18n.language) === "ar",
  }).toFile(`${fileName}.xlsx`);
}
