import { AcyclicVerifier } from './acyclic-verifier';
import { TopologicalSorter } from './topological-sorter';
import { WebWorkerFunctionName } from './web-worker-function-name';

export type WebWorkerFunction<T extends WebWorkerFunctionName> =
  T extends 'topologicalSort'
    ? TopologicalSorter
    : T extends 'verifyAcyclicity'
    ? AcyclicVerifier
    : never;
