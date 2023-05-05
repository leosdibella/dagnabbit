import { IEdge } from './edge';

export interface IDirectedAcyclicGraph<T> {
  readonly vertices: T[];
  readonly outEdges: number[][];
  readonly inEdges: number[][];
  addEdge(edge: IEdge, suppressExceptions?: boolean): void;
  addEdges(edges: IEdge[], suppressExceptions?: boolean): void;
  removeEdge(edge: IEdge): void;
  removeEdges(edges: IEdge[]): void;
  addVertex(value: T): number;
  addVertices(values: T[]): number[];
  removeVertex(vertexIndex: number): void;
  removeVertices(vertexIndices: number[]): void;
  clone(): IDirectedAcyclicGraph<T>;
  clear(): void;
  topologicalSort(
    useWasm?: boolean,
    useWebWorkers?: boolean,
    skipVerification?: boolean
  ): Promise<T[]>;
  verifyAcyclic(
    useWasm?: boolean,
    useWebWorkers?: boolean
  ): Promise<T | undefined>;
}
