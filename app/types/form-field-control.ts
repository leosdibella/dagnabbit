export type FormFieldControl<T = unknown> = {
  name: string;
  value: T | null;
  disabled: boolean;
  required: boolean;
  dirty: boolean;
  errors: Record<string, boolean>;
  invalid: boolean;
  touched: boolean;
};
