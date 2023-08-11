import { FormFieldControlStatus } from './form-field-control-status';

export type FormFieldControlStatusChangeListener<
  T extends FormFieldControlStatus,
  S = unknown
> = T extends 'dirty'
  ? (dirty: boolean) => void
  : T extends 'touched'
  ? (touched: boolean) => void
  : T extends 'invalid'
  ? (invalid: boolean, errors?: Record<string, boolean>) => void
  : T extends 'name'
  ? (oldName: string, newName: string) => void
  : T extends 'value'
  ? (oldValue: S | null, newValue: S | null) => void
  : T extends 'disabled'
  ? (disabled: boolean) => void
  : T extends 'required'
  ? (required: boolean) => void
  : never;
