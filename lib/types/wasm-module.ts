import { WasmModuleFunctionName } from '../enums';

export type WasmModule = {
  [WasmModuleFunctionName.topologicalSort](edges: number[][]): number[];
  [WasmModuleFunctionName.verifyAcyclic](
    outEdges: number[][],
    inEdges: number[][]
  ): number;
};
