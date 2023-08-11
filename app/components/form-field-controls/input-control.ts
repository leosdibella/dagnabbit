import { formFieldControl } from '../../mixins';
import { customElement, observedAttribute } from '../../decorators';
import { ensureMembership } from '../../utilities';

const inputTypes = [
  'text',
  'date',
  'text',
  'date',
  'month',
  'week',
  'time',
  'datetime-local',
  'number',
  'range'
] as const;

type InputType = (typeof inputTypes)[number];

@customElement({
  name: InputControl.tag,
  extends: 'input'
})
export class InputControl extends formFieldControl<string, HTMLInputElement>(
  HTMLInputElement
) {
  public static readonly tag = 'dagnabbit-input';
  protected __type: InputType = 'text';

  protected __inputChangeListener = (inputEvent: InputEvent) => {
    this.__validate({ ...this.validity });
  };

  @observedAttribute(String)
  public set type(type: string) {
    this.__type = ensureMembership(inputTypes, type, 'text');
    this.__reconfigure;
  }

  public get type() {
    return this.__type;
  }

  public connectedCallback() {
    this.__writeValue = (value) => {
      this.value = value ?? '';
    };
  }
}
