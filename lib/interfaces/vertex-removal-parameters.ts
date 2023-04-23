import { VertexRemovalOption } from '../enums';

export interface IVertexRemovalParameters<T> {
  value: T;
  vertexRemovalOption?: VertexRemovalOption;
  vertexRemovalIndices?: number[];
}
