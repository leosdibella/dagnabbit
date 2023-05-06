import { DirectedAcyclicGraphErrorCode } from '../enums';

export class DirectedAcyclicGraphError extends Error {
  private readonly _directedCyclicGraphErrorCode: DirectedAcyclicGraphErrorCode;

  public get directedCyclicGraphErrorCode() {
    return this._directedCyclicGraphErrorCode;
  }

  public constructor(
    directedCyclicGraphErrorCode: DirectedAcyclicGraphErrorCode,
    message: string
  ) {
    super(message);

    this._directedCyclicGraphErrorCode = directedCyclicGraphErrorCode;
  }
}
