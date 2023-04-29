import { IDirectedAcyclicGraph, IWebWorkerMessage } from '../interfaces';
import { DirectedAcyclicGraphBase } from '../classes';
import { instantiateWasmModule } from '../utilities';
import {
  AcyclicVerifier,
  TopologicalSorter,
  WebWorkerFactories
} from '../types';
import { WasmModuleFunctionName } from '../enums';
import { topologicalSort, verifyAcyclic } from '../assembly';

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

  static readonly #webWorkerUrls: Partial<Record<string, string>> = {};
  static readonly #wasmCode = instantiateWasmModule.toString();

  static readonly #nativeFunctions = Object.freeze({
    [WasmModuleFunctionName.topologicalSort]: topologicalSort.toString(),
    [WasmModuleFunctionName.verifyAcyclic]: verifyAcyclic.toString()
  });

  static readonly #webWorkerOptions: WorkerOptions = {
    type: 'classic',
    credentials: 'omit'
  };

  static #webWorkerId = BigInt(0);

  static #nativeWebWorker() {
    self.onmessage = (messageEvent: MessageEvent<IWebWorkerMessage>) => {
      const functionBody = messageEvent.data.code
        .trim()
        .replace(
          `function ${messageEvent.data.wasmModuleFunctionName}(edges) {`,
          ''
        );

      // eslint-disable-next-line no-new-func
      const topologicalSorter = new Function(
        'edges',
        functionBody.slice(0, functionBody.length - 1)
      ) as TopologicalSorter | AcyclicVerifier;

      const topologicallySorted = topologicalSorter(messageEvent.data.edges);

      self.postMessage(topologicallySorted);
    };
  }

  static #wasmWebWorker() {
    self.onmessage = (messageEvent: MessageEvent<IWebWorkerMessage>) => {
      const functionBody = messageEvent.data.code
        .trim()
        .replace('async function instantiateWasmModule() {', '');

      // eslint-disable-next-line @typescript-eslint/require-await
      const AsyncFunction = (async (_: unknown) => _).constructor;

      // eslint-disable-next-line new-cap
      const wasmModuleFactory = AsyncFunction(
        functionBody.slice(0, functionBody.length - 1)
      ) as typeof instantiateWasmModule;

      wasmModuleFactory().then((wasmModule) => {
        const result = wasmModule[messageEvent.data.wasmModuleFunctionName](
          messageEvent.data.edges
        );

        self.postMessage(result);
      });
    };
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

    const webWorkerUrlName = `${wasmModuleFunctionName}-${
      useWasm ? 'wasm' : 'native'
    }`;

    let webWorkerUrl = this.#webWorkerUrls[webWorkerUrlName] ?? '';

    if (!webWorkerUrl) {
      webWorkerUrl = URL.createObjectURL(
        new Blob([webWorkerCode], {
          type: 'text/javascript'
        })
      );

      this.#webWorkerUrls[webWorkerUrlName] = webWorkerUrl;
    }

    const workerOptions: WorkerOptions = {
      ...this.#webWorkerOptions,
      name: `DirectedAcyclicGraph-WebWorker-${webWorkerUrlName}-${++this
        .#webWorkerId}`
    };

    const webWorker = new Worker(webWorkerUrl, workerOptions);

    const promise = new Promise<number[]>((resolve, reject) => {
      webWorker.onmessage = (messageEvent: MessageEvent<number[]>) => {
        resolve(messageEvent.data);
      };

      webWorker.onerror = (errorEvent: ErrorEvent) => {
        reject(errorEvent.error);
      };
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
