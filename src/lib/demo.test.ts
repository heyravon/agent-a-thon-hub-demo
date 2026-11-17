import { describe, it, expect } from 'vitest';
import { csvCell } from './demo';

describe('csvCell', () => {
  it('neutralizes leading formula characters', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe(`"'=HYPERLINK(""x"")"`);
    expect(csvCell('+1')).toBe(`"'+1"`);
    expect(csvCell('@cmd')).toBe(`"'@cmd"`);
  });
  it('leaves normal text alone', () => {
    expect(csvCell('Byte Brigade')).toBe('"Byte Brigade"');
  });
});
