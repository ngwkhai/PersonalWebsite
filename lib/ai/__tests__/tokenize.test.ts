import { describe, expect, it } from 'vitest';
import { tokenize } from '../tokenize';

describe('tokenize', () => {
  it('folds Vietnamese diacritics so undiacritised queries still match', () => {
    // The whole point: a recruiter typing "tieng viet" must reach content
    // written "tiếng Việt".
    expect(tokenize('tiếng Việt')).toEqual(tokenize('tieng viet'));
    expect(tokenize('Nguyễn Đình Khải')).toEqual(['nguyen', 'dinh', 'khai']);
  });

  it('keeps the punctuation that carries meaning in this domain', () => {
    expect(tokenize('ChrF++ and F1')).toContain('chrf++');
    expect(tokenize('torch.compile')).toContain('torch.compile');
    expect(tokenize('C# vs C++')).toEqual(expect.arrayContaining(['c#', 'c++']));
  });

  it('drops single characters and absurdly long tokens', () => {
    expect(tokenize('a bb ' + 'x'.repeat(40))).toEqual(['bb']);
  });
});
