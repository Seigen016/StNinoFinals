// Minimal CSV parser — handles quoted fields with embedded commas, good enough
// for simple two-column "student number, grade" sheets.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      field = '';
      if (row.some((c) => c.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((c) => c.trim() !== '')) rows.push(row);
  }
  return rows;
}

// Locates the student-number and grade columns in a grades sheet. Accepts the
// plain "student number, grade" layout as well as the teacher export layout
// (title rows, then "Student Number, Student Name, Grade, Status"), so an
// exported sheet saved as CSV can be imported back.
export function findGradeColumns(rows: string[][]): { start: number; numberCol: number; gradeCol: number } {
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const cells = rows[r].map((c) => c.trim().toLowerCase());
    const numberCol = cells.findIndex((c) => /^(student\s*(no\.?|number|#)|lrn)$/.test(c));
    const gradeCol = cells.findIndex((c) => c === 'grade');
    if (numberCol !== -1 && gradeCol !== -1) return { start: r + 1, numberCol, gradeCol };
  }
  // No recognizable header: column A = student number, column B = grade,
  // skipping a first row whose cell A isn't a plausible student number
  const start = /^\d+$/.test((rows[0]?.[0] || '').trim()) ? 0 : 1;
  return { start, numberCol: 0, gradeCol: 1 };
}

// Reads an uploaded grades sheet into rows: .xlsx (e.g. the teacher's own
// Excel export, read with the exceljs the export already uses) or CSV.
export async function readSheetFile(file: File): Promise<string[][]> {
  if (/\.xlsx$/i.test(file.name)) return rowsFromXlsx(await file.arrayBuffer());
  return parseCsv(await file.text());
}

// First worksheet as rows of displayed cell text, blank rows dropped
export async function rowsFromXlsx(data: ArrayBuffer): Promise<string[][]> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const rows: string[][] = [];
  workbook.worksheets[0]?.eachRow((row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      cells[col - 1] = cell.text ?? '';
    });
    const filled = Array.from(cells, (c) => c ?? '');
    if (filled.some((c) => c.trim() !== '')) rows.push(filled);
  });
  return rows;
}
