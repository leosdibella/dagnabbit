import { DirectedAcyclicGraphError } from './directed-acyclic-graph-error';
import { topologicalSort, verifyAcyclicity } from 'lib/assembly';
import { parseFunctionDefinition } from 'lib/utilities';
import {
  DirectedAcyclicGraphErrorType,
  EdgeOperation,
  WasmModule,
  WebWorkerFactory,
  WebWorkerFunctionName,
  WebWorkerFunctionDefinition,
  DirectedAcyclicGraphParameters,
  WebWorkerFunction,
  Constructor,
  WebWorkerType
} from 'lib/types';
import { isNonNegativeInteger } from 'shared/utilities';
import { IDirectedAcyclicGraph } from 'lib/interfaces';
import 'assemblyscript/std/portable/index.js';

export abstract class DirectedAcyclicGraphBase<T = unknown> {
  private static readonly _defaultVertexCardinalityWasmThreshold = 20;
  private static readonly _defaultVertexCardinalityWebWorkerThreshold = 25;

  private static _wasmModule: Readonly<WasmModule> | undefined;

  private static readonly _webWorkerFunctions: {
    [k in WebWorkerFunctionName]: WebWorkerFunction<k>;
  } = {
    topologicalSort,
    verifyAcyclicity
  };

  private static async _getLocalFunction<T extends WebWorkerFunctionName>(
    useWasm: boolean,
    webWorkerfunctionName: T
  ) {
    if (
      useWasm &&
      DirectedAcyclicGraphBase._supportsWasm &&
      DirectedAcyclicGraphBase._instantiateWasmModule
    ) {
      if (!DirectedAcyclicGraphBase._wasmModule) {
        DirectedAcyclicGraphBase._wasmModule =
          await DirectedAcyclicGraphBase._instantiateWasmModule();
      }

      return DirectedAcyclicGraphBase._wasmModule[
        webWorkerfunctionName
      ] as WebWorkerFunction<T>;
    } else {
      return DirectedAcyclicGraphBase._webWorkerFunctions[
        webWorkerfunctionName
      ];
    }
  }

  protected static _instantiateWasmModule:
    | (() => Promise<Readonly<WasmModule>>)
    | undefined;

  protected static _webWorkerFactory: WebWorkerFactory;
  protected static _supportsWasm: boolean;
  protected static _supportsWebWorkers: boolean;

  private static __webWorkerFunctionDefinitions:
    | Record<
        WebWorkerFunctionName,
        Readonly<Record<WebWorkerType, Readonly<WebWorkerFunctionDefinition>>>
      >
    | undefined;

  public static get _webWorkerFunctionDefinitions() {
    if (!DirectedAcyclicGraphBase.__webWorkerFunctionDefinitions) {
      const wasmModuleInstantiationFunctionDefinition = parseFunctionDefinition(
        DirectedAcyclicGraphBase._instantiateWasmModule!
      );

      DirectedAcyclicGraphBase.__webWorkerFunctionDefinitions = {
        topologicalSort: {
          native: parseFunctionDefinition(topologicalSort),
          wasm: wasmModuleInstantiationFunctionDefinition
        },
        verifyAcyclicity: {
          native: parseFunctionDefinition(verifyAcyclicity),
          wasm: wasmModuleInstantiationFunctionDefinition
        }
      };
    }

    return DirectedAcyclicGraphBase.__webWorkerFunctionDefinitions;
  }

  private readonly _inEdges: number[][] = [];
  private readonly _outEdges: number[][] = [];
  private readonly _vertices: T[] = [];
  private readonly _vertexCardinalityWasmThreshold: number;
  private readonly _vertexCardinalityWebWorkerThreshold: number;

  private _cycleDetected?: T[];
  private _topologicallySorted?: T[];

