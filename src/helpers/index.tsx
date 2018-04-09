export const mod = (n: number, d: number): number => {
  return ((n % d) + d) % d;
};

export const clamp = (n: number, min: number, max: number): number => {
  return n < min ? min : n > max ? max : n;
};

export const including = <T extends {}>(set: Set<T>, item: T): Set<T> => {
  const result = new Set(set);
  result.add(item);
  return result;
};

export const excluding = <T extends {}>(set: Set<T>, item: T): Set<T> => {
  const result = new Set(set);
  result.delete(item);
  return result;
};
