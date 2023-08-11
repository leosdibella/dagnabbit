import { WebWorkerFunctionName } from './web-worker-function-name';

export type WebWorkerArguments<T extends WebWorkerFunctionName> =
  T extends 'topologicalSort'
    ? [number[][]]
    : T extends 'verifyAcyclicity'
    ? [number[][], number[][]]
    : never;
