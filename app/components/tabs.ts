import { CustomElementName, TabsAttribute } from '../enums';
import { customElement } from '../decorators';
import { Tab } from './tab';
import { TabPanel } from './tab-panel';
import { ITabsChangeEvent } from '../interfaces';

@customElement({
  name: CustomElementName.tabs,
  html: Tabs._html,
  styles: Tabs._styles,
  observedAttributes: Object.values(TabsAttribute),
  delegateFocus: true,
  slotAssignmentMode: 'manual'
})
export class Tabs extends HTMLElement {
  private static readonly _html = `
    <slot name="label">
    </slot>
    <div role="tablist">
      <slot name="tab">
      </slot>
    </div>
    <div class="tab-panels-container">
      <slot name="tab-panel">
      </slot>
    </div>
  `;

  private static readonly _styles = `
    div[role="tablist"] {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
    }

    div[role="tablist"] > ::slotted(dagnabbit-tab) {
      flex: 1 1 auto;
    }
    
    div.tab-panels-container {
      border-top: 1px solid #dddddd;
      padding: 0.5rem;
    }
  `;

  private static _iteration = BigInt(0);

  private __labelSlotElement: HTMLSlotElement | undefined;
  private __tabSlotElement: HTMLSlotElement | undefined;
  private __tabPanelSlotElement: HTMLSlotElement | undefined;
  private __tabListElement: HTMLDivElement | undefined;

  private get _labelSlotElement() {
    if (!this.__labelSlotElement) {
      this.__labelSlotElement =
        this.shadowRoot!.querySelector<HTMLSlotElement>('slot[name="label"]')!;
    }

    return this.__labelSlotElement;
  }

  private get _tabSlotElement() {
    if (!this.__tabSlotElement) {
      this.__tabSlotElement =
        this.shadowRoot!.querySelector<HTMLSlotElement>(`slot[name="tab"]`)!;
    }

    return this.__tabSlotElement!;
  }

  private get _tabPanelSlotElement() {
    if (!this.__tabPanelSlotElement) {
      this.__tabPanelSlotElement =
        this.shadowRoot!.querySelector<HTMLSlotElement>(
          `slot[name="tab-panel"]`
        )!;
    }

    return this.__tabPanelSlotElement!;
  }

  private get _tabListElement() {
    if (!this.__tabListElement) {
      this.__tabListElement = this.shadowRoot!.querySelector<HTMLDivElement>(
        'div[role="tablist"]'
      )!;
    }

    return this.__tabListElement;
  }

  private __tabs: Tab[] = [];
  private __tabPanels: TabPanel[] = [];
  private __selectedTabId: string | undefined;

  private get _tabs() {
    if (!this.__tabs.length) {
      this.__tabs = this._tabSlotElement.assignedElements() as Tab[];
    }

    return this.__tabs;
  }

  private get _tabPanels() {
    if (!this.__tabPanels.length) {
      this.__tabPanels = this._tabSlotElement.assignedElements() as TabPanel[];
    }

    return this.__tabPanels;
  }

  private readonly _tabOnClick = (toTabIndex: number) => {
    (this._tabPanelSlotElement.assignedElements() as TabPanel[]).forEach(
      (tabPanel, i) => {
        tabPanel.selected = i === toTabIndex;
      }
    );

    (this._tabSlotElement.assignedElements() as Tab[]).forEach((tab, i) => {
      tab.selected = i === toTabIndex;
    });

    const tab = this._tabs[toTabIndex];

    const fromTabIndex = this._tabs.find(
      (t) => t.id === this.__selectedTabId
    )?.index;

    this.__selectedTabId = tab.id;

    this.dispatchEvent(
      new CustomEvent<ITabsChangeEvent>('change', {
        detail: {
          fromTabIndex,
          toTabIndex
        }
      })
    );
  };

  private readonly _tabPanelOnUpdate = () => {
    if (this.__selectedTabId === undefined) {
      this._tabs.forEach((tab) => {
        if (tab.selected) {
          this.__selectedTabId = tab.id;

          const tabPanel = this._tabPanels[tab.index];

          if (tabPanel) {
            tabPanel.selected = true;
          }
        }
      });
    }
  };

  private _configureChildren() {
    this._tabs.forEach((tab, i) => {
      if (!this.__selectedTabId && tab.selected) {
        this.__selectedTabId = tab.id;
      }

      if (tab.id !== this.__selectedTabId) {
        tab.selected = false;
      }

      tab.tabPanelId =
        this._tabPanels.find((tabPanel) => tabPanel.tabId === tab.id)?.id || '';

      tab.index = i;
      tab._addOnClickEventListener(this._tabOnClick);
      tab._selectInDirection = this._selectInDirection;
      tab._selectFirstOrLast = this._selectFirstOrLast;
    });

    this._tabPanels.forEach((tabPanel, i) => {
      tabPanel._onUpdate = this._tabPanelOnUpdate;
      tabPanel.tabId = this._tabs[i].id;
    });
  }

  private _getNextTabIndex(nextIndex: number) {
    return nextIndex === -1
      ? this._tabs.length - 1
      : nextIndex % this._tabs.length;
  }

  private _getNextTab(index: number, direction: 1 | -1) {
    let nextIndex = index;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      nextIndex = this._getNextTabIndex(nextIndex + direction);

      if (nextIndex === index) {
        return;
      }

      if (!this._tabs[nextIndex].disabled) {
        return this._tabs[nextIndex];
      }
    }
  }

  private readonly _selectInDirection = (index: number, direction: 1 | -1) => {
    const nextTab = this._getNextTab(index, direction);

    if (nextTab) {
      nextTab.selected = true;
      nextTab.canTabTo = true;
      nextTab.focus();

      this._tabs.forEach((tab) => {
        if (tab !== nextTab) {
          tab.selected = false;
          tab.canTabTo = false;
        }
      });
    }
  };

  private readonly _selectFirstOrLast = (firstOrLast: 'first' | 'last') => {
    if (firstOrLast === 'first') {
      this._selectInDirection(this._tabs.length - 1, 1);
    } else {
      this._selectInDirection(0, -1);
    }
  };

  private readonly _defaultLabelId = `${
    CustomElementName.tabs
  }-${++Tabs._iteration}-label`;

  public connectedCallback() {
    const tabs = Array.from(this.querySelectorAll<Tab>(CustomElementName.tab));
    const tabListLabel = this.querySelector<HTMLElement>('[slot="label"]');

    const tabPanels = Array.from(
      this.querySelectorAll<TabPanel>(`div[is="${CustomElementName.tabPanel}"`)
    );

    this._tabSlotElement.assign(...tabs);
    this._tabPanelSlotElement.assign(...tabPanels);

    if (tabListLabel) {
      this._labelSlotElement.assign(tabListLabel);

      if (!tabListLabel.id) {
        tabListLabel.id = this._defaultLabelId;
      }

      this._tabListElement.setAttribute('aria-labeledby', tabListLabel.id);
    }

    this._configureChildren();
  }
}
