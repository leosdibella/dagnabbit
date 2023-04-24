import {
  IDirectedAcyclicGraphParameters,
  IVertexRemovalParameters,
  IEdge
} from '../interfaces';
import { DirectedAcyclicGraphError } from './directed-acyclic-graph-error';
import { DirectedAcyclicGraphErrorCode, VertexRemovalOption } from '../enums';
import { topologicalSort } from '../assembly/topological-sort.as';
import { instantiateTopologicalSortWasmModule } from '../utils/topological-sort-wasm';
import { topologicallySortInWebWorker, platformSupport } from '../utils';

export class DirectedAcyclicGraph<T = unknown> {
  readonly #allowDuplicateVertexValues: boolean;
  readonly #throwOnDuplicateVertexValue: boolean;
  readonly #vertexRemovalOption: VertexRemovalOption;
  readonly #shouldVerifyOnAddingEdge: boolean;
  readonly #edges: number[][] = [];
  readonly #vertices: T[] = [];
  readonly #vertexToString: (vertex: T) => string;
  readonly #areEqualVertices: (vertex1: T, vertex2: T) => boolean;
  readonly #useWasm: boolean;
  readonly #useWebWorkers: boolean;
  readonly #allowGracefulFallback: boolean;

  #topologicalSorter: ((edges: number[][]) => number[]) | undefined;
  #isVerified = false;
  #topologicallySorted?: T[];

  async #topologicalSortLocal() {
    if (!this.#topologicalSorter) {
      this.#topologicalSorter = await this.#getTopologicalSorter();
    }

    const topologicallySorted = this.#topologicalSorter(this.edges);

