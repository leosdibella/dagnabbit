export type ObservedAttributeSanitizer<T = unknown> = (
  value: string
) => T | null;
