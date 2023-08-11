import { noOp } from '../utilities';
import {
  CustomElementArguments,
  ObservedAttributeMetadata,
  ObservedAttributeSanitizer,
  ObservedAttributeType
} from '../types';
import { observedAttributeMetadataKey } from './observed-attribute';

const defaultSanitizers = new Map<
  ObservedAttributeType,
  ObservedAttributeSanitizer
>([
  [String, noOp],
  [Boolean, (value) => value.toLowerCase() !== 'false'],
  [Number, (value) => +value],
  [Date, (value) => Date.parse(value)],
  [BigInt, (value) => BigInt(value)]
]);

// Browser API for updating observed attributes is synchronous so only one
// variable is needed, not a map or anything more sophisticated
let observedAttributeOldValue: string | null | undefined;

export function customElement(customElementArguments: CustomElementArguments) {
  return function customElementFactory<S extends CustomElementConstructor>(
    customElementClass: S
  ): S {
    if (customElementArguments.name.trim().length === 0) {
      throw new Error('CustomElement defintion error: name cannot be empty!');
    }

    if (customElements.get(customElementArguments.name)) {
      throw new Error(
        'CustomElement defintion error: duplicate custom element name detected!'
      );
    }

    const elementDefinitionOptions: ElementDefinitionOptions | undefined =
      customElementArguments.extends
        ? {
            extends: customElementArguments.extends
          }
        : undefined;

    const template = customElementArguments.extends
      ? undefined
      : document.createElement('template');

    if (template) {
      template.id = `dagnabbit-${customElementArguments.name}-template`;

      template.innerHTML = `<style>${
        customElementArguments.styles || ''
      }</style>${customElementArguments.html}`;
    }

    class CustomElementDefinition extends customElementClass {
      static #observedAttributes: Readonly<(keyof S)[]> | undefined;
      static #observedAttributesMetadata: ObservedAttributeMetadata<S>;

      public static get observedAttributes() {
        return CustomElementDefinition.#observedAttributes ?? [];
      }

      public attributeChangedCallback(
        name: string & keyof this & keyof S,
        oldValue: string | null,
        newValue: string | null
      ) {
        const observedAttribute =
          CustomElementDefinition.#observedAttributesMetadata[name];

        const observedAttributeSanitizer =
          observedAttribute.sanitizer ??
          defaultSanitizers.get(observedAttribute.type) ??
          noOp;

        const sanitizedValue =
          newValue !== null ? observedAttributeSanitizer(newValue) : newValue;

        if (observedAttribute.reflect) {
          if (sanitizedValue !== newValue) {
            observedAttributeOldValue = oldValue;

            if (sanitizedValue === null) {
              return this.removeAttribute(name);
            } else {
              // TODO: Replace with better JSON
              return this.setAttribute(name, JSON.stringify(sanitizedValue));
            }
          }
        }

        const _oldValue = observedAttributeOldValue ?? oldValue;

        observedAttributeOldValue = undefined;

        if (_oldValue !== sanitizedValue) {
          (this[name] as unknown) = sanitizedValue;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      constructor(..._: any[]) {
        super(..._);

        if (!CustomElementDefinition.#observedAttributesMetadata) {
          CustomElementDefinition.#observedAttributesMetadata =
            Reflect.getMetadata(
              observedAttributeMetadataKey,
              customElementClass
            ) ?? {};

          CustomElementDefinition.#observedAttributes = Object.keys(
            CustomElementDefinition.#observedAttributesMetadata
          ) as (keyof S)[];
        }

        if (template) {
          const shadowRoot = this.attachShadow({
            mode: customElementArguments.shadowRootMode ?? 'open',
            delegatesFocus: customElementArguments.delegateFocus,
            slotAssignment: customElementArguments.slotAssignmentMode
          });

          shadowRoot.appendChild(template.content.cloneNode(true));
        }
      }
    }

    if (template) {
      document.body.appendChild(template);
    }

    customElements.define(
      customElementArguments.name,
      CustomElementDefinition,
      elementDefinitionOptions
    );

    return CustomElementDefinition as S;
  };
}
