import { describe, expect, it } from 'vitest';
import { findGradeColumns, parseCsv, rowsFromXlsx } from '../lib/csv';

describe('findGradeColumns', () => {
  it('reads the plain two-column layout', () => {
    expect(findGradeColumns(parseCsv('1001,90\n1002,85'))).toEqual({ start: 0, numberCol: 0, gradeCol: 1 });
  });

  it('skips an unrecognized header row', () => {
    expect(findGradeColumns(parseCsv('id,score\n1001,90'))).toEqual({ start: 1, numberCol: 0, gradeCol: 1 });
  });

  it('reads the teacher export layout with title rows', () => {
    const csv = [
      'STO. NIÑO DE PRAGA ACADEMY',
      'STUDENT GRADES',
      'Class: Math 7',
      'Generated: October 13, 2026',
      'Student Number,Student Name,Grade,Status',
      '1001,"Cruz, Juan",90,pending',
    ].join('\n');
    expect(findGradeColumns(parseCsv(csv))).toEqual({ start: 5, numberCol: 0, gradeCol: 2 });
  });
});

describe('rowsFromXlsx', () => {
  it('reads the teacher Excel export layout back into grade rows', async () => {
    const ExcelJS = (await import('exceljs')).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Report');
    // Same shape as lib/export-excel.ts: merged title rows, spacer, header, data
    ['STO. NIÑO DE PRAGA ACADEMY', 'STUDENT GRADES', 'Class: Math 7', 'Generated: October 13, 2026'].forEach((t, i) => {
      ws.mergeCells(i + 1, 1, i + 1, 4);
      ws.getCell(i + 1, 1).value = t;
    });
    ws.getRow(6).values = ['Student Number', 'Student Name', 'Grade', 'Status'];
    ws.getRow(7).values = ['1001', 'Cruz, Juan', '90', 'pending'];
    ws.getRow(8).values = ['1002', 'Reyes, Ana', 85, 'Not submitted'];

    const buffer = await wb.xlsx.writeBuffer();
    const rows = await rowsFromXlsx(buffer as ArrayBuffer);
    const { start, numberCol, gradeCol } = findGradeColumns(rows);

    expect(rows.slice(start).map((r) => [r[numberCol], r[gradeCol]])).toEqual([
      ['1001', '90'],
      ['1002', '85'],
    ]);
  });
});
