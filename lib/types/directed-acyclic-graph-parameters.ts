export type DirectedAcyclicGraphParameters<T> = {
  vertices?: T[];
  edges?: [number, number][];
  allowConstructorThrow?: boolean;
  vertexCardinalityWasmThreshold?: number;
  vertexCardinalityWebWorkerThreshold?: number;
};
