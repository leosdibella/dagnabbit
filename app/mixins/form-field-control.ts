import {
  Constructor,
  FormFieldControlElement,
  FormFieldControlStatus,
  FormFieldControlStatusChangeListener,
  FormFieldValidator
} from '../types';
import { observedAttribute } from '../decorators';

let id = BigInt(0);

export function formFieldControl<T, S extends HTMLElement = HTMLElement>(
  baseClass: CustomElementConstructor
) {
  class FormFieldControl
    extends baseClass
    implements FormFieldControlElement<T>
  {
    readonly #defaultName = `form-field-control-${++id}`;

    readonly #statusChangeListeners: {
      [k in FormFieldControlStatus]: FormFieldControlStatusChangeListener<k>[];
    } = {
      name: [],
      value: [],
      required: [],
      disabled: [],
      dirty: [],
      invalid: [],
      touched: []
    };

    readonly #validators: Partial<Record<string, FormFieldValidator<T>>> = {};
    #errors: Record<string, boolean> = {};

    public __validate(errors: Record<string, boolean> = {}) {
      this.__invalid = false;

      Object.keys(errors).forEach((errorName) => {
        this.__invalid ||= errors[errorName] || false;
      });

      Object.keys(this.#validators).forEach((validatiorName) => {
        const invalid =
          this.#validators[validatiorName]?.(this.__value) ?? false;

        errors[validatiorName] = invalid;

        this.__invalid ||= invalid;
      });

      this.#errors = errors;
    }

    public __writeValue?: (value: T | null) => void;

    public __name = '';
    public __value: T | null = null;
    public __dirty = false;
    public __touched = false;
    public __invalid = false;
    public __required = false;
    public __disabled = false;

    public get name() {
      return this.__name;
    }

    @observedAttribute(String)
    public set name(name: string) {
      this.__name = name ?? this.#defaultName;
    }

    public get value() {
      return this.__value;
    }

    @observedAttribute(Object)
    public set value(value: T | null) {
      const oldValue = this.__value;

      this.__value = value;

      this.#statusChangeListeners.value.forEach((listener) =>
        listener(oldValue, value)
      );
    }

    public get dirty() {
      return this.__dirty;
    }

    @observedAttribute(Boolean)
    public set dirty(dirty: boolean) {
      this.__dirty = dirty;

      this.#statusChangeListeners.dirty.forEach((listener) => listener(dirty));
    }

    public get touched() {
      return this.__touched;
    }

    @observedAttribute(Boolean)
    public set touched(touched: boolean) {
      this.__touched = touched;

      this.#statusChangeListeners.touched.forEach((listener) =>
        listener(touched)
      );
    }

    public get required() {
      return this.__required;
    }

    @observedAttribute(Boolean)
    public set required(required: boolean) {
      this.__required = required;

      this.#statusChangeListeners.required.forEach((listener) =>
        listener(required)
      );
    }

    public get disabled() {
      return this.__disabled;
    }

    @observedAttribute(Boolean)
    public set disabled(disabled: boolean) {
      this.__disabled = disabled;

      this.#statusChangeListeners.disabled.forEach((listener) =>
        listener(disabled)
      );
    }

    public get errors() {
      return { ...this.#errors };
    }

    public get invalid() {
      return this.__invalid;
    }

    public addStatusChangeListener<R extends FormFieldControlStatus>(
      status: R,
      listener: FormFieldControlStatusChangeListener<R, T>
    ) {
      const index = this.#statusChangeListeners[status].indexOf(listener);

      if (index === -1) {
        this.#statusChangeListeners[status].push(listener);
      }
    }

    public removeStatusChangeListener<R extends FormFieldControlStatus>(
      status: R,
      listener: FormFieldControlStatusChangeListener<R, T>
    ) {
      const index = this.#statusChangeListeners[status].indexOf(listener);

      if (index > -1) {
        this.#statusChangeListeners[status].splice(index, 1);
      }
    }

    public addValidator(name: string, validator?: FormFieldValidator) {
      this.#validators[name] = validator;
    }

    public removeValidator(name: string) {
      this.#validators[name] = undefined;
    }
  }

  return FormFieldControl as typeof FormFieldControl & Constructor<S>;
}
