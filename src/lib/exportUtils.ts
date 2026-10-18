
export function escapeCsvCell(value: unknown): string {
  let stringValue = value === null || value === undefined ? '' : String(value);

  // Spreadsheet applications may execute formula-like values even when the
  // CSV field is quoted. Prefix potentially dangerous text with an apostrophe.
  if (typeof value !== 'number' && /^[\u0000-\u0020]*[=+\-@]/.test(stringValue)) {
    stringValue = `'${stringValue}`;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

export function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.map(escapeCsvCell).join(','),
    ...data.map(row => 
      headers.map(fieldName => escapeCsvCell(row[fieldName])).join(',')
    )
  ];
  
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}
