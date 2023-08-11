import { CustomElementName, RadioButtonAttribute } from '../enums';
import { customElement } from '../decorators';
import { AttributeChangedCallbackHandlers } from '../types';

@customElement({
  name: CustomElementName.radioButton,
  html: RadioButton._html,
  styles: RadioButton._styles,
  delegateFocus: true,
  observedAttributes: Object.values(RadioButtonAttribute)
})
export class RadioButton extends HTMLElement {
  private static readonly _html = `
    <li
      role="radio"
      tabindex="-1"
      aria-checked="false"
      aria-disabled="false"
      data-value=""
    >
      <span>
      </span>
    </li>
    <label>
      <slot>
      <slot>
    </label>
  `;

  private static readonly _styles = `
    :host {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      padding: 0.25rem;
    }

    :host([focused]) {
      outline: 1px solid blue;
    }

    :host([checked="true"]) li[role="radio"] {
      border: 1px solid blue;
    }

    li[role="radio"] {
      cursor: pointer;
      border: 1px solid black;
      border-radius: 50%;
      height: 1rem;
      width: 1rem;
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      margin-right: 0.5rem;
    }

    li[role="radio"]:focus {
      outline: none;
    }

    li[role="radio"][aria-checked="true"] > span {
      display: inline;
      background: blue;
      height: 0.6rem;
      width: 0.6rem;
      border-radius: 50%;
    }

    li[role="radio"][aria-checked="false"] > span {
      display: none;
    }

    label {
      cursor: pointer;
    }
  `;

  private static _iteration = BigInt(0);

  private _updateStyles() {
    this.style.marginLeft =
      this._inRow && Number.isInteger(this._index) && this._index > 0
        ? '0.5rem'
        : '0';
  }

  protected readonly __attributeChangedCallbackHandlers: AttributeChangedCallbackHandlers<RadioButtonAttribute> =
    {
      [RadioButtonAttribute.value]: (_, value) => {
        this._value = value || '';

        this._liElement.setAttribute('data-value', this._value);
      },
      [RadioButtonAttribute.checked]: (_, checked) => {
        this._checked =
          typeof checked === 'string' && checked.toLowerCase() !== `${false}`;

        this._liElement.setAttribute('aria-checked', `${this._checked}`);
      },
      [RadioButtonAttribute.inRow]: (_, inRow) => {
        this._inRow =
          typeof inRow === 'string' && inRow.toLowerCase() !== `${false}`;

        this._updateStyles();
      },
      [RadioButtonAttribute.index]: (_, index) => {
        this._index = typeof index === 'string' && index.length ? +index : NaN;

        this._updateStyles();
      },
      [RadioButtonAttribute.canTabTo]: (_, canTabTo) => {
        this._canTabTo =
          typeof canTabTo === 'string' && canTabTo.toLowerCase() !== `${false}`;

        this._liElement.tabIndex = this._canTabTo ? 0 : -1;
      },
      [RadioButtonAttribute.disabled]: (_, disabled) => {
        this._disabled =
          typeof disabled === 'string' && disabled.toLowerCase() !== `${false}`;

        this.tabIndex = this._disabled ? -1 : 0;

        this._liElement.setAttribute('aria-disabled', `${this._disabled}`);
      }
    };

  private readonly _iteration = `${
    CustomElementName.radioButton
  }-${++RadioButton._iteration}`;

  private __liElement: HTMLLIElement | undefined;
  private __labelElement: HTMLLabelElement | undefined;

  private get _liElement() {
    if (!this.__liElement) {
      this.__liElement = this.shadowRoot!.querySelector<HTMLLIElement>('li')!;
    }

    return this.__liElement;
  }

  private get _labelElement() {
    if (!this.__labelElement) {
      this.__labelElement =
        this.shadowRoot!.querySelector<HTMLLabelElement>('label')!;
    }

    return this.__labelElement;
  }

  private _value = '';
  private _checked = false;
  private _inRow = false;
  private _index = NaN;
  private _canTabTo = false;
  private _disabled = false;

  public get value() {
    return this._value;
  }

  public set value(value: string) {
    this.setAttribute(RadioButtonAttribute.value, value);
  }

  public get checked() {
    return this._checked;
  }

  public set checked(checked: boolean) {
    this.setAttribute(RadioButtonAttribute.checked, `${checked}`);
  }

  public get inRow() {
    return this._inRow;
  }

  public set inRow(inRow: boolean) {
    this.setAttribute(RadioButtonAttribute.inRow, `${inRow}`);
  }

  public get index() {
    return this._index;
  }

  public set index(index: number) {
    this.setAttribute(
      RadioButtonAttribute.index,
      Number.isInteger(index) && index > -1 ? `${index}` : ''
    );
  }

  public get canTabTo() {
    return this._canTabTo;
  }

  public set canTabTo(canTabTo: boolean) {
    this.setAttribute(RadioButtonAttribute.canTabTo, `${canTabTo}`);
  }

  public get disabled() {
    return this._disabled;
  }

  public set disabled(disabled: boolean) {
    this.setAttribute(RadioButtonAttribute.disabled, `${disabled}`);
  }

  public _updateParent: ((index: number) => void) | undefined;
  public _updateParentFocus: ((focused: boolean) => void) | undefined;

  public _selectInDirection:
    | ((index: number, direction: 1 | -1) => void)
    | undefined;

  private readonly _onClick = () => {
    this.checked = true;
    this.canTabTo = true;

    if (this._updateParent) {
      this._updateParent(this.index);
    }

    this.focus();
  };

  private readonly _onBlur = () => {
    this.removeAttribute('focused');
    this._updateParentFocus?.(false);
  };

  private readonly _onFocus = () => {
    this.setAttribute('focused', '');
    this._updateParentFocus?.(true);
  };

  private readonly _onKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
      case ' ': {
        return this._onClick();
      }
      case 'ArrowUp':
      case 'ArrowRight': {
        return this._selectInDirection?.(this.index, 1);
      }
      case 'ArrowDown':
      case 'ArrowLeft': {
        return this._selectInDirection?.(this.index, -1);
      }
      default:
        return;
    }
  };

  public focus() {
    this._liElement.focus();
  }

  public blur() {
    this._liElement.blur();
  }

  public readonly liId = `${this._iteration}-input`;
  public readonly labelId = `${this._iteration}-label`;

  public connectedCallback() {
    this._liElement.id = this.liId;
    this._liElement.setAttribute('aria-labeledby', this.labelId);
    this._liElement.addEventListener('click', this._onClick);
    this._liElement.addEventListener('focus', this._onFocus);
    this._liElement.addEventListener('blur', this._onBlur);

    this._labelElement.htmlFor = this.liId;
    this._labelElement.id = this.labelId;
    this._labelElement.addEventListener('click', this._onClick);

    this.addEventListener('keydown', this._onKeydown);
    this._liElement.addEventListener('keydown', this._onKeydown);
  }
}
