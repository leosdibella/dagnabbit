import { IEdge } from './edge';

export interface IDirectedAcyclicGraph<T> {
  readonly vertices: T[];
  readonly edges: number[][];
  addEdge(edge: IEdge): void;
  addEdges(edges: IEdge[]): void;
  removeEdge(edge: IEdge): void;
  removeEdges(edges: IEdge[]): void;
  addVertex(value: T): number;
  addVertices(values: T[]): number[];
  removeVertex(vertexIndex: number): void;
  removeVertices(vertexIndices: number[]): void;
  clone(): IDirectedAcyclicGraph<T>;
  clear(): void;
  topologicalSort(useWasm?: boolean, useWebWorkers?: boolean): Promise<T[]>;
}
