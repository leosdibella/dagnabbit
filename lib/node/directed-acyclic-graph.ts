import { IDirectedAcyclicGraph } from 'lib/interfaces';
import { DirectedAcyclicGraphBase } from 'lib/classes';
import { instantiateWasmModule } from 'lib/utilities';
import {
  WebWorkerFunctionName,
  WebWorkerResponse,
  WebWorkerType,
  WebWorkerParameters,
  DirectedAcyclicGraphParameters,
  WebWorkerMessage
} from 'lib/types';
import { Worker, WorkerOptions, MessagePort } from 'worker_threads';

export class DirectedAcyclicGraph<T = unknown>
  extends DirectedAcyclicGraphBase<T>
  implements IDirectedAcyclicGraph<T>
{
  static {
    DirectedAcyclicGraphBase._supportsWasm = typeof WebAssembly === 'object';
    DirectedAcyclicGraphBase._supportsWebWorkers = typeof Worker === 'function';

    DirectedAcyclicGraphBase._webWorkerFactory =
      DirectedAcyclicGraph._createWebWorker;
  }

  private static readonly _webWorkerOptions: Readonly<WorkerOptions> = {
    eval: true
  };

  private static _nativeWebWorker<U extends WebWorkerFunctionName>() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parentPort = require('worker_threads').parentPort as MessagePort;

    parentPort.on('message', (message: WebWorkerMessage<U>) => {
      // eslint-disable-next-line no-new-func
      const nativeFunction = new Function(
        ...message.webWorkerFunctionDefinition.argumentNames,
        message.webWorkerFunctionDefinition.functionBody
      );

      const result = nativeFunction(...message.webWorkerArguments);

      parentPort.postMessage(result);
    });
  }

  private static _wasmWebWorker<U extends WebWorkerFunctionName>() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parentPort = require('worker_threads').parentPort as MessagePort;

    parentPort.on('message', (message: WebWorkerMessage<U>) => {
      // eslint-disable-next-line @typescript-eslint/require-await
      const AsyncFunction = (async (_: unknown) => _).constructor;

      // eslint-disable-next-line new-cap
      const wasmModuleFactory = AsyncFunction(
        message.webWorkerFunctionDefinition.functionBody
      ) as typeof instantiateWasmModule;

      wasmModuleFactory().then((wasmModule) => {
        const result = (
          wasmModule[message.wasmModuleFunctionName] as (
            ...args: unknown[]
          ) => unknown
        )(...message.webWorkerArguments);

        parentPort.postMessage(result);
      });
    });
  }

  private static async _createWebWorker<U extends WebWorkerFunctionName>(
    parameters: WebWorkerParameters<U>
  ): Promise<WebWorkerResponse<U>> {
    const workerFunction = parameters.useWasm
      ? DirectedAcyclicGraph._wasmWebWorker
      : DirectedAcyclicGraph._nativeWebWorker;

    const webWorkerType: WebWorkerType = parameters.useWasm ? 'wasm' : 'native';
    const webWorkerCode = `(function ${workerFunction.toString().trim()})()`;

    const webWorker = new Worker(
      webWorkerCode,
      DirectedAcyclicGraph._webWorkerOptions
    );

    const promise = new Promise<WebWorkerResponse<U>>((resolve, reject) => {
      webWorker.on('message', (response: WebWorkerResponse<U>) => {
        resolve(response);
      });

      webWorker.on('error', (error) => {
        reject(error);
      });
    });

    const webWorkerMessage: WebWorkerMessage<U> = {
      webWorkerArguments: parameters.webWorkerArguments,
      webWorkerFunctionDefinition:
        this._webWorkerFunctionDefinitions[parameters.wasmModuleFunctionName][
          webWorkerType
        ],
      wasmModuleFunctionName: parameters.wasmModuleFunctionName
    };

    webWorker.postMessage(webWorkerMessage);

    promise.finally(() => {
      webWorker.terminate();
    });

    return promise;
  }

  public clone(
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
}
