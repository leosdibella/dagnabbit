import { DirectedAcyclicGraphErrorCode } from '../enums';

export class DirectedAcyclicGraphError extends Error {
  readonly #directedCyclicGraphErrorCode: DirectedAcyclicGraphErrorCode;

  public get directedCyclicGraphErrorCode() {
    return this.#directedCyclicGraphErrorCode;
  }

  public constructor(
    directedCyclicGraphErrorCode: DirectedAcyclicGraphErrorCode,
    message: string
  ) {
    super(message);

    this.#directedCyclicGraphErrorCode = directedCyclicGraphErrorCode;
  }
}
