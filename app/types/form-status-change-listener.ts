import { FormStatus } from './form-status';
import { FormValue } from './form-value';

export type FormStatusChangeListener<
  T extends FormStatus,
  S extends Record<string | symbol, unknown> = Record<string | symbol, unknown>
> = T extends 'dirty'
  ? (fieldNames: (keyof S)[]) => void
  : T extends 'touched'
  ? (fieldNames: (keyof S)[]) => void
  : T extends 'invalid'
  ? (
      invalid: boolean,
      errors: Partial<{
        [k in keyof S]: Record<string, boolean>;
      }>
    ) => void
  : T extends 'value'
  ? (oldValue: FormValue<S>, newValue: FormValue<S>) => void
  : never;
