import { customElement } from '../decorators';

@customElement({
  name: FormFieldLabel.tag,
  html: FormFieldLabel.__html,
  styles: FormFieldLabel.__styles
})
export class FormFieldLabel extends HTMLLabelElement {
  private static __iteration = BigInt(0);
  private static readonly __html = ``;
  private static readonly __styles = ``;

  public static readonly tag = 'dagnabbit-form-field-label';

  protected readonly __iteration = ++FormFieldLabel.__iteration;
  protected readonly __id = `${FormFieldLabel.tag}-${this.__iteration}`;
  protected __htmlFor = '';
  protected __isRequiredField = false;

  public get id() {
    return this.__id;
  }

  public get htmlFor() {
    return this.__htmlFor;
  }

  public set htmlFor(htmlFor: string) {
    this.__htmlFor = htmlFor;
  }

  public get isRequiredField() {
    return this.__isRequiredField;
  }

  public set isRequiredField(isRequiredField: boolean) {
    this.__isRequiredField = isRequiredField;
  }
}
