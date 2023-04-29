export interface IPlatformParameters {
  supportsWasm: boolean;
  supportsWebWorkers: boolean;
  webWorkerTopologicalSort(
    edges: number[][],
    useWasm: boolean
  ): Promise<number[]>;
  webWorkerVerifyAcyclic(
    edges: number[][],
    useWasm: boolean
  ): Promise<number[]>;
}
