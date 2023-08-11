import { ObservedAttributeSanitizer, ObservedAttributeType } from '../types';

export type ObservedAttribute = {
  type: ObservedAttributeType;
  sanitizer?: ObservedAttributeSanitizer;
  reflect?: boolean;
};
