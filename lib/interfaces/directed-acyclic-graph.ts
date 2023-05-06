import { IDirectedAcyclicGraphParameters } from './directed-acyclic-graph-parameters';

export interface IDirectedAcyclicGraph<T> {
  readonly vertices: T[];
  readonly edges: [number, number][];
  tryAddEdge(edge: [number, number]): boolean;
  addEdge(edge: [number, number]): void;
  tryAddEdges(edges: [number, number][]): boolean[];
  addEdges(edges: [number, number][]): void;
  tryRemoveEdge(edge: [number, number]): boolean;
  removeEdge(edge: [number, number]): void;
  tryRemoveEdges(edges: [number, number][]): boolean[];
  removeEdges(edges: [number, number][]): void;
  addVertex(value: T): number;
  addVertices(values: T[]): number[];
  removeVertex(vertexIndex: number): void;
  removeVertices(vertexIndices: number[]): void;
  clone(
    parameters: Omit<IDirectedAcyclicGraphParameters<T>, 'vertices' | 'edges'>
  ): IDirectedAcyclicGraph<T>;
  clear(): void;
  /** Sort the DAG topologically,
   * optionally executes via WASM
   * optionally executes via WebWorkers
   * optionally performs an acyclic verification step prior to sorting
   * in which case a will a cycleDetected error if the graph is not acyclic */
  topologicalSort(
    useWasm?: boolean,
    useWebWorkers?: boolean,
    skipVerification?: boolean
  ): Promise<T[]>;
  verifyAcyclicity(useWasm?: boolean, useWebWorkers?: boolean): Promise<T[]>;
}
