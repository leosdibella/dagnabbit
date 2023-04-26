export declare function instantiateTopologicalSortWasmModule(): Promise<{
  memory: WebAssembly.Memory;
  topologicalSort(edges: number[][]): number[];
}>;
