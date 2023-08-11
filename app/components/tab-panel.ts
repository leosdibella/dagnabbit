import { CustomElementName, TabPanelAttribute } from '../enums';
import { customElement } from '../decorators';
import { AttributeChangedCallbackHandlers } from '../types';

@customElement({
  name: CustomElementName.tabPanel,
  observedAttributes: Object.values(TabPanelAttribute)
})
export class TabPanel extends HTMLDivElement {
  private static _iteration = BigInt(0);

  private readonly _defaultId = `${
    CustomElementName.tabPanel
  }-${++TabPanel._iteration}`;

  private _id = this._defaultId;
  private _tabId = '';
  private _selected = false;

  protected readonly __attributeChangedCallbackHandlers: AttributeChangedCallbackHandlers<TabPanelAttribute> =
    {
      [TabPanelAttribute.id]: (_, id) => {
        this._id = id || this._defaultId;
      },
      [TabPanelAttribute.tabId]: (_, tabId) => {
        this._tabId = tabId || '';
        this._onUpdate?.();
      },
      [TabPanelAttribute.selected]: (_, selected) => {
        this._selected =
          typeof selected === 'string' && selected.toLowerCase() !== `${false}`;

        if (this._selected) {
          this.hidden = false;
          this.tabIndex = 0;
        } else {
          this.tabIndex = -1;
          this.hidden = true;
        }
      }
    };

  public _onUpdate: (() => void) | undefined;

  public get selected() {
    return this._selected;
  }

  public set selected(selected: boolean) {
    this.setAttribute(TabPanelAttribute.selected, `${selected}`);
  }

  public get tabId() {
    return this._tabId;
  }

  public set tabId(tabId: string) {
    this.setAttribute(TabPanelAttribute.tabId, tabId);
  }

  public get id() {
    return this._id;
  }

  public set id(id: string) {
    this.setAttribute(TabPanelAttribute.id, id);
  }

  public connectedCallback() {
    this.role = 'tablpanel';
    this.setAttribute('aria-labeledby', this._tabId);
  }
}
