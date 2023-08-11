export type FormValue<
  T extends Record<string | symbol, unknown> = Record<string | symbol, unknown>
> = Partial<{
  [k in keyof T]: T[k] | null;
}>;
