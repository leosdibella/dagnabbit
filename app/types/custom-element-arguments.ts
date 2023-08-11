export type CustomElementArguments = {
  name: string;
  extends?: string;
  html?: string;
  styles?: string;
  delegateFocus?: boolean;
  shadowRootMode?: ShadowRootMode;
  slotAssignmentMode?: SlotAssignmentMode;
};
