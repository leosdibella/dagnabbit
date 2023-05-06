import { WasmModuleFunctionName } from '../enums';

export type WasmModule = {
  [WasmModuleFunctionName.topologicalSort](edges: number[][]): number[];
  [WasmModuleFunctionName.verifyAcyclicity](
    outEdges: number[][],
    inEdges: number[][]
  ): number[];
};