  private static _removeVertexEdges(vertexIndex: number, edges: number[][]) {
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

  private _validateEdge(
    fromVertexIndex: number,
    toVertexIndex: number,
    edgeOperation: EdgeOperation
  ): [DirectedAcyclicGraphErrorType, string] | undefined {
    if (!isNonNegativeInteger(fromVertexIndex)) {
      return [
        'invalidEdge',
        `The edge defined by ${fromVertexIndex} to ${toVertexIndex} is invalid, ${fromVertexIndex} is not a valid index, must be a non-negative integer.`
      ];
    }

    if (!isNonNegativeInteger(toVertexIndex)) {
      return [
        'invalidEdge',
        `The edge defined by ${fromVertexIndex} to ${toVertexIndex} is invalid, ${toVertexIndex} is not a valid index, must be a non-negative integer.`
      ];
    }

    if (edgeOperation === 'add') {
      if (fromVertexIndex < 0 || fromVertexIndex >= this._vertices.length) {
        return [
          'invalidEdge',
          `The edge (${fromVertexIndex}) to (${toVertexIndex}) is invalid, ${fromVertexIndex} does not refer to a valid vertex`
        ];
      }

      if (toVertexIndex < 0 || toVertexIndex >= this._vertices.length) {
        return [
          'invalidEdge',
          `The edge (${fromVertexIndex}) -> (${toVertexIndex}) is invalid, ${toVertexIndex} does not refer to a valid vertex`
        ];
      }

      const hasExistingEdge =
        (this._outEdges[fromVertexIndex]?.indexOf(toVertexIndex) ?? -1) > -1;

      if (hasExistingEdge) {
        return [
          'duplicateEdge',
          `The edge (${fromVertexIndex}) -> (${toVertexIndex}) already exists.`
        ];
      }
    }

    return;
  }

  private _initialize(parameters?: DirectedAcyclicGraphParameters<T>) {
    parameters?.vertices?.forEach((vertex) => this.addVertex(vertex));

    if (!parameters?.edges) {
      return;
    }

    if (parameters?.allowConstructorThrow) {
      this.addEdges(parameters.edges);
    } else {
      this.tryAddEdges(parameters.edges);
    }
  }

  private async _verifyAcyclicityLocal(useWasm: boolean) {
    const acyclicVerifier = await DirectedAcyclicGraphBase._getLocalFunction(
      useWasm,
      'verifyAcyclicity'
    );

    const cycleDetected = acyclicVerifier(this._outEdges, this._inEdges);

    this._cycleDetected = cycleDetected.map(
      (vertexIndex) => this._vertices[vertexIndex]
    );

    return this._cycleDetected;
  }

  private async _verifyAcyclicityWebWorker(useWasm: boolean) {
    const cycleDetected = await DirectedAcyclicGraphBase._webWorkerFactory({
      webWorkerArguments: [this._outEdges, this._inEdges],
      wasmModuleFunctionName: 'verifyAcyclicity',
      useWasm: useWasm && DirectedAcyclicGraphBase._supportsWasm
    });

    this._cycleDetected = cycleDetected.map(
      (vertexIndex) => this._vertices[vertexIndex]
    );

    return this._cycleDetected;
  }

  private async _topologicalSortLocal(useWasm: boolean) {
    const topologicalSorter = await DirectedAcyclicGraphBase._getLocalFunction(
      useWasm,
      'topologicalSort'
    );

    const topologicallySorted = topologicalSorter(this._outEdges);

    this._topologicallySorted = topologicallySorted.map(
      (vertexIndex) => this._vertices[vertexIndex]
    );

    return [...this._topologicallySorted];
  }

  private async _topologicalSortWebWorker(useWasm: boolean) {
    const topologicallySorted =
      await DirectedAcyclicGraphBase._webWorkerFactory({
        wasmModuleFunctionName: 'topologicalSort',
        useWasm: useWasm && DirectedAcyclicGraphBase._supportsWasm,
        webWorkerArguments: [this._outEdges]
      });

    this._topologicallySorted = topologicallySorted.map(
      (vertexIndex) => this._vertices[vertexIndex]
    );

    return [...this._topologicallySorted];
  }

  private _addEdge(edge: [number, number]) {
    const fromVertexIndex = edge[0];
    const toVertexIndex = edge[1];

    const errorParameters = this._validateEdge(
      fromVertexIndex,
      toVertexIndex,
      'add'
    );

    if (!errorParameters) {
      this._outEdges[fromVertexIndex].push(toVertexIndex);
      this._inEdges[toVertexIndex].push(fromVertexIndex);
      this._topologicallySorted = undefined;
      this._cycleDetected = undefined;
    }

    return errorParameters;
  }

  private _removeEdge(edge: [number, number]) {
    const fromVertexIndex = edge[0];
    const toVertexIndex = edge[1];

    const errorParameters = this._validateEdge(
      fromVertexIndex,
      toVertexIndex,
      'remove'
    );

    if (!errorParameters) {
      const existingOutEdgeIndex =
        this._outEdges[fromVertexIndex]?.indexOf(toVertexIndex) ?? -1;

      const existingInEdgeIndex =
        this._inEdges[toVertexIndex]?.indexOf(fromVertexIndex) ?? -1;

      if (existingOutEdgeIndex > -1 && existingInEdgeIndex > -1) {
        this._outEdges[fromVertexIndex].splice(existingOutEdgeIndex, 1);
        this._inEdges[toVertexIndex].splice(existingInEdgeIndex, 1);
        this._topologicallySorted = undefined;
        this._cycleDetected = undefined;
      }
    }

    return errorParameters;
  }

  protected _clone(
    DirectedAcyclicGraph: Constructor<IDirectedAcyclicGraph<T>>,
    parameters?: Omit<DirectedAcyclicGraphParameters<T>, 'vertices' | 'edges'>
  ) {
    return new DirectedAcyclicGraph({
      ...(parameters ?? {
        vertexCardinalityWasmThreshold: this.vertexCardinalityWasmThreshold,
        vertexCardinalityWebWorkerThreshold:
          this.vertexCardinalityWebWorkerThreshold
      }),
      vertices: this.vertices,
      edges: this.edges
    });
  }

  private get _useWasm() {
    return (
      this._vertices.length >= this._vertexCardinalityWasmThreshold &&
      DirectedAcyclicGraphBase._supportsWasm
    );
  }

  private get _useWebWorkers() {
    return (
      this._vertices.length >= this._vertexCardinalityWebWorkerThreshold &&
      DirectedAcyclicGraphBase._supportsWebWorkers
    );
  }

  public get vertexCardinalityWasmThreshold() {
    return this._vertexCardinalityWasmThreshold;
  }

  public get vertexCardinalityWebWorkerThreshold() {
    return this._vertexCardinalityWebWorkerThreshold;
  }

  public get vertices() {
    return [...this._vertices];
  }

  public get edges(): [number, number][] {
    return this._outEdges
      .map((vertices, i) => vertices.map((v) => [i, v] as [number, number]))
      .reduce(
        (previousValue, currentValue) => previousValue.concat(currentValue),
        []
      );
  }

  public tryAddEdge(edge: [number, number]) {
    const errorParameters = this._addEdge(edge);

    return !!errorParameters;
  }

  public addEdge(edge: [number, number]) {
    const errorParameters = this._addEdge(edge);

    if (errorParameters) {
      throw new DirectedAcyclicGraphError(...errorParameters);
    }
  }

  public tryAddEdges(edges: [number, number][]) {
    return edges.map((e) => this.tryAddEdge(e));
  }

  public addEdges(edges: [number, number][]) {
    return edges.forEach((e) => this.addEdge(e));
  }

  public tryRemoveEdge(edge: [number, number]) {
    const errorParameters = this._removeEdge(edge);

    return !!errorParameters;
  }

  public removeEdge(edge: [number, number]) {
    const errorParameters = this._removeEdge(edge);

    if (errorParameters) {
      throw new DirectedAcyclicGraphError(...errorParameters);
    }
  }

  public tryRemoveEdges(edges: [number, number][]) {
    return edges.map((e) => this.tryRemoveEdge(e));
  }

  public removeEdges(edges: [number, number][]) {
    return edges.forEach((e) => this.removeEdge(e));
  }

  public addVertices(values: T[]) {
    return values.map((v) => this.addVertex(v));
  }

  public addVertex(value: T) {
    this._vertices.push(value);
    this._outEdges.push([]);
    this._inEdges.push([]);
    this._topologicallySorted = undefined;
    this._cycleDetected = undefined;

    return this._vertices.length - 1;
  }

  public removeVertex(vertexIndex: number) {
    if (vertexIndex > -1 && this._vertices.length > vertexIndex) {
      DirectedAcyclicGraphBase._removeVertexEdges(vertexIndex, this._outEdges);
      DirectedAcyclicGraphBase._removeVertexEdges(vertexIndex, this._inEdges);
      this._vertices.splice(vertexIndex, 1);
      this._topologicallySorted = undefined;
      this._cycleDetected = undefined;
    }
  }

  public removeVertices(vertexIndices: number[]) {
    return vertexIndices.forEach((v) => this.removeVertex(v));
  }

  public async verifyAcyclicity(
    useWasm = this._useWasm,
    useWebWorkers = this._useWebWorkers
  ) {
    if (this._cycleDetected) {
      return [...this._cycleDetected];
    }

    return useWebWorkers && DirectedAcyclicGraphBase._supportsWebWorkers
      ? this._verifyAcyclicityWebWorker(useWasm)
      : this._verifyAcyclicityLocal(useWasm);
  }

  /** Sort the DAG topologically,
   * optionally executes via WASM
   * optionally executes via WebWorkers
   * optionally performs an acyclic verification step prior to sorting
   * in which case a will a cycleDetected error if the graph is not acyclic */
  public async topologicalSort(
    useWasm = this._useWasm,
    useWebWorkers = this._useWebWorkers,
    skipVerification = false
  ): Promise<T[]> {
    if (this._topologicallySorted) {
      return [...this._topologicallySorted];
    }

    if (!skipVerification) {
      await this.verifyAcyclicity(useWasm, useWebWorkers);

      if (this._cycleDetected?.length) {
        throw new DirectedAcyclicGraphError(
          'cycleDetected',
          `Cycle detected: ${this._cycleDetected.join(' -> ')}`
        );
      }
    }

    return useWebWorkers && DirectedAcyclicGraphBase._supportsWebWorkers
      ? this._topologicalSortWebWorker(useWasm)
      : this._topologicalSortLocal(useWasm);
  }

  public clear() {
    this._vertices.splice(0, this._vertices.length);
    this._outEdges.splice(0, this._outEdges.length);
    this._inEdges.splice(0, this._inEdges.length);
    this._topologicallySorted = undefined;
    this._cycleDetected = undefined;
  }

  public constructor(parameters?: DirectedAcyclicGraphParameters<T>) {
    this._vertexCardinalityWasmThreshold =
      DirectedAcyclicGraphBase._defaultVertexCardinalityWasmThreshold;

    this._vertexCardinalityWebWorkerThreshold =
      DirectedAcyclicGraphBase._defaultVertexCardinalityWebWorkerThreshold;

    this._initialize(parameters);
  }
}
