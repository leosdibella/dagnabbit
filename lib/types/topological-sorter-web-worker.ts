export type TopologicalSorterWebWorker = (
  edges: number[][],
  useWasm: boolean
) => Promise<number[]>;
