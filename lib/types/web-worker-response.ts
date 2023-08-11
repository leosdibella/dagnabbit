import { WebWorkerFunctionName } from './web-worker-function-name';

export type WebWorkerResponse<T extends WebWorkerFunctionName> =
  T extends 'topologicalSort'
    ? number[]
    : T extends 'verifyAcyclicity'
    ? number[]
    : never;
