import { slotted } from '../mixins';
import { customElement, observedAttribute } from '../decorators';
import { FormFieldLabel } from './form-field-label';
import {
  FormFieldControlElement,
  FormFieldControlStatus,
  FormFieldControlStatusChangeListener
} from '../types';

@customElement({
  name: FormField.tag,
  html: FormField.__html,
  styles: FormField.__styles,
  delegateFocus: true,
  slotAssignmentMode: 'manual'
})
export class FormField<T = unknown> extends slotted<
  'label' | 'control' | 'error-message' | 'description'
>(HTMLElement) {
  private static readonly __html = `
    <slot
      name="label"
      hidden
    >
    </slot>
    <slot name="control">
    </slot>
    <slot
      name="description"
      hidden
    >
    </slot>
    <slot
      name="error-message"
      hidden
    >
    </slot>
  `;

  private static readonly __styles = ``;
  private static __iteration = BigInt(0);
  public static readonly tag = 'dagnabbit-form-field';
  readonly #default = `${FormField.tag}-${++FormField.__iteration}`;

  #id = this.#default;

  get #control() {
    return this.__getSlottedElement<FormFieldControlElement<T>>('control');
  }

  @observedAttribute(String)
  public set id(id: string) {
    this.#id = id || this.#default;

    const label = this.__getSlottedElement<FormFieldLabel>('label');
    const controlId = `${this.#id}-control`;
    const labelId = `${this.#id}-label`;

    if (this.#control) {
      this.#control.id = controlId;

      if (label) {
        this.#control.setAttribute('aria-labeledby', labelId);
      }
    }

    if (label) {
      label.htmlFor = controlId;
    }
  }

  public get id() {
    return this.#id;
  }

  public get name() {
    return this.#control?.name ?? this.#default;
  }

  public get invalid() {
    return this.#control?.invalid ?? false;
  }

  public get required() {
    return this.#control?.required ?? false;
  }

  public get disabled() {
    return this.#control?.disabled ?? false;
  }

  public get touched() {
    return this.#control?.touched ?? false;
  }

  public get dirty() {
    return this.#control?.dirty ?? false;
  }

  public get errors() {
    return this.#control?.errors ?? {};
  }

  public get value() {
    return this.#control?.value ?? null;
  }

  public set value(value: T | null) {
    const control = this.#control;

    if (control) {
      control.value = value;
    }
  }

  public addStatusChangeListener<R extends FormFieldControlStatus>(
    status: R,
    listener: FormFieldControlStatusChangeListener<R, T>
  ) {
    this.#control?.addStatusChangeListener(status, listener);
  }

  public removeStatusChangeListener<R extends FormFieldControlStatus>(
    status: R,
    listener: FormFieldControlStatusChangeListener<R, T>
  ) {
    this.#control?.removeStatusChangeListener(status, listener);
  }

  public connectedCallback() {
    const formFieldLabel = this.querySelector(FormFieldLabel.tag);

    if (formFieldLabel) {
      const labelSlotElement = this.__getSlotElement('label');

      if (labelSlotElement) {
        labelSlotElement.assign(formFieldLabel);
        labelSlotElement.removeAttribute('hidden');
      }
    }

    this.__assignSlottedElements(['control', 'description', 'error-message']);
  }
}
