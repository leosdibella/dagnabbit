import { CustomElementName, RadioButtonGroupAttribute } from '../enums';
import { customElement } from '../decorators';
import { AttributeChangedCallbackHandlers } from '../types';
import { RadioButton } from './radio-button';

@customElement({
  name: CustomElementName.radioButtonGroup,
  html: RadioButtonGroup._html,
  styles: RadioButtonGroup._styles,
  delegateFocus: true,
  observedAttributes: Object.values(RadioButtonGroupAttribute),
  slotAssignmentMode: 'manual'
})
export class RadioButtonGroup extends HTMLElement {
  private static readonly _html = `
    <fieldset>
      <legend>
        <slot name="label">
        </slot>
      </legend>
      <ol role="radiogroup">
        <slot name="radio-button">
        </slot>
      </ol>
    </fieldset>
  `;

  private static readonly _styles = `
    fieldset {
      border-radius: 4px;
      border-width: 1px;
    }

    :host([focused]) > fieldset {
      border-color: blue;
    }

    :host([focused]) > fieldset > legend {
      color: blue;
    }

    ol[role="radiogroup"] {
      display: flex;
      align-items: center;
      margin: 0.5rem;
      padding: 0;
    }
  `;

  protected readonly __attributeChangedCallbackHandlers: AttributeChangedCallbackHandlers<RadioButtonGroupAttribute> =
    {
      [RadioButtonGroupAttribute.row]: (_, row) => {
        this._row = typeof row === 'string' && row.toLowerCase() !== `${false}`;

        this._radioButtonsContainerElement.style.flexDirection = this._row
          ? 'row'
          : 'column';
      },
      [RadioButtonGroupAttribute.value]: (_, value) => {
        this._value = value || '';

        this._radioButtons.forEach((radioButton) => {
          radioButton.checked = radioButton.value === value;
        });
      },
      [RadioButtonGroupAttribute.disabled]: (_, disabled) => {
        this._disabled =
          typeof disabled === 'string' && disabled.toLowerCase() !== `${false}`;

        this.tabIndex = this._disabled ? -1 : 0;
      }
    };

  private __labelSlotElement: HTMLSlotElement | undefined;
  private __radioButtonSlotElement: HTMLSlotElement | undefined;
  private __radioButtonsContainerElement: HTMLDivElement | undefined;

  private get _labelSlotElement() {
    if (!this.__labelSlotElement) {
      this.__labelSlotElement =
        this.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="label"]')!;
    }

    return this.__labelSlotElement;
  }

  private get _radioButtonSlotElement() {
    if (!this.__radioButtonSlotElement) {
      this.__radioButtonSlotElement =
        this.shadowRoot!.querySelector<HTMLSlotElement>(
          'slot[name="radio-button"]'
        )!;
    }

    return this.__radioButtonSlotElement;
  }

  private get _radioButtonsContainerElement() {
    if (!this.__radioButtonsContainerElement) {
      this.__radioButtonsContainerElement =
        this.shadowRoot!.querySelector<HTMLDivElement>(
          'ol[role="radiogroup"]'
        )!;
    }

    return this.__radioButtonsContainerElement;
  }

  private __radioButtons: RadioButton[] = [];

  private get _radioButtons() {
    if (!this.__radioButtons.length) {
      this.__radioButtons =
        this._radioButtonSlotElement.assignedElements() as RadioButton[];
    }

    return this.__radioButtons;
  }

  private __checkedRadioButtonId: string | undefined = undefined;
  private _row = false;
  private _value = '';
  private _disabled = false;

  public get row() {
    return this._row;
  }

  public set row(row: boolean) {
    this.setAttribute(RadioButtonGroupAttribute.row, `${row}`);
  }

  public get value() {
    return this._value;
  }

  public set value(value: string) {
    this.setAttribute(RadioButtonGroupAttribute.value, value);
  }

  public get disabled() {
    return this._disabled;
  }

  public set disabled(disabled: boolean) {
    this.setAttribute(RadioButtonGroupAttribute.disabled, `${disabled}`);
  }

  private readonly _onChildFocusChange = (focused: boolean) => {
    if (focused) {
      this.setAttribute('focused', '');
    } else {
      this.removeAttribute('focused');
    }
  };

  private readonly _onUpdate = (index: number) => {
    this._radioButtons.forEach((radioButton, i) => {
      if (i !== index) {
        radioButton.checked = false;
        radioButton.canTabTo = false;
      } else {
        this.setAttribute('aria-activedescendant', radioButton.liId);
        this.value = radioButton.value;
        radioButton.canTabTo = true;
      }
    });
  };

  private _getNextRadioButtonIndex(nextIndex: number) {
    return nextIndex === -1
      ? this._radioButtons.length - 1
      : nextIndex % this._radioButtons.length;
  }

  private _getNextRadioButton(index: number, direction: 1 | -1) {
    let nextIndex = index;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      nextIndex = this._getNextRadioButtonIndex(nextIndex + direction);

      if (nextIndex === index) {
        return;
      }

      if (!this._radioButtons[nextIndex].disabled) {
        return this._radioButtons[nextIndex];
      }
    }
  }

  private readonly _selectInDirection = (index: number, direction: 1 | -1) => {
    const nextRadioButton = this._getNextRadioButton(index, direction);

    if (nextRadioButton) {
      nextRadioButton.checked = true;
      nextRadioButton.canTabTo = true;
      nextRadioButton.focus();

      this._radioButtons.forEach((radioButton) => {
        if (radioButton !== nextRadioButton) {
          radioButton.checked = false;
          radioButton.canTabTo = false;
        }
      });
    }
  };

  private _configureChildren() {
    this._radioButtons.forEach((radioButton, i) => {
      if (this._value && radioButton.value === this._value) {
        this.__checkedRadioButtonId = radioButton.id;
        radioButton.checked = true;
      } else if (!this.__checkedRadioButtonId && radioButton.checked) {
        this.__checkedRadioButtonId = radioButton.id;
      }

      if (radioButton.id !== this.__checkedRadioButtonId) {
        radioButton.checked = false;
      }

      radioButton.index = i;
      radioButton.inRow = this.row;
      radioButton._updateParent = this._onUpdate;
      radioButton._updateParentFocus = this._onChildFocusChange;
      radioButton._selectInDirection = this._selectInDirection;
    });
  }

  public connectedCallback() {
    const label = this.querySelector<HTMLElement>('[slot="label"]');

    const radioButtons = Array.from(
      this.querySelectorAll<RadioButton>(CustomElementName.radioButton)
    );

    this._radioButtonSlotElement.assign(...radioButtons);

    if (label) {
      this._labelSlotElement.assign(label);
    }

    this._configureChildren();
  }
}
