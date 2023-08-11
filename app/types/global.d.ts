import * as components from '../components';

export {};

declare global {
  export interface HTMLElementTagNameMap {
    [components.Form.tag]: components.Form;
    [components.FormField.tag]: components.FormField;
    [components.FormFieldLabel.tag]: components.FormFieldLabel;
    [CustomElementName.radioButtonGroup]: components.RadioButtonGroup;
    [CustomElementName.radioButton]: components.RadioButton;
    [CustomElementName.tab]: components.Tab;
    [CustomElementName.tabPanel]: components.TabPanel;
    [CustomElementName.tabs]: components.Tabs;
    [CustomElementName.randomized]: components.Randomized;
    [CustomElementName.specified]: components.Specified;
    [CustomElementName.results]: components.Results;
  }
}
