import {
  ObservedAttributeMetadata,
  ObservedAttribute,
  ObservedAttributeType
} from '../types';

const reflectableObservedAttributeTypes = new Map<
  ObservedAttributeType,
  boolean
>([
  [String, true],
  [Boolean, true],
  [Number, true],
  [Date, true],
  [BigInt, true]
]);

export const observedAttributeMetadataKey = Symbol(
  'OBSERVED_ATTRIBUTE_METADATA'
);

export const observedAttribute =
  (attribute: ObservedAttribute | ObservedAttributeType): PropertyDecorator =>
  (target, property) => {
    const metadata: ObservedAttributeMetadata =
      Reflect.getMetadata(observedAttributeMetadataKey, target.constructor) ??
      {};

    (metadata as Record<string | symbol, ObservedAttribute>)[property] =
      typeof attribute === 'object'
        ? (attribute as ObservedAttribute)
        : {
            type: attribute,
            reflect: !!reflectableObservedAttributeTypes.get(
              attribute as ObservedAttributeType
            )
          };

    Reflect.defineMetadata(
      observedAttributeMetadataKey,
      metadata,
      target.constructor
    );
  };
