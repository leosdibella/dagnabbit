import { CustomElementName } from '../enums';
import { customElement } from '../decorators';

@customElement({
  name: CustomElementName.randomized,
  html: Randomized._html,
  styles: Randomized._styles,
  delegateFocus: true
})
export class Randomized extends HTMLElement {
  private static readonly _html = `
    <form is="dagnabbit-form">
      <dagnabbit-form-control name="trial-type">
        <dagnabbit-radio-button-group
          row
          value="multiple"
        >
          <span slot="label">
            Trial Type
          </span>
          <dagnabbit-radio-button value="multiple">
            <span>
              Multiple
            </span>
          </dagnabbit-radio-button>
          <dagnabbit-radio-button value="single">
            <span>
              Single
            </span>
          </dagnabbit-radio-button>
        </dagnabbit-radio-button-group>
      </dagnabbit-form-control>
    </form>
  `;

  private static readonly _styles = ``;
}
