import { FormFieldControl } from './form-field-control';

export type FormFieldControlStatus = Exclude<keyof FormFieldControl, 'errors'>;
