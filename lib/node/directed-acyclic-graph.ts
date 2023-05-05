import {
  IWebWorkerParameters,
  IDirectedAcyclicGraph,
  IWebWorkerMessage
} from '../interfaces';
import { DirectedAcyclicGraphBase } from '../classes';
import { Worker, WorkerOptions, MessagePort } from 'worker_threads';
import { instantiateWasmModule } from '../utilities';
import { WebWorkerResponse } from '../types';
import { WasmModuleFunctionName, WebWorkerType } from '../enums';

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

  private static readonly _webWorkerOptions: WorkerOptions = {
    eval: true
  };

  private static _nativeWebWorker<U extends WasmModuleFunctionName>() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parentPort = require('worker_threads').parentPort as MessagePort;

    parentPort.on('message', (message: IWebWorkerMessage<U>) => {
      // eslint-disable-next-line no-new-func
      const nativeFunction = new Function(
        ...message.webWorkerFunctionDefinition.argumentNames,
        message.webWorkerFunctionDefinition.functionBody
      );

      const result = nativeFunction(...message.webWorkerArguments);

      parentPort.postMessage(result);
    });
  }

  private static _wasmWebWorker<U extends WasmModuleFunctionName>() {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const parentPort = require('worker_threads').parentPort as MessagePort;

    parentPort.on('message', (message: IWebWorkerMessage<U>) => {
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

  private static async _createWebWorker<U extends WasmModuleFunctionName>(
    parameters: IWebWorkerParameters<U>
  ): Promise<WebWorkerResponse<U>> {
    const workerFunction = parameters.useWasm
      ? DirectedAcyclicGraph._wasmWebWorker
      : DirectedAcyclicGraph._nativeWebWorker;

    const webWorkerType = parameters.useWasm
      ? WebWorkerType.wasm
      : WebWorkerType.native;

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

    const webWorkerMessage: IWebWorkerMessage<U> = {
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

  public clone() {
    return new DirectedAcyclicGraph(this.vertices, this.outEdges);
  }
}
