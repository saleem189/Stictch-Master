import { describe, expect, it } from 'vitest';
import { escapeCsvCell } from './exportUtils';

describe('escapeCsvCell', () => {
  it.each(['=1+1', '+SUM(A1:A2)', '-1+2', '@SUM(A1)', '  =1+1'])(
    'neutralizes spreadsheet formulas in %s',
    value => {
      expect(escapeCsvCell(value)).toBe(`"'${value.replace(/"/g, '""')}"`);
    }
  );

  it('quotes cells and escapes embedded quotes', () => {
    expect(escapeCsvCell('she said "hello", ok')).toBe('"she said ""hello"", ok"');
  });

  it('keeps numeric values numeric and maps nullish values to empty cells', () => {
    expect(escapeCsvCell(-12)).toBe('"-12"');
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
  });
});
