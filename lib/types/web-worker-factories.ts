import { WasmModuleFunctionName } from '../enums';
import { AcyclicVerifierWebWorker } from './ayclic-verifier-web-worker';
import { TopologicalSorterWebWorker } from './topological-sorter-web-worker';

export type WebWorkerFactories = Readonly<{
  [WasmModuleFunctionName.topologicalSort]: TopologicalSorterWebWorker;
  [WasmModuleFunctionName.verifyAcyclic]: AcyclicVerifierWebWorker;
}>;
