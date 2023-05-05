import {
  IDirectedAcyclicGraph,
  IWebWorkerMessage,
  IWebWorkerParameters
} from '../interfaces';
import { DirectedAcyclicGraphBase } from '../classes';
import { instantiateWasmModule } from '../utilities';
import { WasmModuleFunctionName, WebWorkerType } from '../enums';
import { WebWorkerResponse } from '../types';

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

  private static readonly _webWorkerUrls: Partial<Record<string, string>> = {};

  private static readonly _webWorkerOptions: WorkerOptions = {
    type: 'classic',
    credentials: 'omit'
  };

  private static _webWorkerId = BigInt(0);

  private static _nativeWebWorker<U extends WasmModuleFunctionName>() {
    self.onmessage = (messageEvent: MessageEvent<IWebWorkerMessage<U>>) => {
      // eslint-disable-next-line no-new-func
      const nativeFunction = new Function(
        ...messageEvent.data.webWorkerFunctionDefinition.argumentNames,
        messageEvent.data.webWorkerFunctionDefinition.functionBody
      );

      const result = nativeFunction(...messageEvent.data.webWorkerArguments);

      self.postMessage(result);
    };
  }

  private static _wasmWebWorker<U extends WasmModuleFunctionName>() {
    self.onmessage = (messageEvent: MessageEvent<IWebWorkerMessage<U>>) => {
      // eslint-disable-next-line @typescript-eslint/require-await
      const AsyncFunction = (async (_: unknown) => _).constructor;

      // eslint-disable-next-line new-cap
      const wasmModuleFactory = AsyncFunction(
        messageEvent.data.webWorkerFunctionDefinition.functionBody
      ) as typeof instantiateWasmModule;

      wasmModuleFactory().then((wasmModule) => {
        const result = (
          wasmModule[messageEvent.data.wasmModuleFunctionName] as (
            ...args: unknown[]
          ) => unknown
        )(...messageEvent.data.webWorkerArguments);

        self.postMessage(result);
      });
    };
  }

  private static async _createWebWorker<U extends WasmModuleFunctionName>(
    parameters: IWebWorkerParameters<U>
  ): Promise<WebWorkerResponse<U>> {
    const workerFunction = parameters.useWasm
      ? DirectedAcyclicGraph._wasmWebWorker
      : DirectedAcyclicGraph._nativeWebWorker;

    const webWorkerCode = `(${workerFunction.toString().trim()})()`;

    const webWorkerType = parameters.useWasm
      ? WebWorkerType.wasm
      : WebWorkerType.native;

    const webWorkerUrlName = `${parameters.wasmModuleFunctionName}-${webWorkerType}`;

    let webWorkerUrl =
      DirectedAcyclicGraph._webWorkerUrls[webWorkerUrlName] ?? '';

    if (!webWorkerUrl) {
      webWorkerUrl = URL.createObjectURL(
        new Blob([webWorkerCode], {
          type: 'text/javascript'
        })
      );

      DirectedAcyclicGraph._webWorkerUrls[webWorkerUrlName] = webWorkerUrl;
    }

    const workerOptions: WorkerOptions = {
      ...DirectedAcyclicGraph._webWorkerOptions,
      name: `DirectedAcyclicGraph-WebWorker-${webWorkerUrlName}-${++DirectedAcyclicGraph._webWorkerId}`
    };

    const webWorker = new Worker(webWorkerUrl, workerOptions);

    const promise = new Promise<WebWorkerResponse<U>>((resolve, reject) => {
      webWorker.onmessage = (
        messageEvent: MessageEvent<WebWorkerResponse<U>>
      ) => {
        resolve(messageEvent.data);
      };

      webWorker.onerror = (errorEvent: ErrorEvent) => {
        reject(errorEvent.error);
      };
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
