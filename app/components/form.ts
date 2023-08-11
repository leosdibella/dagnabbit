import {
  FormFieldControlStatus,
  FormFieldControlStatusChangeListener,
  FormStatus,
  FormStatusChangeListener,
  FormValue
} from '../types';
import { customElement } from '../decorators';
import { FormField } from './form-field';

type FormFields<T> = Partial<{ [k in keyof T]?: FormField<T[k]> }>;

@customElement({
  name: Form.tag,
  extends: 'form'
})
export class Form<
  T extends Record<string | symbol, unknown> = Record<string | symbol, unknown>
> extends HTMLFormElement {
  public static readonly tag = 'dagnabbit-form';

  readonly #value: FormValue<T> = {};
  #formFields: FormFields<T> = {};

  readonly #statusChangeListeners: Readonly<{
    [k in FormStatus]: FormStatusChangeListener<k, T>[];
  }> = {
    value: [],
    dirty: [],
    invalid: [],
    touched: []
  };

  readonly #formFieldStatusChangeListeners: Partial<
    Readonly<{
      [k in keyof T]: Partial<{
        [l in FormFieldControlStatus]: FormFieldControlStatusChangeListener<l>;
      }>;
    }>
  > = {};

  public get value() {
    return { ...this.#value };
  }

  public get invalid() {
    return Object.values(this.#formFields)
      .map((formField) => formField?.invalid ?? false)
      .reduce((previous, current) => previous || current, false);
  }

  public get dirty() {
    return Object.values(this.#formFields)
      .map((formField) => formField?.dirty ?? false)
      .reduce((previous, current) => previous || current, false);
  }

  public get touched() {
    return Object.values(this.#formFields)
      .map((formField) => formField?.touched ?? false)
      .reduce((previous, current) => previous || current, false);
  }

  public get errors() {
    return Object.fromEntries(
      Object.values(this.#formFields).map((formField) => [
        formField.name,
        formField.errors
      ])
    ) as Partial<{ [k in keyof T]: Record<string, boolean> }>;
  }

  public setValue(values: string) {
    // TODO: Replace with better JSON
    const parsed = JSON.parse(values) as T;

    if (typeof parsed === 'object') {
      const setProperties: Partial<Record<keyof T, boolean>> = {};

      Object.keys(parsed).forEach((key: keyof T) => {
        const formField = this.#formFields[key];

        if (formField) {
          this.#formFields[key]!.value = parsed[key];
          setProperties[key] = true;
        }
      });

      Object.keys(this.#formFields).forEach((key: keyof T) => {
        if (!setProperties[key]) {
          this.#formFields[key]!.value = null;
        }
      });
    } else {
      Object.keys(this.#value).forEach((key: keyof T) => {
        this.#value[key] = null;
      });
    }

    Object.keys(this.#formFields).forEach((key: keyof T) => {
      this.#formFields[key]!.value = parsed[key];
    });
  }

  public addStatusChangeListener<R extends FormStatus>(
    status: R,
    listener: FormStatusChangeListener<R, T>
  ) {
    const index = this.#statusChangeListeners[status].indexOf(listener);

    if (index === -1) {
      this.#statusChangeListeners[status].push(listener);
    }
  }

  public removeStatusChangeListener<R extends FormStatus>(
    status: R,
    listener: FormStatusChangeListener<R, T>
  ) {
    const index = this.#statusChangeListeners[status].indexOf(listener);

    if (index > -1) {
      this.#statusChangeListeners[status].splice(index, 1);
    }
  }

  public connectedCallback() {
    const formFields = Array.from(this.querySelectorAll(FormField.tag)).map(
      (formField) =>
        [formField.name, formField] as [keyof T, FormField<T[keyof T]>]
    );

    this.#formFields = Object.fromEntries(formFields) as FormFields<T>;

    formFields.forEach(([formFieldName, formField]) => {
      const formFieldStatusListeners = {
        invalid: () => {
          const invalid = this.invalid;
          const errors = this.errors;

          this.#statusChangeListeners.invalid.forEach((listener) =>
            listener(invalid, errors)
          );
        },
        dirty: () => {
          const dirty = this.dirty;

          this.#statusChangeListeners.dirty.forEach((listener) =>
            listener(dirty)
          );
        },
        touched: () => {
          const touched = this.touched;

          this.#statusChangeListeners.touched.forEach((listener) =>
            listener(touched)
          );
        },
        value: (_: T[keyof T] | null, newValue: T[keyof T] | null) => {
          const oldFormValue = this.value;

          this.#value[formFieldName as keyof T] = newValue;

          this.#statusChangeListeners.value.forEach((listener) =>
            listener(oldFormValue, this.value)
          );
        }
      };

      this.#formFieldStatusChangeListeners[formFieldName] =
        formFieldStatusListeners;

      Object.keys(formFieldStatusListeners).forEach(
        (key: keyof typeof formFieldStatusListeners) => {
          formField.addStatusChangeListener(
            key,
            formFieldStatusListeners[
              key
            ]! as FormFieldControlStatusChangeListener<typeof key>
          );
        }
      );
    });
  }

  public disconnectedCallback() {
    Object.values(this.#formFields).forEach((formField: FormField) => {
      const formFieldControlStatusListeners =
        this.#formFieldStatusChangeListeners[formField.name];

      if (formFieldControlStatusListeners) {
        Object.keys(formFieldControlStatusListeners).forEach(
          (status: FormFieldControlStatus) => {
            formField.removeStatusChangeListener(
              status,
              formFieldControlStatusListeners[status]!
            );
          }
        );
      }
    });
  }
}
