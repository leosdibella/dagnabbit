import { IEdge, IWebWorkerFunctionDefinition } from '../interfaces';
import { DirectedAcyclicGraphError } from './directed-acyclic-graph-error';
import {
  DirectedAcyclicGraphErrorCode,
  WasmModuleFunctionName,
  WebWorkerType
} from '../enums';
import { topologicalSort } from '../assembly/topological-sort.as';
import { verifyAcyclic } from '../assembly/verify-acyclic.as';
import { instantiateWasmModule } from '../utilities/wasm';
import {
  AcyclicVerifier,
  TopologicalSorter,
  WasmModule,
  WebWorkerFactory
} from '../types';
import { parseFunctionDefinition } from 'lib/utilities';

export abstract class DirectedAcyclicGraphBase<T = unknown> {
  static readonly #wasmModuleInstantiationFunctionDefinition = Object.freeze(
    parseFunctionDefinition(instantiateWasmModule)
  );

  static #wasmModule: WasmModule;
  protected static _webWorkerFactory: WebWorkerFactory;
  protected static _supportsWasm: boolean;
  protected static _supportsWebWorkers: boolean;

  protected static readonly _webWorkerFunctionDefinitions: Readonly<
    Record<
      WasmModuleFunctionName,
      Readonly<Record<WebWorkerType, Readonly<IWebWorkerFunctionDefinition>>>
    >
  > = Object.freeze({
    [WasmModuleFunctionName.topologicalSort]: Object.freeze({
      [WebWorkerType.native]: Object.freeze(
        parseFunctionDefinition(topologicalSort)
      ),
      [WebWorkerType.wasm]: this.#wasmModuleInstantiationFunctionDefinition
    }),
    [WasmModuleFunctionName.verifyAcyclic]: Object.freeze({
      [WebWorkerType.native]: Object.freeze(
        parseFunctionDefinition(verifyAcyclic)
      ),
      [WebWorkerType.wasm]: this.#wasmModuleInstantiationFunctionDefinition
    })
  });

  readonly #inEdges: number[][] = [];
  readonly #outEdges: number[][] = [];
  readonly #vertices: T[] = [];

  #cycleVertexIndex?: number;
  #topologicallySorted?: T[];

  static #removeVertexEdges(vertexIndex: number, edges: number[][]) {
    edges.splice(vertexIndex, 1);

    edges.forEach((vertices) => {
      const existingEdgeIndex = vertices.findIndex(
        (vertex) => vertex === vertexIndex
      );

      if (existingEdgeIndex > -1) {
        edges.splice(existingEdgeIndex, 1);
      }
    });
  }

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

    this.#cycleVertexIndex = acyclicVerifier(this.outEdges, this.#inEdges);

    return this.#cycleVertexIndex > -1
      ? this.#vertices[this.#cycleVertexIndex]
      : undefined;
  }

  async #verifyAcyclicWebWorker(useWasm: boolean) {
    this.#cycleVertexIndex = await DirectedAcyclicGraphBase._webWorkerFactory({
      webWorkerArguments: [this.outEdges, this.#inEdges],
      wasmModuleFunctionName: WasmModuleFunctionName.verifyAcyclic,
      useWasm: useWasm && DirectedAcyclicGraphBase._supportsWasm
    });

    return this.#cycleVertexIndex > -1
      ? this.#vertices[this.#cycleVertexIndex]
      : undefined;
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

    const topologicallySorted = topologicalSorter(this.outEdges);

    this.#topologicallySorted = topologicallySorted.map(
      (vertexIndex) => this.#vertices[vertexIndex]
    );

    return [...this.#topologicallySorted];
  }

  async #topologicalSortWebWorker(useWasm: boolean) {
    const topologicallySorted =
      await DirectedAcyclicGraphBase._webWorkerFactory({
        wasmModuleFunctionName: WasmModuleFunctionName.topologicalSort,
        useWasm: useWasm && DirectedAcyclicGraphBase._supportsWasm,
        webWorkerArguments: [this.outEdges]
      });

    this.#topologicallySorted = topologicallySorted.map(
      (vertexIndex) => this.#vertices[vertexIndex]
    );

    return [...this.#topologicallySorted];
  }

  public get vertices() {
    return [...this.#vertices];
  }

  public get outEdges(): number[][] {
    return [...this.#outEdges.map((edges) => [...edges])];
  }

  public get inEdges(): number[][] {
    return [...this.#inEdges.map((edges) => [...edges])];
  }

  public addEdges(edges: IEdge[], suppressExceptions = false) {
    return edges.forEach((e) => this.addEdge(e, suppressExceptions));
  }

  public addEdge(edge: IEdge, suppressExceptions = false) {
    if (
      !suppressExceptions &&
      (edge.fromVertexIndex < 0 ||
        edge.fromVertexIndex >= this.#vertices.length)
    ) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.invalidEdge,
        `The edge (${edge.fromVertexIndex}) to (${edge.toVertexIndex}) is invalid, ${edge.fromVertexIndex} does not refer to a valid vertex`
      );
    }

    if (
      !suppressExceptions &&
      (edge.toVertexIndex < 0 || edge.toVertexIndex >= this.#vertices.length)
    ) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.invalidEdge,
        `The edge (${edge.fromVertexIndex}) -> (${edge.toVertexIndex}) is invalid, ${edge.toVertexIndex} does not refer to a valid vertex`
      );
    }

    const hasExistingEdge =
      (this.#outEdges[edge.fromVertexIndex]?.indexOf(edge.toVertexIndex) ??
        -1) > -1;

    if (!hasExistingEdge) {
      this.#outEdges[edge.fromVertexIndex].push(edge.toVertexIndex);
      this.#inEdges[edge.toVertexIndex].push(edge.fromVertexIndex);
      this.#topologicallySorted = undefined;
      this.#cycleVertexIndex = undefined;
    } else if (!suppressExceptions) {
      throw new DirectedAcyclicGraphError(
        DirectedAcyclicGraphErrorCode.duplicateEdge,
        `The edge (${edge.fromVertexIndex}) -> (${edge.toVertexIndex}) already exists.`
      );
    }
  }

  public removeEdge(edge: IEdge) {
    const existingOutEdgeIndex =
      this.#outEdges[edge.fromVertexIndex]?.indexOf(edge.toVertexIndex) ?? -1;

    const existingInEdgeIndex =
      this.#inEdges[edge.toVertexIndex]?.indexOf(edge.fromVertexIndex) ?? -1;

    if (existingOutEdgeIndex > -1 && existingInEdgeIndex > -1) {
      this.#outEdges[edge.fromVertexIndex].splice(existingOutEdgeIndex, 1);
      this.#inEdges[edge.toVertexIndex].splice(existingInEdgeIndex, 1);
      this.#topologicallySorted = undefined;
      this.#cycleVertexIndex = undefined;
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
    this.#outEdges.push([]);
    this.#inEdges.push([]);
    this.#topologicallySorted = undefined;
    this.#cycleVertexIndex = undefined;

    return this.#vertices.length - 1;
  }

  public removeVertex(vertexIndex: number) {
    if (vertexIndex > -1 && this.#vertices.length > vertexIndex) {
      DirectedAcyclicGraphBase.#removeVertexEdges(vertexIndex, this.#outEdges);
      DirectedAcyclicGraphBase.#removeVertexEdges(vertexIndex, this.#inEdges);
      this.#vertices.splice(vertexIndex, 1);
      this.#topologicallySorted = undefined;
      this.#cycleVertexIndex = undefined;
    }
  }

  public removeVertices(vertexIndices: number[]) {
    return vertexIndices.forEach((v) => this.removeVertex(v));
  }

  public async verifyAcyclic(useWasm = true, useWebWorkers = true) {
    if (this.#cycleVertexIndex !== undefined && this.#cycleVertexIndex > -1) {
      return this.#vertices[this.#cycleVertexIndex];
    }

    return useWebWorkers && DirectedAcyclicGraphBase._supportsWebWorkers
      ? this.#verifyAcyclicWebWorker(useWasm)
      : this.#verifyAcyclicLocal(useWasm);
  }

  public async topologicalSort(
    useWasm = true,
    useWebWorkers = true,
    skipVerification = false
  ): Promise<T[]> {
    if (this.#topologicallySorted) {
      return [...this.#topologicallySorted];
    }

    if (!skipVerification) {
      await this.verifyAcyclic(useWasm, useWebWorkers);

      if (this.#cycleVertexIndex! > -1) {
        throw new DirectedAcyclicGraphError(
          DirectedAcyclicGraphErrorCode.cycleDetected,
          `Cycle detected containing vertex with index: ${
            this.#cycleVertexIndex
          }`
        );
      }
    }

    return useWebWorkers && DirectedAcyclicGraphBase._supportsWebWorkers
      ? this.#topologicalSortWebWorker(useWasm)
      : this.#topologicalSortLocal(useWasm);
  }

  public clear() {
    this.#vertices.splice(0, this.#vertices.length);
    this.#outEdges.splice(0, this.#outEdges.length);
    this.#inEdges.splice(0, this.#inEdges.length);
    this.#topologicallySorted = undefined;
    this.#cycleVertexIndex = undefined;
  }

  public constructor(vertices?: T[], edges?: number[][]) {
    this.#initialize(vertices, edges);
  }
}
