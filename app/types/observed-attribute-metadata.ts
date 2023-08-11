import { ObservedAttribute } from './observed-attribute';

export type ObservedAttributeMetadata<T = unknown> = Record<
  keyof T & string,
  ObservedAttribute
>;
