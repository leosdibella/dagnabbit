import { WasmModuleFunctionName } from '../enums';

export type WebWorkerResponse<T extends WasmModuleFunctionName> =
  T extends WasmModuleFunctionName.topologicalSort
    ? number[]
    : T extends WasmModuleFunctionName.verifyAcyclic
    ? number
    : never;
