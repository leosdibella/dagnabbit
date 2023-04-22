import { VertexRemovalOption } from '../enums';

export interface IDirectedAcyclicGraphParameters<T> {
  shouldVerifyOnAddingEdge?: boolean;
  vertexToString?(vertex: T): string;
  allowDuplicateVertexValues?: boolean;
  throwOnDuplicateVertexValue?: boolean;
  areEqualVertices?(vertex1: T, vertex2: T): boolean;
  vertexRemovalOption?: VertexRemovalOption;
  useWasm?: boolean;
}
