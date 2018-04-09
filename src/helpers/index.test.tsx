import { mod, clamp, including, excluding } from './';

describe('mod', () => {
  it('calculates the modulo of a number', () => {
    expect(mod(2, 3)).toBe(2);
    expect(mod(-1, 3)).toBe(2);
    expect(mod(4, 3)).toBe(1);
    expect(mod(3, 3)).toBe(0);
  });
});

describe('clamp', () => {
  it('returns the number when it is between min and max', () => {
    expect(clamp(1, 0, 2)).toBe(1);
  });

  it('returns the min when the number is below the min', () => {
    expect(clamp(-1, 0, 2)).toBe(0);
  });

  it('returns the max when the number is above the max', () => {
    expect(clamp(3, 0, 2)).toBe(2);
  });
});

describe('including', () => {
  it('returns a new set containing the items of the old set and the given value', () => {
    const set = new Set([1, 2, 3]);
    const newSet = including(set, 4);

    expect(newSet).not.toBe(set);
    expect(newSet).toEqual(new Set([1, 2, 3, 4]));
  });
});

describe('excluding', () => {
  it('returns a new set containing the items of the old set without the given value', () => {
    const set = new Set([1, 2, 3]);
    const newSet = excluding(set, 3);

    expect(newSet).not.toBe(set);
    expect(newSet).toEqual(new Set([1, 2]));
  });
});
