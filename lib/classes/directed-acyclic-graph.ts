import { IEdge, IPlatformParameters } from '../interfaces';
import { DirectedAcyclicGraphError } from './directed-acyclic-graph-error';
import { DirectedAcyclicGraphErrorCode } from '../enums';
import { topologicalSort } from '../assembly/topological-sort.as';
import { instantiateTopologicalSortWasmModule } from '../utilities/topological-sort-wasm';

export abstract class DirectedAcyclicGraphBase<T = unknown> {
  static #wasmTopologicalSort: (edges: number[][]) => number[];

  readonly #supportsWasm: boolean;
  readonly #supportsWebWorkers: boolean;
  readonly #edges: number[][] = [];
  readonly #vertices: T[] = [];

  readonly #webWorkerTopologicalSort: (
    edges: number[][],
    useWasm: boolean
  ) => Promise<number[]>;

  #topologicallySorted?: T[];

  #initialize(vertices?: T[], edges?: number[][]) {
    if (!vertices || !edges) {
      return;
    }

    if (vertices.length !== edges.length) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.vertexEdgeSetCountMismatch,
        'The number of vertcies in the intial graph does not match the number of edge sets.'
      );
    }

    vertices.forEach((vertex) => this.addVertex(vertex));

    edges.forEach((e, i) => {
      e.forEach((vertexIndex) => {
        this.addEdge({
          fromVertexIndex: i,
          toVertexIndex: vertexIndex
        });
      });
    });
  }

  async #topologicalSortLocal(useWasm: boolean) {
    let topologicalSorter: (edges: number[][]) => number[];

    if (useWasm && this.#supportsWasm) {
      if (!DirectedAcyclicGraphBase.#wasmTopologicalSort) {
        const topologicalSortWasmModule =
          await instantiateTopologicalSortWasmModule();

        DirectedAcyclicGraphBase.#wasmTopologicalSort =
          topologicalSortWasmModule.topologicalSort;
      }

      topologicalSorter = DirectedAcyclicGraphBase.#wasmTopologicalSort;
    } else {
      topologicalSorter = topologicalSort;
    }

    const topologicallySorted = topologicalSorter(this.edges);

    this.#topologicallySorted = topologicallySorted.map(
      (vertexIndex) => this.#vertices[vertexIndex]
    );

    return [...this.#topologicallySorted];
  }

  async #topologicalSortWebWorker(useWasm: boolean) {
    const topologicallySorted = await this.#webWorkerTopologicalSort(
      this.edges,
      useWasm && this.#supportsWasm
    );

    this.#topologicallySorted = topologicallySorted.map(
      (vertexIndex) => this.#vertices[vertexIndex]
    );

    return [...this.#topologicallySorted];
  }

  #verify() {
    const visitedVertexIndices = new Set<number>();

    for (let i = 0; i < this.#vertices.length; ++i) {
      if (visitedVertexIndices.has(i)) {
        continue;
      }

      this.#verifyFromVertex(i).forEach(visitedVertexIndices.add);
    }
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
          .map((i) => `(${i})`)
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
        DirectedAcyclicGraphErrorCode.invalidEdge,
        `The edge (${edge.fromVertexIndex}) to (${edge.toVertexIndex}) is invalid, ${edge.fromVertexIndex} does not refer to a valid vertex`
      );
    }

    if (edge.toVertexIndex < 0 || edge.toVertexIndex >= this.#vertices.length) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.invalidEdge,
        `The edge (${edge.fromVertexIndex}) -> (${edge.toVertexIndex}) is invalid, ${edge.toVertexIndex} does not refer to a valid vertex`
      );
    }

    if (edge.fromVertexIndex === edge.toVertexIndex) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.cycleDetected,
        `Cycle detected: (${edge.fromVertexIndex}) -> (${edge.toVertexIndex})`
      );
    }

    const hasExistingEdge =
      (this.#edges[edge.fromVertexIndex]?.indexOf(edge.toVertexIndex) ?? -1) >
      -1;

    if (!hasExistingEdge) {
      this.#edges[edge.fromVertexIndex].push(edge.toVertexIndex);
      this.#topologicallySorted = undefined;
    }
  }

  public removeEdge(edge: IEdge) {
    const existingEdgeIndex =
      this.#edges[edge.fromVertexIndex]?.indexOf(edge.toVertexIndex) ?? -1;

    if (existingEdgeIndex > -1) {
      this.#edges[edge.fromVertexIndex].splice(existingEdgeIndex, 1);
      this.#topologicallySorted = undefined;
    }
  }

  public removeEdges(edges: IEdge[]) {
    return edges.forEach((e) => this.removeEdge(e));
  }

  public addVertices(values: T[]) {
    return values.map((v) => this.addVertex(v));
  }

  public addVertex(value: T) {
    this.#vertices.push(value);
    this.#edges.push([]);
    this.#topologicallySorted = undefined;

    return this.#vertices.length - 1;
  }

  public removeVertex(vertexIndex: number) {
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

  public removeVertices(vertexIndices: number[]) {
    return vertexIndices.map((v) => this.removeVertex(v));
  }

  public async topologicalSort(
    useWasm = true,
    useWebWorkers = true
  ): Promise<T[]> {
    if (this.#topologicallySorted) {
      return [...this.#topologicallySorted];
    }

    this.#verify();

    return useWebWorkers && this.#supportsWebWorkers
      ? this.#topologicalSortWebWorker(useWasm)
      : this.#topologicalSortLocal(useWasm);
  }

  public clear() {
    this.#vertices.splice(0, this.#vertices.length);
    this.#edges.splice(0, this.#edges.length);
    this.#topologicallySorted = undefined;
  }

  public constructor(
    platformParameters: IPlatformParameters,
    vertices?: T[],
    edges?: number[][]
  ) {
    this.#supportsWasm = platformParameters.supportsWasm;
    this.#supportsWebWorkers = platformParameters.supportsWebWorkers;

    this.#webWorkerTopologicalSort =
      platformParameters.webWorkerTopologicalSort;

    this.#initialize(vertices, edges);
  }
}
