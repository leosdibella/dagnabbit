import { DirectedAcyclicGraphErrorType } from 'lib/types';

export class DirectedAcyclicGraphError extends Error {
  public get directedCyclicGraphErrorType() {
    return this._directedCyclicGraphErrorType;
  }

  public constructor(
    private readonly _directedCyclicGraphErrorType: DirectedAcyclicGraphErrorType,
    message: string
  ) {
    super(message);
  }
}