    this.#topologicallySorted = topologicallySorted.map(
      (vertexIndex) => this.#vertices[vertexIndex]
    );

    return [...this.#topologicallySorted];
  }

  async #topologicalSortWebWorker() {
    let useWasm = this.#useWasm;

    if (this.#useWasm && !platformSupport.wasm) {
      if (this.#allowGracefulFallback) {
        useWasm = false;
      } else {
        throw new DirectedAcyclicGraphError(
          DirectedAcyclicGraphErrorCode.wasmUnsupported,
          'WASM is not supported by this platform, set allowGracefulFallback = true to fallback to the native version.'
        );
      }
    }

    const topologicallySorted = await topologicallySortInWebWorker(
      this.edges,
      useWasm
    );

    this.#topologicallySorted = topologicallySorted.map(
      (vertexIndex) => this.#vertices[vertexIndex]
    );

    return [...this.#topologicallySorted];
  }

  async #getTopologicalSorter() {
    if (this.#useWasm) {
      if (platformSupport.wasm) {
        const topologicalSortWasmModule =
          await instantiateTopologicalSortWasmModule();

        return topologicalSortWasmModule.topologicalSort;
      } else if (this.#allowGracefulFallback) {
        return topologicalSort;
      } else {
        throw new DirectedAcyclicGraphError(
          DirectedAcyclicGraphErrorCode.wasmUnsupported,
          'WASM is not supported by this platform, set allowGracefulFallback = true to fallback to the native version.'
        );
      }
    } else {
      return topologicalSort;
    }
  }

  #verify() {
    const visitedVertexIndices = new Set<number>();

    for (let i = 0; i < this.#vertices.length; ++i) {
      if (visitedVertexIndices.has(i)) {
        continue;
      }

      this.#verifyFromVertex(i).forEach(visitedVertexIndices.add);
    }

    this.#isVerified = true;
  }

  #verifyFromVertex(startingVertexIndex: number) {
    let currentVisitingIndex = 0;

    const visitedVertexIndices: Record<number, number> = {
      [startingVertexIndex]: currentVisitingIndex
    };

    const edges = [...this.#edges[startingVertexIndex]];

    while (edges.length) {
      const vertexIndex = edges.pop()!;

      if (visitedVertexIndices[vertexIndex] !== undefined) {
        const cycle = [
          ...Object.keys(visitedVertexIndices)
            .map((k) => +k)
            .sort((a, b) =>
              visitedVertexIndices[a] > visitedVertexIndices[b] ? 1 : -1
            ),
          startingVertexIndex
        ]
          .map((vi) => this.#vertexToString(this.#vertices[vi]))
          .join(' -> ');

        throw new DirectedAcyclicGraphError(
          DirectedAcyclicGraphErrorCode.cycleDetected,
          `Cycle detected: ${cycle}`
        );
      } else {
        visitedVertexIndices[vertexIndex] = ++currentVisitingIndex;

        this.#edges[vertexIndex].forEach((vertex) => edges.push(vertex));
      }
    }

    return Object.keys(visitedVertexIndices).map((k) => +k);
  }

  #getVerifiedVertexRemovalIndices(
    value: T,
    vertexRemovalOption: VertexRemovalOption,
    vertexRemovalIndices: number[]
  ) {
    const verifiedVertexRemovalOptions: number[] = [];

    switch (vertexRemovalOption) {
      case VertexRemovalOption.all:
      case VertexRemovalOption.last: {
        for (let i = this.#vertices.length - 1; i >= 0; --i) {
          if (this.#areEqualVertices(this.#vertices[i], value)) {
            verifiedVertexRemovalOptions.push(i);

            if (vertexRemovalOption === VertexRemovalOption.last) {
              break;
            }
          }
        }

        break;
      }
      case VertexRemovalOption.some: {
        vertexRemovalIndices
          .sort((a, b) => (a > b ? 1 : -1))
          .forEach((vertexIndex) => {
            if (
              vertexIndex > -1 &&
              this.#vertices.length > vertexIndex &&
              this.#areEqualVertices(this.#vertices[vertexIndex], value)
            ) {
              verifiedVertexRemovalOptions.push(vertexIndex);
            }
          });

        break;
      }
      case VertexRemovalOption.first:
      default: {
        const vertexIndex = this.#vertices.findIndex((vertex) =>
          this.#areEqualVertices(vertex, value)
        );

        if (vertexIndex > -1) {
          verifiedVertexRemovalOptions.push(vertexIndex);
        }

        break;
      }
    }

    return verifiedVertexRemovalOptions;
  }

  public get vertices() {
    return [...this.#vertices];
  }

  public get edges(): number[][] {
    return [...this.#edges.map((edges) => [...edges])];
  }

  public addEdges(edges: IEdge[]) {
    return edges.forEach((e) => this.addEdge(e));
  }

  public addEdge(edge: IEdge) {
    if (
      edge.fromVertexIndex < 0 ||
      edge.fromVertexIndex >= this.#vertices.length
    ) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.invalidEdgeDefinition,
        `The edge defined from ${edge.fromVertexIndex} to ${edge.toVertexIndex} is invalid, ${edge.fromVertexIndex} does not refer to a valid vertex`
      );
    }

    if (edge.toVertexIndex < 0 || edge.toVertexIndex >= this.#vertices.length) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.invalidEdgeDefinition,
        `The edge defined from ${edge.fromVertexIndex} to ${edge.toVertexIndex} is invalid, ${edge.toVertexIndex} does not refer to a valid vertex`
      );
    }

    if (edge.fromVertexIndex === edge.toVertexIndex) {
      const vertexToString = this.#vertexToString(
        this.#vertices[edge.fromVertexIndex]
      );

      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.cycleDetected,
        `Cycle detected: ${vertexToString} -> ${vertexToString}`
      );
    }

    const hasExistingEdge =
      (this.#edges[edge.fromVertexIndex]?.indexOf(edge.toVertexIndex) ?? -1) >
      -1;

    if (hasExistingEdge) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.duplicateEdge,
        `Duplicate edge detected from ${edge.fromVertexIndex} to ${edge.toVertexIndex}`
      );
    }

    this.#edges[edge.fromVertexIndex].push(edge.toVertexIndex);
    this.#topologicallySorted = undefined;

    if (this.#shouldVerifyOnAddingEdge) {
      this.#verifyFromVertex(edge.fromVertexIndex);
      this.#isVerified = true;
    }
  }

  public removeEdge(edge: IEdge) {
    const existingEdgeIndex =
      this.#edges[edge.fromVertexIndex]?.indexOf(edge.toVertexIndex) ?? -1;

    if (existingEdgeIndex > -1) {
      this.#edges[edge.fromVertexIndex].splice(existingEdgeIndex, 1);
      this.#topologicallySorted = undefined;

      return true;
    }

    return false;
  }

  public removeEdges(edges: IEdge[]) {
    return edges.map((e) => this.removeEdge(e));
  }

  public addVertices(values: T[]) {
    return values.map((v) => this.addVertex(v));
  }

  public addVertex(value: T) {
    if (!this.#allowDuplicateVertexValues) {
      const existingIndex = this.#vertices.findIndex((vertex) =>
        this.#areEqualVertices(vertex, value)
      );

      if (existingIndex > -1) {
        if (this.#throwOnDuplicateVertexValue) {
          throw new DirectedAcyclicGraphError(
            DirectedAcyclicGraphErrorCode.duplicateVertex,
            `Duplicate vertex detected at ${existingIndex}`
          );
        }

        return existingIndex;
      }
    }

    this.#vertices.push(value);
    this.#edges.push([]);
    this.#topologicallySorted = undefined;

    return this.#vertices.length - 1;
  }

  public removeVertexByValue(
    vertexRemovalParameters: IVertexRemovalParameters<T>
  ) {
    const vertexRemovalOption =
      vertexRemovalParameters.vertexRemovalOption ?? this.#vertexRemovalOption;

    const vertexRemovalIndicies =
      vertexRemovalParameters.vertexRemovalIndices ?? [];

    const verifiedRemovalIndicies = this.#getVerifiedVertexRemovalIndices(
      vertexRemovalParameters.value,
      vertexRemovalOption,
      vertexRemovalIndicies
    );

    const removedIndices = this.removeVerticesByIndices(
      verifiedRemovalIndicies
    );

    return removedIndices.reduce((a, b) => a || b, false);
  }

  public removeVerticesByValues(
    vertexRemovalParameters: IVertexRemovalParameters<T>[]
  ) {
    return vertexRemovalParameters.map((p) => this.removeVertexByValue(p));
  }

  public removeVertexbyIndex(vertexIndex: number) {
    if (vertexIndex > -1 && this.#vertices.length > vertexIndex) {
      this.#edges.splice(vertexIndex, 1);

      this.#edges.forEach((edges) => {
        const existingEdgeIndex = edges.findIndex(
          (edge) => edge === vertexIndex
        );

        if (existingEdgeIndex > -1) {
          edges.splice(existingEdgeIndex, 1);
        }
      });

      this.#vertices.splice(vertexIndex, 1);
      this.#topologicallySorted = undefined;

      return true;
    }

    return false;
  }

  public removeVerticesByIndices(vertexIndices: number[]) {
    return vertexIndices.map((v) => this.removeVertexbyIndex(v));
  }

  public async topologicalSort(): Promise<T[]> {
    if (this.#topologicallySorted) {
      return [...this.#topologicallySorted];
    }

    if (!this.#isVerified) {
      this.#verify();
    }

    if (this.#useWebWorkers) {
      if (platformSupport.webWorkers) {
        return this.#topologicalSortWebWorker();
      } else if (this.#allowGracefulFallback) {
        return this.#topologicalSortLocal();
      } else {
        throw new DirectedAcyclicGraphError(
          DirectedAcyclicGraphErrorCode.webWorkersUnsupported,
          'Web Workers are not supported by this platform, set allowGracefulFallback = true to fallabck to the native version.'
        );
      }
    } else {
      return this.#topologicalSortLocal();
    }
  }

  public constructor(parameters: IDirectedAcyclicGraphParameters<T>) {
    this.#shouldVerifyOnAddingEdge =
      parameters.shouldVerifyOnAddingEdge ?? false;

    this.#allowDuplicateVertexValues =
      parameters.allowDuplicateVertexValues ?? false;

    this.#throwOnDuplicateVertexValue =
      parameters.throwOnDuplicateVertexValue ?? false;

    this.#vertexToString =
      parameters.vertexToString ?? ((vertex: T) => `${vertex}`);

    this.#areEqualVertices =
      parameters.areEqualVertices ??
      ((vertex1: T, vertex2: T) => vertex1 === vertex2);

    this.#vertexRemovalOption =
      parameters.vertexRemovalOption ?? VertexRemovalOption.first;

    this.#useWebWorkers = parameters.useWebWorkers ?? false;
    this.#useWasm = parameters.useWasm ?? false;
    this.#allowGracefulFallback = parameters.allowGracefulFallback ?? true;
  }
}
