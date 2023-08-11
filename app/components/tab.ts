import { AttributeType, CustomElementName, TabAttribute } from '../enums';
import { customElement } from '../decorators';
import { AttributeChangedCallbackHandlers } from '../types';
import { idMixin, indexMixin } from '../mixins';

@customElement({
  name: CustomElementName.tab,
  html: Tab._html,
  styles: Tab._styles,
  observedAttributes: {
    [TabAttribute.id]: AttributeType.string,
    [TabAttribute.closeable]: AttributeType.boolean,
    [TabAttribute.disabled]: AttributeType.boolean,
    [TabAttribute.index]: AttributeType.nonNegativeInteger,
    [TabAttribute.selected]: AttributeType.boolean,
    [TabAttribute.tabPanelId]: AttributeType.string,
    [TabAttribute.canTabTo]: AttributeType.boolean
  },
  delegateFocus: true
})
export class Tab extends indexMixin(
  idMixin(HTMLElement, CustomElementName.tab)
) {
  private static readonly _html = `
    <div class="spacer">
    </div>
    <button
      type="button"
      role="tab"
      aria-selected="false"
      tabindex="-1"
    >
      <slot name="label">
      </slot>
    </button>
    <button
      type="button"
      tabindex="-1"
      class="close-button"
      disabled
    >
      <slot name="close-button">
      </slot>
    </button>
  `;

  private static readonly _styles = `
    :host {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #dddddd;
      background: #ffffff;
      border-radius: 4px 4px 0 0;
    }

    button[role="tab"] {
      color: #dddddd;
      border: none;
      cursor: pointer;
      background: #ffffff;
      font-size: 1.25rem;
      text-align: center;
      width: 100%;
      padding: 0.5rem;
    }

    :host(:focus) {
      outline: blue;
    }
  
    :host([selected]) button[role="tab"] {
      border-bottom: 1px solid blue;
      color: blue;
    }

    :host([closeable="true"]) button.close-button {

    }

    :host([closeable="false"]) button.close-button,
    :host(:not([closeable])) button.close-button {
      padding: 0;
    }
  `;

  protected readonly __attributeChangedCallbackHandlers: AttributeChangedCallbackHandlers<TabAttribute> =
    {
      [TabAttribute.id]: (_, id) => {
        this.__id = id || this.__defaultId;
      },
      [TabAttribute.selected]: (_, selected) => {
        this._selected =
          typeof selected === 'string' && selected.toLowerCase() !== `${false}`;

        this._update();
      },
      [TabAttribute.tabPanelId]: (_, tabPanelId) => {
        this._tabPanelId = tabPanelId || '';
        this.setAttribute('aria-controls', this._tabPanelId);
      },
      [TabAttribute.disabled]: (_, disabled) => {
        this._disabled =
          typeof disabled === 'string' && disabled.toLowerCase() !== `${false}`;
      },
      [TabAttribute.canTabTo]: (_, canTabTo) => {
        this._canTabTo =
          typeof canTabTo === 'string' && canTabTo.toLowerCase() !== `${false}`;

        this._buttonElement.tabIndex = this._canTabTo ? 0 : -1;
      },
      [TabAttribute.index]: (_, index) => {
        this.__index = typeof index === 'string' && index.length ? +index : NaN;
      }
    };

  private _tabPanelId = '';
  private _selected = false;
  private _disabled = false;
  private _canTabTo = false;

  private get _buttonElement() {
    return this.shadowRoot!.querySelector<HTMLButtonElement>('button')!;
  }

  private _update() {
    if (this._buttonElement) {
      if (this._selected) {
        this._buttonElement.ariaSelected = `${true}`;
        this._buttonElement.tabIndex = 0;
      } else {
        this._buttonElement.ariaSelected = `${false}`;
        this._buttonElement.tabIndex = -1;
      }
    }
  }

  private _onClick: (() => void) | undefined;

  public _addOnClickEventListener(
    onClick: ((index: number) => void) | undefined
  ) {
    if (this._onClick) {
      return;
    }

    this._onClick = onClick ? () => onClick(this.index) : undefined;

    if (this._onClick) {
      this._buttonElement.addEventListener('click', this._onClick);
    }
  }

  public get disabled() {
    return this._disabled;
  }

  public set disabled(disabled: boolean) {
    this.setAttribute(TabAttribute.disabled, `${disabled}`);
  }

  public get tabPanelId() {
    return this._tabPanelId;
  }

  public set tabPanelId(tabPanelId: string) {
    this.setAttribute(TabAttribute.tabPanelId, tabPanelId);
  }

  public get selected() {
    return this._selected;
  }

  public set selected(selected: boolean) {
    this.setAttribute(TabAttribute.selected, `${selected}`);
  }

  public get canTabTo() {
    return this._canTabTo;
  }

  public set canTabTo(canTabTo: boolean) {
    this.setAttribute(TabAttribute.canTabTo, `${canTabTo}`);
  }

  public focus() {
    this._buttonElement.focus();
  }

  public blur() {
    this._buttonElement.blur();
  }

  public _selectInDirection:
    | ((index: number, direction: 1 | -1) => void)
    | undefined;

  public _selectFirstOrLast:
    | ((firstOrLast: 'first' | 'last') => void)
    | undefined;

  private readonly _onKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
      case ' ': {
        return this._onClick?.();
      }
      case 'ArrowRight': {
        return this._selectInDirection?.(this.index, 1);
      }
      case 'ArrowLeft': {
        return this._selectInDirection?.(this.index, -1);
      }
      case 'Home': {
        return this._selectFirstOrLast?.('first');
      }
      case 'End': {
        return this._selectFirstOrLast?.('last');
      }
      default:
        return;
    }
  };

  private readonly _onBlur = () => {
    this.removeAttribute('focus');
  };

  private readonly _onFocus = () => {
    this.setAttribute('focus', '');
  };

  public connectedCallback() {
    this._buttonElement.addEventListener('keydown', this._onKeydown);
    this._buttonElement.addEventListener('focus', this._onFocus);
    this._buttonElement.addEventListener('blur', this._onBlur);
  }
}
