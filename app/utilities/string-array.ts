const cache = new WeakMap<readonly string[], Record<string, boolean>>();

export function isMember<T extends string>(array: readonly T[], value: string) {
  let cacheEntry = cache.get(array);

  if (!cacheEntry) {
    cacheEntry = Object.fromEntries(array.map((member) => [member, true]));

    cache.set(array, cacheEntry);
  }

  return cacheEntry[value];
}

export function ensureMembership<T extends string>(
  array: readonly T[],
  value: string,
  defaultValue: T
): T {
  return isMember(array, value) ? (value as T) : defaultValue;
}
