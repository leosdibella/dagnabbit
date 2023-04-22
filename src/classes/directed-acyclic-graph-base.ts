import {
  IDirectedAcyclicGraphParameters,
  IVertexRemovalParameters,
  IEdge
} from '../interfaces';
import { DirectedAcyclicGraphError } from './directed-acyclic-graph-error';
import { DirectedAcyclicGraphErrorCode, VertexRemovalOption } from '../enums';
import { topologicalSort } from '../assembly/topological-sort.as';
import topologicalSortWasm from '../../build/release.wasm';

export class DirectedAcyclicGraph<T = unknown> {
  static #topologicalSortWasmModule: WebAssembly.Instance | undefined;
  static #topologicalSortWasmModuleError: DirectedAcyclicGraphError | undefined;

  static #base64Decode(base64: string) {
    return Buffer && typeof Buffer.from === 'function'
      ? Buffer.from(base64, 'base64')
      : window.atob(base64);
  }

  readonly #allowDuplicateVertexValues: boolean;
  readonly #throwOnDuplicateVertexValue: boolean;
  readonly #vertexRemovalOption: VertexRemovalOption;
  readonly #shouldVerifyOnAddingEdge: boolean;
  readonly #edges: number[][] = [];
  readonly #vertices: T[] = [];
  readonly #vertexToString: (vertex: T) => string;
  readonly #areEqualVertices: (vertex1: T, vertex2: T) => boolean;
  readonly #isReady: Promise<void>;

  #topologicalSorter: ((edges: number[][]) => number[]) | undefined;
  #isVerified = false;
  #topologicallySorted?: T[];

  async #instantiateTopologicalSortWasm(wasmBytes: string | Buffer) {
    try {
      const topologicalSortModule = await WebAssembly.instantiate(
        wasmBytes,
        {}
      );

      if (
        typeof topologicalSortModule?.exports?.topologicalSort === 'function'
      ) {
        DirectedAcyclicGraph.#topologicalSortWasmModule = topologicalSortModule;

        this.#topologicalSorter = topologicalSortModule.exports
          .topologicalSort as (edges: number[][]) => number[];
      }
    } catch (error: unknown) {
      this.#topologicalSorter = topologicalSort;

      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.uninstantiableWasm,
        'Base64 decoded WASM module could not be instantiated, falling back to native JS implementation.',
        error instanceof Error ? error : undefined
      );
    }

    if (!this.#topologicalSorter) {
      this.#topologicalSorter = topologicalSort;

      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.missingTopologicalSortingFunction,
        'Base64 decoded WASM module is missing exports definition for "topologicalSort", falling back to native JS implementation.'
      );
    }
  }

  async #setup(parameters: IDirectedAcyclicGraphParameters<T>) {
    if (parameters.useWasm) {
      if (DirectedAcyclicGraph.#topologicalSortWasmModule) {
        this.#topologicalSorter = DirectedAcyclicGraph
          .#topologicalSortWasmModule!.exports.topologicalSort as (
          edges: number[][]
        ) => number[];
      } else if (!DirectedAcyclicGraph.#topologicalSortWasmModuleError) {
        try {
          const wasmBytes =
            DirectedAcyclicGraph.#base64Decode(topologicalSortWasm);

          await this.#instantiateTopologicalSortWasm(wasmBytes);
        } catch (error: unknown) {
          this.#topologicalSorter = topologicalSort;

          DirectedAcyclicGraph.#topologicalSortWasmModuleError =
            new DirectedAcyclicGraphError(
              DirectedAcyclicGraphErrorCode.undecodeableWasm,
              'Unable to decode Base64 WASM module that contains "topologicalSort", falling back to native JS implementation.',
              error instanceof Error ? error : undefined
            );

          throw DirectedAcyclicGraph.#topologicalSortWasmModuleError;
        }
      } else {
        this.#topologicalSorter = topologicalSort;

        throw DirectedAcyclicGraph.#topologicalSortWasmModuleError;
      }
    } else {
      this.#topologicalSorter = topologicalSort;
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

  public get isReady() {
    return this.#isReady;
  }

  public addEdges(edges: IEdge[]) {
    return edges.forEach(this.addEdge);
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
    return values.map(this.addVertex);
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
    return vertexRemovalParameters.map(this.removeVertexByValue);
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
    return vertexIndices.map(this.removeVertexbyIndex);
  }

  public topologicalSort(): T[] {
    if (!this.#topologicalSorter) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.notReady,
        ''
      );
    }

    if (!this.#topologicallySorted) {
      if (!this.#isVerified) {
        this.#verify();
      }

      const topologicallySorted = this.#topologicalSorter(this.edges);

      this.#topologicallySorted = topologicallySorted.map(
        (vertexIndex) => this.#vertices[vertexIndex]
      );
    }

    return [...this.#topologicallySorted];
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

    this.#isReady = this.#setup(parameters);
  }
}
