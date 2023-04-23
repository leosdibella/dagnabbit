export interface ITopologicalSortWebWorkerMessage {
  edges: number[][];
  topologicalSortNativeCode: string;
  topologicalSortWasmCode: string;
  base64TopologicalSortWasm: string;
}
