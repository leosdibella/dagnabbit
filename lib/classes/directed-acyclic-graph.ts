import { IEdge, IWasmModule } from '../interfaces';
import { DirectedAcyclicGraphError } from './directed-acyclic-graph-error';
import { DirectedAcyclicGraphErrorCode } from '../enums';
import { topologicalSort } from '../assembly/topological-sort.as';
import { verifyAcyclic } from '../assembly/verify-acyclic.as';
import { instantiateWasmModule } from '../utilities/wasm';
import {
  AcyclicVerifier,
  TopologicalSorter,
  WebWorkerFactories
} from '../types';

export abstract class DirectedAcyclicGraphBase<T = unknown> {
  static #wasmModule: IWasmModule;
  protected static _webWorkerFactories: WebWorkerFactories;
  protected static _supportsWasm: boolean;
  protected static _supportsWebWorkers: boolean;

  readonly #edges: number[][] = [];
  readonly #vertices: T[] = [];

  #acyclicVerification?: T[];
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

  async #verifyAcyclicLocal(useWasm: boolean) {
    let acyclicVerifier: AcyclicVerifier;

    if (useWasm && DirectedAcyclicGraphBase._supportsWasm) {
      if (!DirectedAcyclicGraphBase.#wasmModule) {
        DirectedAcyclicGraphBase.#wasmModule = await instantiateWasmModule();
      }

      acyclicVerifier = DirectedAcyclicGraphBase.#wasmModule.verifyAcyclic;
    } else {
      acyclicVerifier = verifyAcyclic;
    }

    const acyclicVerification = acyclicVerifier(this.edges);

    this.#acyclicVerification = acyclicVerification.map(
      (vertexIndex) => this.#vertices[vertexIndex]
    );

    return [...this.#acyclicVerification];
  }

  async #verifyAcyclicWebWorker(useWasm: boolean) {
    const acyclicVerification =
      await DirectedAcyclicGraphBase._webWorkerFactories.verifyAcyclic(
        this.edges,
        useWasm && DirectedAcyclicGraphBase._supportsWasm
      );

    this.#acyclicVerification = acyclicVerification.map(
      (vertexIndex) => this.#vertices[vertexIndex]
    );

    return [...this.#acyclicVerification];
  }

  async #topologicalSortLocal(useWasm: boolean) {
    let topologicalSorter: TopologicalSorter;

    if (useWasm && DirectedAcyclicGraphBase._supportsWasm) {
      if (!DirectedAcyclicGraphBase.#wasmModule) {
        DirectedAcyclicGraphBase.#wasmModule = await instantiateWasmModule();
      }

      topologicalSorter = DirectedAcyclicGraphBase.#wasmModule.topologicalSort;
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
    const topologicallySorted =
      await DirectedAcyclicGraphBase._webWorkerFactories.topologicalSort(
        this.edges,
        useWasm && DirectedAcyclicGraphBase._supportsWasm
      );

    this.#topologicallySorted = topologicallySorted.map(
      (vertexIndex) => this.#vertices[vertexIndex]
    );

    return [...this.#topologicallySorted];
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
      this.#acyclicVerification = undefined;
    }
  }

  public removeEdge(edge: IEdge) {
    const existingEdgeIndex =
      this.#edges[edge.fromVertexIndex]?.indexOf(edge.toVertexIndex) ?? -1;

    if (existingEdgeIndex > -1) {
      this.#edges[edge.fromVertexIndex].splice(existingEdgeIndex, 1);
      this.#topologicallySorted = undefined;
      this.#acyclicVerification = undefined;
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
    this.#acyclicVerification = undefined;

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
      this.#acyclicVerification = undefined;

      return true;
    }

    return false;
  }

  public removeVertices(vertexIndices: number[]) {
    return vertexIndices.map((v) => this.removeVertex(v));
  }

  public async verifyAcyclic(useWasm = true, useWebWorkers = true) {
    if (this.#acyclicVerification) {
      return [...this.#acyclicVerification];
    }

    return useWebWorkers && DirectedAcyclicGraphBase._supportsWebWorkers
      ? this.#verifyAcyclicWebWorker(useWasm)
      : this.#verifyAcyclicLocal(useWasm);
  }

  public async topologicalSort(
    useWasm = true,
    useWebWorkers = true
  ): Promise<T[]> {
    if (this.#topologicallySorted) {
      return [...this.#topologicallySorted];
    }

    this.verifyAcyclic();

    if (this.#acyclicVerification) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.cycleDetected,
        `Cycle detected: ${this.#acyclicVerification
          .map((vertexIndex) => `(${vertexIndex})`)
          .join(' -> ')}`
      );
    }

    return useWebWorkers && DirectedAcyclicGraphBase._supportsWebWorkers
      ? this.#topologicalSortWebWorker(useWasm)
      : this.#topologicalSortLocal(useWasm);
  }

  public clear() {
    this.#vertices.splice(0, this.#vertices.length);
    this.#edges.splice(0, this.#edges.length);
    this.#topologicallySorted = undefined;
    this.#acyclicVerification = undefined;
  }

  public constructor(vertices?: T[], edges?: number[][]) {
    this.#initialize(vertices, edges);
  }
}
