function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (/[;"\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function toCsv(headers, rows) {
  const lines = [headers.map((header) => csvCell(header.label)).join(";")];
  for (const row of rows) {
    lines.push(headers.map((header) => csvCell(row[header.key])).join(";"));
  }
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

module.exports = { toCsv };
