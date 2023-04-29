import { WasmModuleFunctionName } from '../enums';

export interface IWasmModule {
  [WasmModuleFunctionName.topologicalSort](edges: number[][]): number[];
  [WasmModuleFunctionName.verifyAcyclic](edges: number[][]): number[];
}
