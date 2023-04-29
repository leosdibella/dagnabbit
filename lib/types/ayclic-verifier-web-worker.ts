export type AcyclicVerifierWebWorker = (
  edges: number[][],
  useWasm: boolean
) => Promise<number[]>;
