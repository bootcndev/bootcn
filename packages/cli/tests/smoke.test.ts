import { describe, expect, it } from 'vitest';

import { BRAND } from '../src/constants.js';

describe('cli scaffold', () => {
  it('exposes the brand constant', () => {
    expect(BRAND).toBe('bootcn');
  });
});
