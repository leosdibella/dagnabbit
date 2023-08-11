export function slotted<
  T extends string = string,
  S extends CustomElementConstructor = CustomElementConstructor
>(baseClass: S) {
  return class Slotted extends baseClass {
    public readonly __slotElements: Partial<Record<T, HTMLSlotElement>> = {};

    public __getSlotElement(name: T) {
      let slotElement = this.__slotElements[name];

      if (!slotElement) {
        slotElement =
          this.shadowRoot?.querySelector<HTMLSlotElement>(
            `slot[name="${name}"]`
          ) ?? undefined;

        this.__slotElements[name] = slotElement;
      }

      return slotElement;
    }

    public __getSlottedElement<R extends HTMLElement>(slot: T) {
      return this.querySelector<R>(`[slot="${slot}"]`);
    }

    public __assignSlottedElements(slotNames: T[]) {
      slotNames.forEach((slotName) => {
        const slottedElement = this.__getSlottedElement(slotName);

        if (slottedElement) {
          this.__getSlotElement(slotName)?.assign(slottedElement);
        }
      });
    }
  };
}
