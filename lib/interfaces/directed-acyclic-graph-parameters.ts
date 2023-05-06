export interface IDirectedAcyclicGraphParameters<T> {
  vertices?: T[];
  edges?: [number, number][];
  allowConstructorThrow?: boolean;
  vertexCardinalityWasmThreshold?: number;
  vertexCardinalityWebWorkerThreshold?: number;
}
