import { FormFieldControl } from './form-field-control';
import { FormFieldControlStatus } from './form-field-control-status';
import { FormFieldControlStatusChangeListener } from './form-field-control-status-change-listener';
import { FormFieldValidator } from './form-field-validator';

export type FormFieldControlElement<T = unknown> = HTMLElement &
  FormFieldControl<T> & {
    addStatusChangeListener<R extends FormFieldControlStatus>(
      status: R,
      listener: FormFieldControlStatusChangeListener<R, T>
    ): void;
    removeStatusChangeListener<R extends FormFieldControlStatus>(
      status: R,
      listener: FormFieldControlStatusChangeListener<R, T>
    ): void;
    addValidator(name: string, validator?: FormFieldValidator): void;
    removeValidator(name: string): void;
  };
