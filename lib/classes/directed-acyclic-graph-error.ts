import { DirectedAcyclicGraphErrorCode } from '../enums';

export class DirectedAcyclicGraphError extends Error {
  readonly #directedCyclicGraphErrorCode: DirectedAcyclicGraphErrorCode;
  readonly #relatedError: Error | undefined;

  public get directedCyclicGraphErrorCode() {
    return this.#directedCyclicGraphErrorCode;
  }

  public get relatedError() {
    return this.#relatedError;
  }

  public constructor(
    directedCyclicGraphErrorCode: DirectedAcyclicGraphErrorCode,
    message: string,
    relatedError?: Error
  ) {
    super(message);

    this.#directedCyclicGraphErrorCode = directedCyclicGraphErrorCode;
    this.#relatedError = relatedError;
  }
}
