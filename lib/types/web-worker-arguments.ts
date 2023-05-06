import { WasmModuleFunctionName } from '../enums';

export type WebWorkerArguments<T extends WasmModuleFunctionName> =
  T extends WasmModuleFunctionName.topologicalSort
    ? [number[][]]
    : T extends WasmModuleFunctionName.verifyAcyclicity
    ? [number[][], number[][]]
    : never;
