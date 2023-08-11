import { formFieldControl } from '../../mixins';
import { customElement, observedAttribute } from '../../decorators';

@customElement({
  name: TextareaControl.tag,
  extends: 'textarea'
})
export class TextareaControl extends formFieldControl<
  string,
  HTMLTextAreaElement
>(HTMLTextAreaElement) {
  public static readonly tag = 'dagnabbit-input';

  #inputChangeListener = (inputEvent: InputEvent) => {
    this.__validate({ ...this.validity });
  };

  public connectedCallback() {
    this.__writeValue = (value) => {
      this.value = value ?? '';
    };
  }
}
