import { IDirectedAcyclicGraph, IWebWorkerMessage } from '../interfaces';
import { DirectedAcyclicGraphBase } from '../classes';
import { Worker, WorkerOptions, MessagePort } from 'worker_threads';
import { topologicalSort } from '../assembly/topological-sort.as';
import { instantiateWasmModule } from '../utilities';
import { verifyAcyclic } from '../assembly';
import {
  AcyclicVerifier,
  TopologicalSorter,
  WebWorkerFactories
} from '../types';
import { WasmModuleFunctionName } from '../enums';

export class DirectedAcyclicGraph<T = unknown>
  extends DirectedAcyclicGraphBase<T>
  implements IDirectedAcyclicGraph<T>
{
  static {
    this._supportsWasm = typeof WebAssembly === 'object';
    this._supportsWebWorkers = typeof Worker === 'function';

    this._webWorkerFactories = Object.freeze(
      Object.fromEntries(
        Object.values(WasmModuleFunctionName).map((wasmModuleFunctionName) => [
          wasmModuleFunctionName,
          async (edges: number[][], useWasm: boolean) =>
            this.#createWebWorker(edges, useWasm, wasmModuleFunctionName)
        ])
      )
    ) as WebWorkerFactories;
  }

  static readonly #wasmCode = instantiateWasmModule.toString();

  static readonly #nativeFunctions = Object.freeze({
    [WasmModuleFunctionName.topologicalSort]: topologicalSort.toString(),
    [WasmModuleFunctionName.verifyAcyclic]: verifyAcyclic.toString()
  });

  static readonly #webWorkerOptions: WorkerOptions = {
    eval: true
  };

  static #nativeWebWorker() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parentPort = require('worker_threads').parentPort as MessagePort;

    parentPort.on('message', (message: IWebWorkerMessage) => {
      const functionBody = message.code
        .trim()
        .replace(`function ${message.wasmModuleFunctionName}(edges) {`, '');

      // eslint-disable-next-line no-new-func
      const nativeFunction = new Function(
        'edges',
        functionBody.slice(0, functionBody.length - 1)
      ) as TopologicalSorter | AcyclicVerifier;

      const result = nativeFunction(message.edges);

      parentPort.postMessage(result);
    });
  }

  static #wasmWebWorker() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parentPort = require('worker_threads').parentPort as MessagePort;

    parentPort.on('message', (message: IWebWorkerMessage) => {
      const functionBody = message.code
        .trim()
        .replace('async function instantiateWasmModule() {', '');

      // eslint-disable-next-line @typescript-eslint/require-await
      const AsyncFunction = (async (_: unknown) => _).constructor;

      // eslint-disable-next-line new-cap
      const wasmModuleFactory = AsyncFunction(
        functionBody.slice(0, functionBody.length - 1)
      ) as typeof instantiateWasmModule;

      wasmModuleFactory().then((wasmModule) => {
        const result = wasmModule[message.wasmModuleFunctionName](
          message.edges
        );

        parentPort.postMessage(result);
      });
    });
  }

  static async #createWebWorker(
    edges: number[][],
    useWasm: boolean,
    wasmModuleFunctionName: WasmModuleFunctionName
  ) {
    const workerFunction = useWasm
      ? this.#wasmWebWorker
      : this.#nativeWebWorker;

    const webWorkerCode = `(${workerFunction.toString().trim()})()`;
    const webWorker = new Worker(webWorkerCode, this.#webWorkerOptions);

    const promise = new Promise<number[]>((resolve, reject) => {
      webWorker.on('message', (topologicallySorted: number[]) => {
        resolve(topologicallySorted);
      });

      webWorker.on('error', (error) => {
        reject(error);
      });
    });

    const webWorkerMessage: IWebWorkerMessage = {
      edges,
      code: useWasm
        ? this.#wasmCode
        : this.#nativeFunctions[wasmModuleFunctionName],
      wasmModuleFunctionName
    };

    webWorker.postMessage(webWorkerMessage);

    promise.finally(() => {
      webWorker.terminate();
    });

    return promise;
  }

  public clone() {
    return new DirectedAcyclicGraph(this.vertices, this.edges);
  }
}
